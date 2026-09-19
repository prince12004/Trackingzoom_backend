import { Schema, model, Document, Types } from 'mongoose';

interface ISnapshotItem {
  product: Types.ObjectId;
  variant?: Types.ObjectId;
  quantity: number;
  priceSnapshot: number;
}

export interface IAbandonedCart extends Document {
  cart: Types.ObjectId;
  user?: Types.ObjectId;
  mobile?: string;
  email?: string;
  items: ISnapshotItem[];
  cartTotal: number;
  remindersSent: { channel: 'email' | 'sms' | 'whatsapp'; sentAt: Date }[];
  recovered: boolean;
  recoveredOrder?: Types.ObjectId;
  optedOut: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const abandonedCartSchema = new Schema<IAbandonedCart>(
  {
    cart: { type: Schema.Types.ObjectId, ref: 'Cart', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    mobile: String,
    email: String,
    items: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product' },
        variant: { type: Schema.Types.ObjectId, ref: 'ProductVariant' },
        quantity: Number,
        priceSnapshot: Number,
        _id: false,
      },
    ],
    cartTotal: { type: Number, default: 0 },
    remindersSent: [
      { channel: { type: String, enum: ['email', 'sms', 'whatsapp'] }, sentAt: Date, _id: false },
    ],
    recovered: { type: Boolean, default: false },
    recoveredOrder: { type: Schema.Types.ObjectId, ref: 'Order' },
    optedOut: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const AbandonedCart = model<IAbandonedCart>('AbandonedCart', abandonedCartSchema);
