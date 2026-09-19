"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.initiateCheckout = initiateCheckout;
exports.confirmOrderPlacement = confirmOrderPlacement;
exports.cancelOrder = cancelOrder;
const Order_1 = require("../models/Order");
const Payment_1 = require("../models/Payment");
const Address_1 = require("../models/Address");
const Cart_1 = require("../models/Cart");
const User_1 = require("../models/User");
const Setting_1 = require("../models/Setting");
const cart_service_1 = require("./cart.service");
const inventory_service_1 = require("./inventory.service");
const razorpay_service_1 = require("./razorpay.service");
const sequence_1 = require("../utils/sequence");
const ApiError_1 = require("../utils/ApiError");
const sms_service_1 = require("./sms.service");
const email_service_1 = require("./email.service");
const notification_service_1 = require("./notification.service");
const abandonedCart_service_1 = require("./abandonedCart.service");
async function generateOrderNumber() {
    const year = new Date().getFullYear();
    const seq = await (0, sequence_1.nextSequence)(`order-${year}`);
    return `ORD${year}${String(seq).padStart(6, '0')}`;
}
async function generateInvoiceNumber() {
    const settings = await (0, Setting_1.getSettings)();
    const now = new Date();
    const fy = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    const fyLabel = `${fy}-${(fy + 1).toString().slice(-2)}`;
    const key = settings.business.invoiceFinancialYearReset ? `invoice-${fyLabel}` : 'invoice-global';
    const seq = await (0, sequence_1.nextSequence)(key);
    return `${settings.business.invoicePrefix}/${fyLabel}/${String(seq).padStart(5, '0')}`;
}
function addressToSnapshot(addr) {
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
async function initiateCheckout({ userId, addressId, paymentMethod }) {
    const settings = await (0, Setting_1.getSettings)();
    const address = await Address_1.Address.findOne({ _id: addressId, user: userId });
    if (!address)
        throw ApiError_1.ApiError.notFound('Address not found');
    const cart = await (0, cart_service_1.getOrCreateCart)(userId);
    const summary = await (0, cart_service_1.priceCart)(cart, paymentMethod);
    const checkoutLines = summary.lines.filter((l) => !l.savedForLater);
    if (checkoutLines.length === 0)
        throw ApiError_1.ApiError.badRequest('Your cart is empty');
    const stockIssues = checkoutLines.filter((l) => !l.stockOk);
    if (stockIssues.length > 0) {
        throw ApiError_1.ApiError.badRequest(`Insufficient stock for: ${stockIssues.map((l) => l.name).join(', ')}. Please update your cart.`);
    }
    if (summary.couponError) {
        throw ApiError_1.ApiError.badRequest(summary.couponError);
    }
    if (paymentMethod === 'cod') {
        if (!settings.payment.codEnabled)
            throw ApiError_1.ApiError.badRequest('Cash on Delivery is currently unavailable');
        if (summary.totalAmount < settings.payment.codMinOrderAmount) {
            throw ApiError_1.ApiError.badRequest(`COD is available only for orders above ₹${settings.payment.codMinOrderAmount}`);
        }
        if (summary.totalAmount > settings.payment.codMaxOrderAmount) {
            throw ApiError_1.ApiError.badRequest(`COD is not available for orders above ₹${settings.payment.codMaxOrderAmount}`);
        }
        const codBlocked = checkoutLines.filter((l) => !l.codAvailable);
        if (codBlocked.length > 0) {
            throw ApiError_1.ApiError.badRequest(`COD is not available for: ${codBlocked.map((l) => l.name).join(', ')}`);
        }
    }
    else if (!settings.payment.onlinePaymentEnabled) {
        throw ApiError_1.ApiError.badRequest('Online payment is currently unavailable. Please choose COD.');
    }
    const order = await (0, inventory_service_1.withTransaction)(async (session) => {
        for (const line of checkoutLines) {
            await (0, inventory_service_1.reserveStock)({
                productId: line.product,
                variantId: line.variant,
                quantity: line.quantity,
                movementType: 'order',
                referenceId: undefined,
            }, session);
        }
        const orderNumber = await generateOrderNumber();
        const addressSnapshot = addressToSnapshot(address);
        const [createdOrder] = await Order_1.Order.create([
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
                paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
                orderStatus: 'pending',
                statusHistory: [{ status: 'pending', changedAt: new Date() }],
            },
        ], { session });
        await Payment_1.Payment.create([
            {
                order: createdOrder._id,
                user: userId,
                provider: paymentMethod === 'cod' ? 'cod' : 'razorpay',
                amount: summary.totalAmount,
                status: paymentMethod === 'cod' ? 'pending' : 'pending',
            },
        ], { session });
        return createdOrder;
    });
    if (paymentMethod === 'cod') {
        await confirmOrderPlacement(order.id);
        return { order: await Order_1.Order.findById(order.id), paymentMethod: 'cod' };
    }
    const rpOrder = await (0, razorpay_service_1.createRazorpayOrder)(summary.totalAmount, order.orderNumber);
    await Payment_1.Payment.findOneAndUpdate({ order: order._id }, { providerOrderId: rpOrder.id });
    return {
        order,
        paymentMethod: 'online',
        razorpay: { orderId: rpOrder.id, amount: rpOrder.amount, currency: rpOrder.currency },
    };
}
async function confirmOrderPlacement(orderId) {
    const order = await Order_1.Order.findById(orderId);
    if (!order)
        throw ApiError_1.ApiError.notFound('Order not found');
    if (order.orderStatus !== 'pending')
        return order;
    await (0, inventory_service_1.withTransaction)(async (session) => {
        for (const item of order.items) {
            await (0, inventory_service_1.confirmSale)({ productId: item.product, variantId: item.variant, quantity: item.quantity, movementType: 'order' }, session);
        }
        order.orderStatus = 'confirmed';
        order.paymentStatus = order.paymentMethod === 'cod' ? 'pending' : 'success';
        order.invoiceNumber = await generateInvoiceNumber();
        order.statusHistory.push({ status: 'confirmed', changedAt: new Date() });
        await order.save({ session });
        if (order.coupon) {
            const { Coupon } = await Promise.resolve().then(() => __importStar(require('../models/Coupon')));
            await Coupon.findByIdAndUpdate(order.coupon, { $inc: { usedCount: 1 } }, { session });
        }
        await Cart_1.Cart.findOneAndUpdate({ user: order.user }, { items: [], coupon: null }, { session });
    });
    await (0, abandonedCart_service_1.markCartRecovered)(String(order.user), order.id);
    await notifyOrderPlaced(order);
    return order;
}
async function cancelOrder(orderId, userId, reason) {
    const order = await Order_1.Order.findById(orderId);
    if (!order)
        throw ApiError_1.ApiError.notFound('Order not found');
    if (userId && String(order.user) !== userId)
        throw ApiError_1.ApiError.forbidden('Not your order');
    if (!['pending', 'confirmed', 'processing'].includes(order.orderStatus)) {
        throw ApiError_1.ApiError.badRequest('This order can no longer be cancelled');
    }
    await (0, inventory_service_1.withTransaction)(async (session) => {
        for (const item of order.items) {
            await (0, inventory_service_1.releaseReservedStock)({ productId: item.product, variantId: item.variant, quantity: item.quantity, movementType: 'cancellation' }, session);
        }
        order.orderStatus = 'cancelled';
        order.cancelReason = reason;
        order.statusHistory.push({ status: 'cancelled', note: reason, changedAt: new Date() });
        await order.save({ session });
    });
    return order;
}
async function notifyOrderPlaced(order) {
    const user = await User_1.User.findById(order.user);
    if (!user)
        return;
    await (0, notification_service_1.createNotification)({
        recipientType: 'customer',
        recipient: String(user._id),
        type: 'order_placed',
        title: 'Order placed successfully',
        message: `Your order ${order.orderNumber} has been placed successfully.`,
        link: `/account/orders/${order._id}`,
    });
    await (0, notification_service_1.createNotification)({
        recipientType: 'admin',
        type: 'new_order',
        title: 'New order received',
        message: `New order ${order.orderNumber} for ₹${order.totalAmount} from ${user.name}.`,
        link: `/admin/orders/${order._id}`,
    });
    if (user.mobile) {
        await (0, sms_service_1.sendSms)({
            mobile: user.mobile,
            message: `Your TrackingZoom GPS order ${order.orderNumber} for ₹${order.totalAmount} has been placed successfully.`,
        });
    }
    if (user.email) {
        await (0, email_service_1.sendEmail)({
            to: user.email,
            subject: `Order Confirmed — ${order.orderNumber}`,
            html: `<p>Hi ${user.name},</p><p>Your order <strong>${order.orderNumber}</strong> totalling ₹${order.totalAmount} has been placed successfully.</p>`,
        });
    }
}
//# sourceMappingURL=order.service.js.map