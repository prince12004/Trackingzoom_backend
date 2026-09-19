import { Schema, model, Document, Types } from 'mongoose';

export interface IPayment extends Document {
  order: Types.ObjectId;
  user: Types.ObjectId;
  provider: 'razorpay' | 'cod' | 'qr_manual';
  providerOrderId?: string;
  providerPaymentId?: string;
  providerSignature?: string;
  screenshotUrl?: string;
  verifiedBy?: Types.ObjectId;
  verifiedAt?: Date;
  amount: number;
  currency: string;
  status: 'pending' | 'pending_verification' | 'initiated' | 'processing' | 'success' | 'failed' | 'refunded' | 'partially_refunded';
  method?: string;
  failureReason?: string;
  rawResponse?: unknown;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    provider: { type: String, enum: ['razorpay', 'cod', 'qr_manual'], required: true },
    providerOrderId: { type: String, index: true },
    providerPaymentId: { type: String, index: true },
    providerSignature: String,
    screenshotUrl: String,
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
    verifiedAt: Date,
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['pending', 'pending_verification', 'initiated', 'processing', 'success', 'failed', 'refunded', 'partially_refunded'],
      default: 'pending',
    },
    method: String,
    failureReason: String,
    rawResponse: Schema.Types.Mixed,
  },
  { timestamps: true }
);

export const Payment = model<IPayment>('Payment', paymentSchema);
