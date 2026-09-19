"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAddNote = exports.adminDownloadInvoice = exports.adminUpdateOrderStatus = exports.adminGetOrder = exports.adminListOrders = exports.requestReturn = exports.downloadMyInvoice = exports.cancelMyOrder = exports.getMyOrder = exports.listMyOrders = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const Order_1 = require("../models/Order");
const order_service_1 = require("../services/order.service");
const notification_service_1 = require("../services/notification.service");
const email_service_1 = require("../services/email.service");
const invoice_service_1 = require("../services/invoice.service");
const User_1 = require("../models/User");
exports.listMyOrders = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { page = '1', limit = '10', status } = req.query;
    const filter = { user: req.userId };
    if (status)
        filter.orderStatus = status;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const [items, total] = await Promise.all([
        Order_1.Order.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
        Order_1.Order.countDocuments(filter),
    ]);
    (0, ApiResponse_1.sendSuccess)(res, items, 'Orders fetched', 200, (0, ApiResponse_1.buildPagination)(pageNum, limitNum, total));
});
exports.getMyOrder = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const order = await Order_1.Order.findOne({ _id: req.params.id, user: req.userId });
    if (!order)
        throw ApiError_1.ApiError.notFound('Order not found');
    (0, ApiResponse_1.sendSuccess)(res, order);
});
exports.cancelMyOrder = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { reason } = req.body;
    const order = await (0, order_service_1.cancelOrder)(req.params.id, req.userId, reason);
    (0, ApiResponse_1.sendSuccess)(res, order, 'Order cancelled successfully');
});
exports.downloadMyInvoice = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const order = await Order_1.Order.findOne({ _id: req.params.id, user: req.userId });
    if (!order)
        throw ApiError_1.ApiError.notFound('Order not found');
    if (!order.invoiceNumber)
        throw ApiError_1.ApiError.badRequest('Invoice is not yet available for this order');
    await (0, invoice_service_1.streamInvoicePdf)(order, res);
});
exports.requestReturn = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { reason } = req.body;
    const order = await Order_1.Order.findOne({ _id: req.params.id, user: req.userId });
    if (!order)
        throw ApiError_1.ApiError.notFound('Order not found');
    if (order.orderStatus !== 'delivered') {
        throw ApiError_1.ApiError.badRequest('Only delivered orders can be returned');
    }
    order.orderStatus = 'return_requested';
    order.statusHistory.push({ status: 'return_requested', note: reason, changedAt: new Date() });
    await order.save();
    (0, ApiResponse_1.sendSuccess)(res, order, 'Return request submitted');
});
// ---- Admin ----
exports.adminListOrders = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { page = '1', limit = '20', status, search } = req.query;
    const filter = {};
    if (status)
        filter.orderStatus = status;
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
        Order_1.Order.find(filter)
            .populate('user', 'name mobile email')
            .sort({ createdAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum),
        Order_1.Order.countDocuments(filter),
    ]);
    (0, ApiResponse_1.sendSuccess)(res, items, 'Orders fetched', 200, (0, ApiResponse_1.buildPagination)(pageNum, limitNum, total));
});
exports.adminGetOrder = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const order = await Order_1.Order.findById(req.params.id).populate('user', 'name mobile email');
    if (!order)
        throw ApiError_1.ApiError.notFound('Order not found');
    (0, ApiResponse_1.sendSuccess)(res, order);
});
const NEXT_ALLOWED = {
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
exports.adminUpdateOrderStatus = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { status, note, courier, trackingNumber } = req.body;
    const order = await Order_1.Order.findById(req.params.id);
    if (!order)
        throw ApiError_1.ApiError.notFound('Order not found');
    const allowed = NEXT_ALLOWED[order.orderStatus] || [];
    if (!allowed.includes(status)) {
        throw ApiError_1.ApiError.badRequest(`Cannot move order from ${order.orderStatus} to ${status}`);
    }
    order.orderStatus = status;
    if (courier)
        order.courier = courier;
    if (trackingNumber)
        order.trackingNumber = trackingNumber;
    order.statusHistory.push({ status: order.orderStatus, note, changedBy: req.adminId, changedAt: new Date() });
    await order.save();
    const user = await User_1.User.findById(order.user);
    await (0, notification_service_1.createNotification)({
        recipientType: 'customer',
        recipient: String(order.user),
        type: 'order_status_update',
        title: 'Order status updated',
        message: `Your order ${order.orderNumber} is now ${status.replace(/_/g, ' ')}.`,
        link: `/account/orders/${order._id}`,
    });
    if (user?.email) {
        await (0, email_service_1.sendEmail)({
            to: user.email,
            subject: `Order ${order.orderNumber} — ${status.replace(/_/g, ' ')}`,
            html: `<p>Your order <strong>${order.orderNumber}</strong> status has been updated to <strong>${status.replace(/_/g, ' ')}</strong>.</p>`,
        });
    }
    (0, ApiResponse_1.sendSuccess)(res, order, 'Order status updated');
});
exports.adminDownloadInvoice = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const order = await Order_1.Order.findById(req.params.id);
    if (!order)
        throw ApiError_1.ApiError.notFound('Order not found');
    if (!order.invoiceNumber)
        throw ApiError_1.ApiError.badRequest('Invoice is not yet available for this order');
    await (0, invoice_service_1.streamInvoicePdf)(order, res);
});
exports.adminAddNote = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { note } = req.body;
    const order = await Order_1.Order.findByIdAndUpdate(req.params.id, { adminNotes: note }, { new: true });
    if (!order)
        throw ApiError_1.ApiError.notFound('Order not found');
    (0, ApiResponse_1.sendSuccess)(res, order, 'Note saved');
});
//# sourceMappingURL=order.controller.js.map