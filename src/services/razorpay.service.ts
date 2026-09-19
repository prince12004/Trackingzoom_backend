import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

let client: Razorpay | null = null;

function getClient(): Razorpay {
  if (!env.razorpay.keyId || !env.razorpay.keySecret) {
    throw ApiError.internal(
      'Payment gateway is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.'
    );
  }
  if (!client) {
    client = new Razorpay({ key_id: env.razorpay.keyId, key_secret: env.razorpay.keySecret });
  }
  return client;
}

export async function createRazorpayOrder(amountInRupees: number, receipt: string) {
  const rp = getClient();
  return rp.orders.create({
    amount: Math.round(amountInRupees * 100),
    currency: 'INR',
    receipt,
    payment_capture: true,
  });
}

export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  const expected = crypto
    .createHmac('sha256', env.razorpay.keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return expected === signature;
}

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const expected = crypto
    .createHmac('sha256', env.razorpay.webhookSecret)
    .update(rawBody)
    .digest('hex');
  return expected === signature;
}

export async function initiateRazorpayRefund(paymentId: string, amountInRupees: number) {
  const rp = getClient();
  return rp.payments.refund(paymentId, { amount: Math.round(amountInRupees * 100) });
}
