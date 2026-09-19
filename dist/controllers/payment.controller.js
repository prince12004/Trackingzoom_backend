"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.razorpayWebhook = exports.verifyPayment = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const Payment_1 = require("../models/Payment");
const Order_1 = require("../models/Order");
const razorpay_service_1 = require("../services/razorpay.service");
const order_service_1 = require("../services/order.service");
const env_1 = require("../config/env");
exports.verifyPayment = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { orderId, razorpay_order_id: rpOrderId, razorpay_payment_id: rpPaymentId, razorpay_signature: rpSignature, } = req.body;
    const order = await Order_1.Order.findOne({ _id: orderId, user: req.userId });
    if (!order)
        throw ApiError_1.ApiError.notFound('Order not found');
    const payment = await Payment_1.Payment.findOne({ order: order._id });
    if (!payment)
        throw ApiError_1.ApiError.notFound('Payment record not found');
    if (payment.providerOrderId !== rpOrderId) {
        throw ApiError_1.ApiError.badRequest('Payment order mismatch');
    }
    const isValid = (0, razorpay_service_1.verifyPaymentSignature)(rpOrderId, rpPaymentId, rpSignature);
    if (!isValid) {
        payment.status = 'failed';
        payment.failureReason = 'Signature verification failed';
        await payment.save();
        order.paymentStatus = 'failed';
        await order.save();
        throw ApiError_1.ApiError.badRequest('Payment verification failed. If money was debited, it will be refunded automatically.');
    }
    payment.status = 'success';
    payment.providerPaymentId = rpPaymentId;
    payment.providerSignature = rpSignature;
    await payment.save();
    const confirmedOrder = await (0, order_service_1.confirmOrderPlacement)(order.id);
    (0, ApiResponse_1.sendSuccess)(res, { order: confirmedOrder }, 'Payment verified successfully');
});
exports.razorpayWebhook = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.rawBody;
    if (!env_1.env.razorpay.webhookSecret || !signature || !(0, razorpay_service_1.verifyWebhookSignature)(rawBody, signature)) {
        throw ApiError_1.ApiError.unauthorized('Invalid webhook signature');
    }
    const event = req.body;
    if (event.event === 'payment.captured') {
        const payment = await Payment_1.Payment.findOne({ providerOrderId: event.payload.payment.entity.order_id });
        if (payment && payment.status !== 'success') {
            payment.status = 'success';
            payment.providerPaymentId = event.payload.payment.entity.id;
            await payment.save();
            await (0, order_service_1.confirmOrderPlacement)(String(payment.order));
        }
    }
    else if (event.event === 'payment.failed') {
        const payment = await Payment_1.Payment.findOne({ providerOrderId: event.payload.payment.entity.order_id });
        if (payment) {
            payment.status = 'failed';
            await payment.save();
            const order = await Order_1.Order.findById(payment.order);
            if (order && order.orderStatus === 'pending') {
                await (0, order_service_1.cancelOrder)(String(order._id), undefined, 'Payment failed');
            }
        }
    }
    res.status(200).json({ received: true });
});
//# sourceMappingURL=payment.controller.js.map