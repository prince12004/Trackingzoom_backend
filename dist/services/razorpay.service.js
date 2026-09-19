"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRazorpayOrder = createRazorpayOrder;
exports.verifyPaymentSignature = verifyPaymentSignature;
exports.verifyWebhookSignature = verifyWebhookSignature;
exports.initiateRazorpayRefund = initiateRazorpayRefund;
const razorpay_1 = __importDefault(require("razorpay"));
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../config/env");
const ApiError_1 = require("../utils/ApiError");
let client = null;
function getClient() {
    if (!env_1.env.razorpay.keyId || !env_1.env.razorpay.keySecret) {
        throw ApiError_1.ApiError.internal('Payment gateway is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.');
    }
    if (!client) {
        client = new razorpay_1.default({ key_id: env_1.env.razorpay.keyId, key_secret: env_1.env.razorpay.keySecret });
    }
    return client;
}
async function createRazorpayOrder(amountInRupees, receipt) {
    const rp = getClient();
    return rp.orders.create({
        amount: Math.round(amountInRupees * 100),
        currency: 'INR',
        receipt,
        payment_capture: true,
    });
}
function verifyPaymentSignature(orderId, paymentId, signature) {
    const expected = crypto_1.default
        .createHmac('sha256', env_1.env.razorpay.keySecret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');
    return expected === signature;
}
function verifyWebhookSignature(rawBody, signature) {
    const expected = crypto_1.default
        .createHmac('sha256', env_1.env.razorpay.webhookSecret)
        .update(rawBody)
        .digest('hex');
    return expected === signature;
}
async function initiateRazorpayRefund(paymentId, amountInRupees) {
    const rp = getClient();
    return rp.payments.refund(paymentId, { amount: Math.round(amountInRupees * 100) });
}
//# sourceMappingURL=razorpay.service.js.map