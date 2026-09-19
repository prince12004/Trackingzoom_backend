import { Schema, model, Document, Types } from 'mongoose';

export interface IRefund extends Document {
  order: Types.ObjectId;
  payment: Types.ObjectId;
  amount: number;
  reason?: string;
  status: 'initiated' | 'processing' | 'completed' | 'failed';
  providerRefundId?: string;
  processedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const refundSchema = new Schema<IRefund>(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    payment: { type: Schema.Types.ObjectId, ref: 'Payment', required: true },
    amount: { type: Number, required: true },
    reason: String,
    status: { type: String, enum: ['initiated', 'processing', 'completed', 'failed'], default: 'initiated' },
    providerRefundId: String,
    processedBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
  },
  { timestamps: true }
);

export const Refund = model<IRefund>('Refund', refundSchema);
