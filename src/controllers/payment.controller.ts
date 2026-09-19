import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { Payment } from '../models/Payment';
import { Order } from '../models/Order';
import { verifyPaymentSignature, verifyWebhookSignature } from '../services/razorpay.service';
import { confirmOrderPlacement, cancelOrder } from '../services/order.service';
import { env } from '../config/env';

export const verifyPayment = catchAsync(async (req: Request, res: Response) => {
  const {
    orderId,
    razorpay_order_id: rpOrderId,
    razorpay_payment_id: rpPaymentId,
    razorpay_signature: rpSignature,
  } = req.body as {
    orderId: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  };

  const order = await Order.findOne({ _id: orderId, user: req.userId });
  if (!order) throw ApiError.notFound('Order not found');

  const payment = await Payment.findOne({ order: order._id });
  if (!payment) throw ApiError.notFound('Payment record not found');

  if (payment.providerOrderId !== rpOrderId) {
    throw ApiError.badRequest('Payment order mismatch');
  }

  const isValid = verifyPaymentSignature(rpOrderId, rpPaymentId, rpSignature);

  if (!isValid) {
    payment.status = 'failed';
    payment.failureReason = 'Signature verification failed';
    await payment.save();
    order.paymentStatus = 'failed';
    await order.save();
    throw ApiError.badRequest('Payment verification failed. If money was debited, it will be refunded automatically.');
  }

  payment.status = 'success';
  payment.providerPaymentId = rpPaymentId;
  payment.providerSignature = rpSignature;
  await payment.save();

  const confirmedOrder = await confirmOrderPlacement(order.id);

  sendSuccess(res, { order: confirmedOrder }, 'Payment verified successfully');
});

export const razorpayWebhook = catchAsync(async (req: Request, res: Response) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  const rawBody = (req as unknown as { rawBody: string }).rawBody;

  if (!env.razorpay.webhookSecret || !signature || !verifyWebhookSignature(rawBody, signature)) {
    throw ApiError.unauthorized('Invalid webhook signature');
  }

  const event = req.body as {
    event: string;
    payload: { payment: { entity: { order_id: string; id: string } } };
  };

  if (event.event === 'payment.captured') {
    const payment = await Payment.findOne({ providerOrderId: event.payload.payment.entity.order_id });
    if (payment && payment.status !== 'success') {
      payment.status = 'success';
      payment.providerPaymentId = event.payload.payment.entity.id;
      await payment.save();
      await confirmOrderPlacement(String(payment.order));
    }
  } else if (event.event === 'payment.failed') {
    const payment = await Payment.findOne({ providerOrderId: event.payload.payment.entity.order_id });
    if (payment) {
      payment.status = 'failed';
      await payment.save();
      const order = await Order.findById(payment.order);
      if (order && order.orderStatus === 'pending') {
        await cancelOrder(String(order._id), undefined, 'Payment failed');
      }
    }
  }

  res.status(200).json({ received: true });
});
