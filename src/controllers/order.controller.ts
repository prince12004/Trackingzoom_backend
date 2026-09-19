import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess, buildPagination } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { Order } from '../models/Order';
import { cancelOrder, submitPaymentProof, verifyManualPayment } from '../services/order.service';
import { createNotification } from '../services/notification.service';
import { sendEmail } from '../services/email.service';
import { streamInvoicePdf } from '../services/invoice.service';
import { User } from '../models/User';

export const listMyOrders = catchAsync(async (req: Request, res: Response) => {
  const { page = '1', limit = '10', status } = req.query as Record<string, string>;
  const filter: Record<string, unknown> = { user: req.userId };
  if (status) filter.orderStatus = status;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));

  const [items, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
    Order.countDocuments(filter),
  ]);

  sendSuccess(res, items, 'Orders fetched', 200, buildPagination(pageNum, limitNum, total));
});

export const getMyOrder = catchAsync(async (req: Request, res: Response) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.userId });
  if (!order) throw ApiError.notFound('Order not found');
  sendSuccess(res, order);
});

export const cancelMyOrder = catchAsync(async (req: Request, res: Response) => {
  const { reason } = req.body as { reason: string };
  const order = await cancelOrder(req.params.id, req.userId, reason);
  sendSuccess(res, order, 'Order cancelled successfully');
});

export const downloadMyInvoice = catchAsync(async (req: Request, res: Response) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.userId });
  if (!order) throw ApiError.notFound('Order not found');
  if (!order.invoiceNumber) throw ApiError.badRequest('Invoice is not yet available for this order');
  await streamInvoicePdf(order, res);
});

export const submitMyPaymentProof = catchAsync(async (req: Request, res: Response) => {
  const { screenshotUrl } = req.body as { screenshotUrl: string };
  const order = await submitPaymentProof(req.params.id, req.userId!, screenshotUrl);
  sendSuccess(res, order, 'Payment screenshot submitted — we will verify and confirm shortly.');
});

export const requestReturn = catchAsync(async (req: Request, res: Response) => {
  const { reason } = req.body as { reason: string };
  const order = await Order.findOne({ _id: req.params.id, user: req.userId });
  if (!order) throw ApiError.notFound('Order not found');
  if (order.orderStatus !== 'delivered') {
    throw ApiError.badRequest('Only delivered orders can be returned');
  }
  order.orderStatus = 'return_requested';
  order.statusHistory.push({ status: 'return_requested', note: reason, changedAt: new Date() });
  await order.save();
  sendSuccess(res, order, 'Return request submitted');
});

// ---- Admin ----

export const adminListOrders = catchAsync(async (req: Request, res: Response) => {
  const { page = '1', limit = '20', status, search } = req.query as Record<string, string>;
  const filter: Record<string, unknown> = {};
  if (status) filter.orderStatus = status;
  if (search) {
    filter.$or = [
      { orderNumber: new RegExp(search, 'i') },
      { 'shippingAddress.mobile': new RegExp(search, 'i') },
      { 'shippingAddress.name': new RegExp(search, 'i') },
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  const [items, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'name mobile email')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Order.countDocuments(filter),
  ]);

  sendSuccess(res, items, 'Orders fetched', 200, buildPagination(pageNum, limitNum, total));
});

export const adminGetOrder = catchAsync(async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.id).populate('user', 'name mobile email');
  if (!order) throw ApiError.notFound('Order not found');
  sendSuccess(res, order);
});

const NEXT_ALLOWED: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['packed', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered: ['return_requested'],
  return_requested: ['returned'],
  returned: ['refunded'],
};

export const adminUpdateOrderStatus = catchAsync(async (req: Request, res: Response) => {
  const { status, note, courier, trackingNumber } = req.body as {
    status: string;
    note?: string;
    courier?: string;
    trackingNumber?: string;
  };

  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');

  const allowed = NEXT_ALLOWED[order.orderStatus] || [];
  if (!allowed.includes(status)) {
    throw ApiError.badRequest(`Cannot move order from ${order.orderStatus} to ${status}`);
  }

  order.orderStatus = status as typeof order.orderStatus;
  if (courier) order.courier = courier;
  if (trackingNumber) order.trackingNumber = trackingNumber;
  order.statusHistory.push({ status: order.orderStatus, note, changedBy: req.adminId as never, changedAt: new Date() });
  await order.save();

  const user = await User.findById(order.user);
  await createNotification({
    recipientType: 'customer',
    recipient: String(order.user),
    type: 'order_status_update',
    title: 'Order status updated',
    message: `Your order ${order.orderNumber} is now ${status.replace(/_/g, ' ')}.`,
    link: `/account/orders/${order._id}`,
  });
  if (user?.email) {
    await sendEmail({
      to: user.email,
      subject: `Order ${order.orderNumber} — ${status.replace(/_/g, ' ')}`,
      html: `<p>Your order <strong>${order.orderNumber}</strong> status has been updated to <strong>${status.replace(/_/g, ' ')}</strong>.</p>`,
    });
  }

  sendSuccess(res, order, 'Order status updated');
});

export const adminDownloadInvoice = catchAsync(async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');
  if (!order.invoiceNumber) throw ApiError.badRequest('Invoice is not yet available for this order');
  await streamInvoicePdf(order, res);
});

export const adminVerifyPayment = catchAsync(async (req: Request, res: Response) => {
  const { approved } = req.body as { approved: boolean };
  const order = await verifyManualPayment(req.params.id, req.adminId!, approved);
  sendSuccess(res, order, approved ? 'Payment marked as verified' : 'Payment marked as rejected');
});

export const adminAddNote = catchAsync(async (req: Request, res: Response) => {
  const { note } = req.body as { note: string };
  const order = await Order.findByIdAndUpdate(req.params.id, { adminNotes: note }, { new: true });
  if (!order) throw ApiError.notFound('Order not found');
  sendSuccess(res, order, 'Note saved');
});
