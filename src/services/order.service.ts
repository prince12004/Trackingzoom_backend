import { ClientSession } from 'mongoose';
import { Order, IOrder } from '../models/Order';
import { Payment } from '../models/Payment';
import { Address } from '../models/Address';
import { Cart } from '../models/Cart';
import { User } from '../models/User';
import { getSettings } from '../models/Setting';
import { getOrCreateCart, priceCart } from './cart.service';
import { reserveStock, releaseReservedStock, confirmSale, withTransaction } from './inventory.service';
import { createRazorpayOrder } from './razorpay.service';
import { nextSequence } from '../utils/sequence';
import { ApiError } from '../utils/ApiError';
import { sendSms } from './sms.service';
import { sendEmail } from './email.service';
import { createNotification } from './notification.service';
import { markCartRecovered } from './abandonedCart.service';

async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const seq = await nextSequence(`order-${year}`);
  return `ORD${year}${String(seq).padStart(6, '0')}`;
}

async function generateInvoiceNumber(): Promise<string> {
  const settings = await getSettings();
  const now = new Date();
  const fy = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const fyLabel = `${fy}-${(fy + 1).toString().slice(-2)}`;
  const key = settings.business.invoiceFinancialYearReset ? `invoice-${fyLabel}` : 'invoice-global';
  const seq = await nextSequence(key);
  return `${settings.business.invoicePrefix}/${fyLabel}/${String(seq).padStart(5, '0')}`;
}

function addressToSnapshot(addr: { name: string; mobile: string; email?: string; addressLine1: string; addressLine2?: string; landmark?: string; city: string; state: string; pincode: string; country: string }) {
  return {
    name: addr.name,
    mobile: addr.mobile,
    email: addr.email,
    addressLine1: addr.addressLine1,
    addressLine2: addr.addressLine2,
    landmark: addr.landmark,
    city: addr.city,
    state: addr.state,
    pincode: addr.pincode,
    country: addr.country,
  };
}

interface InitiateCheckoutInput {
  userId: string;
  addressId: string;
  paymentMethod: 'online' | 'cod' | 'qr_manual';
  screenshotUrl?: string;
}

export async function initiateCheckout({ userId, addressId, paymentMethod, screenshotUrl }: InitiateCheckoutInput) {
  const settings = await getSettings();

  if (paymentMethod === 'qr_manual' && !screenshotUrl) {
    throw ApiError.badRequest('Please upload your payment screenshot before placing the order.');
  }

  const address = await Address.findOne({ _id: addressId, user: userId });
  if (!address) throw ApiError.notFound('Address not found');

  const cart = await getOrCreateCart(userId);
  const summary = await priceCart(cart, paymentMethod);
  const checkoutLines = summary.lines.filter((l) => !l.savedForLater);

  if (checkoutLines.length === 0) throw ApiError.badRequest('Your cart is empty');

  const stockIssues = checkoutLines.filter((l) => !l.stockOk);
  if (stockIssues.length > 0) {
    throw ApiError.badRequest(
      `Insufficient stock for: ${stockIssues.map((l) => l.name).join(', ')}. Please update your cart.`
    );
  }

  if (summary.couponError) {
    throw ApiError.badRequest(summary.couponError);
  }

  if (paymentMethod === 'cod') {
    if (!settings.payment.codEnabled) throw ApiError.badRequest('Cash on Delivery is currently unavailable');
    if (summary.totalAmount < settings.payment.codMinOrderAmount) {
      throw ApiError.badRequest(`COD is available only for orders above ₹${settings.payment.codMinOrderAmount}`);
    }
    if (summary.totalAmount > settings.payment.codMaxOrderAmount) {
      throw ApiError.badRequest(`COD is not available for orders above ₹${settings.payment.codMaxOrderAmount}`);
    }
    const codBlocked = checkoutLines.filter((l) => !l.codAvailable);
    if (codBlocked.length > 0) {
      throw ApiError.badRequest(`COD is not available for: ${codBlocked.map((l) => l.name).join(', ')}`);
    }
  } else if (paymentMethod === 'qr_manual') {
    if (!settings.payment.qrPaymentEnabled) throw ApiError.badRequest('QR payment is currently unavailable');
  } else if (!settings.payment.onlinePaymentEnabled) {
    throw ApiError.badRequest('Online payment is currently unavailable. Please choose COD.');
  }

  const order = await withTransaction(async (session: ClientSession) => {
    for (const line of checkoutLines) {
      await reserveStock(
        {
          productId: line.product,
          variantId: line.variant,
          quantity: line.quantity,
          movementType: 'order',
          referenceId: undefined,
        },
        session
      );
    }

    const orderNumber = await generateOrderNumber();
    const addressSnapshot = addressToSnapshot(address);

    const [createdOrder] = await Order.create(
      [
        {
          orderNumber,
          user: userId,
          items: checkoutLines.map((l) => ({
            product: l.product,
            variant: l.variant,
            name: l.name,
            sku: l.sku,
            image: l.image,
            quantity: l.quantity,
            price: l.unitPrice,
            regularPrice: l.regularPrice,
            gstPercentage: l.gstPercentage,
            taxAmount: l.lineTax,
            lineTotal: l.lineTotal,
            requiresInstallation: l.requiresInstallation,
            requiresSubscription: l.requiresSubscription,
          })),
          shippingAddress: addressSnapshot,
          billingAddress: addressSnapshot,
          subtotal: summary.subtotal,
          discountAmount: summary.discountAmount,
          taxAmount: summary.taxAmount,
          shippingCharge: summary.shippingCharge,
          codCharge: summary.codCharge,
          totalAmount: summary.totalAmount,
          coupon: cart.coupon,
          couponCode: summary.couponCode,
          paymentMethod,
          paymentStatus: 'pending',
          paymentScreenshotUrl: paymentMethod === 'qr_manual' ? screenshotUrl : undefined,
          orderStatus: 'pending',
          statusHistory: [{ status: 'pending', changedAt: new Date() }],
        },
      ],
      { session }
    );

    await Payment.create(
      [
        {
          order: createdOrder._id,
          user: userId,
          provider: paymentMethod === 'cod' ? 'cod' : paymentMethod === 'qr_manual' ? 'qr_manual' : 'razorpay',
          amount: summary.totalAmount,
          screenshotUrl: paymentMethod === 'qr_manual' ? screenshotUrl : undefined,
          status: 'pending',
        },
      ],
      { session }
    );

    return createdOrder;
  });

  if (paymentMethod === 'cod' || paymentMethod === 'qr_manual') {
    await confirmOrderPlacement(order.id);
    return { order: await Order.findById(order.id), paymentMethod };
  }

  const rpOrder = await createRazorpayOrder(summary.totalAmount, order.orderNumber);
  await Payment.findOneAndUpdate({ order: order._id }, { providerOrderId: rpOrder.id });

  return {
    order,
    paymentMethod: 'online' as const,
    razorpay: { orderId: rpOrder.id, amount: rpOrder.amount, currency: rpOrder.currency },
  };
}

export async function confirmOrderPlacement(orderId: string) {
  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound('Order not found');
  if (order.orderStatus !== 'pending') return order;

  await withTransaction(async (session) => {
    for (const item of order.items) {
      await confirmSale(
        { productId: item.product, variantId: item.variant, quantity: item.quantity, movementType: 'order' },
        session
      );
    }

    order.orderStatus = 'confirmed';
    order.paymentStatus =
      order.paymentMethod === 'cod' ? 'pending' : order.paymentMethod === 'qr_manual' ? 'pending_verification' : 'success';
    order.invoiceNumber = await generateInvoiceNumber();
    order.statusHistory.push({ status: 'confirmed', changedAt: new Date() });
    await order.save({ session });

    if (order.coupon) {
      const { Coupon } = await import('../models/Coupon');
      await Coupon.findByIdAndUpdate(order.coupon, { $inc: { usedCount: 1 } }, { session });
    }

    await Cart.findOneAndUpdate({ user: order.user }, { items: [], coupon: null }, { session });
  });

  await markCartRecovered(String(order.user), order.id);
  await notifyOrderPlaced(order);
  return order;
}

export async function submitPaymentProof(orderId: string, userId: string, screenshotUrl: string) {
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) throw ApiError.notFound('Order not found');
  if (order.paymentMethod !== 'qr_manual') throw ApiError.badRequest('This order does not use QR payment');
  if (order.paymentStatus === 'success') throw ApiError.badRequest('This order is already marked as paid');

  order.paymentScreenshotUrl = screenshotUrl;
  order.paymentStatus = 'pending_verification';
  await order.save();
  await Payment.findOneAndUpdate({ order: order._id }, { screenshotUrl, status: 'pending_verification' });
  return order;
}

export async function verifyManualPayment(orderId: string, adminId: string, approved: boolean) {
  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound('Order not found');
  if (order.paymentMethod !== 'qr_manual') throw ApiError.badRequest('This order does not use QR payment');

  order.paymentStatus = approved ? 'success' : 'failed';
  await order.save();
  await Payment.findOneAndUpdate(
    { order: order._id },
    { status: approved ? 'success' : 'failed', verifiedBy: adminId, verifiedAt: new Date() }
  );
  return order;
}

export async function cancelOrder(orderId: string, userId: string | undefined, reason: string) {
  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound('Order not found');
  if (userId && String(order.user) !== userId) throw ApiError.forbidden('Not your order');

  if (!['pending', 'confirmed', 'processing'].includes(order.orderStatus)) {
    throw ApiError.badRequest('This order can no longer be cancelled');
  }

  await withTransaction(async (session) => {
    for (const item of order.items) {
      await releaseReservedStock(
        { productId: item.product, variantId: item.variant, quantity: item.quantity, movementType: 'cancellation' },
        session
      );
    }
    order.orderStatus = 'cancelled';
    order.cancelReason = reason;
    order.statusHistory.push({ status: 'cancelled', note: reason, changedAt: new Date() });
    await order.save({ session });
  });

  return order;
}

async function notifyOrderPlaced(order: IOrder) {
  const user = await User.findById(order.user);
  if (!user) return;

  await createNotification({
    recipientType: 'customer',
    recipient: String(user._id),
    type: 'order_placed',
    title: 'Order placed successfully',
    message: `Your order ${order.orderNumber} has been placed successfully.`,
    link: `/account/orders/${order._id}`,
  });

  await createNotification({
    recipientType: 'admin',
    type: 'new_order',
    title: 'New order received',
    message: `New order ${order.orderNumber} for ₹${order.totalAmount} from ${user.name}.`,
    link: `/admin/orders/${order._id}`,
  });

  if (user.mobile) {
    await sendSms({
      mobile: user.mobile,
      message: `Your TrackingZoom GPS order ${order.orderNumber} for ₹${order.totalAmount} has been placed successfully.`,
    });
  }
  if (user.email) {
    await sendEmail({
      to: user.email,
      subject: `Order Confirmed — ${order.orderNumber}`,
      html: `<p>Hi ${user.name},</p><p>Your order <strong>${order.orderNumber}</strong> totalling ₹${order.totalAmount} has been placed successfully.</p>`,
    });
  }
}
