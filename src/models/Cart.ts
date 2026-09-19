import { Schema, model, Document, Types } from 'mongoose';

export interface ICartItem extends Types.Subdocument {
  product: Types.ObjectId;
  variant?: Types.ObjectId;
  quantity: number;
  priceSnapshot: number;
  savedForLater: boolean;
}

export interface ICart extends Document {
  user?: Types.ObjectId;
  guestId?: string;
  items: Types.DocumentArray<ICartItem>;
  coupon?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variant: { type: Schema.Types.ObjectId, ref: 'ProductVariant', default: null },
    quantity: { type: Number, required: true, min: 1 },
    priceSnapshot: { type: Number, required: true },
    savedForLater: { type: Boolean, default: false },
  },
  { _id: true }
);

const cartSchema = new Schema<ICart>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', index: true, sparse: true },
    guestId: { type: String, index: true, sparse: true },
    items: [cartItemSchema],
    coupon: { type: Schema.Types.ObjectId, ref: 'Coupon', default: null },
  },
  { timestamps: true }
);

export const Cart = model<ICart>('Cart', cartSchema);
