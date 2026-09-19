import { Schema, model, Document, Types } from 'mongoose';

export interface IOffer extends Document {
  title: string;
  type: 'percentage' | 'flat' | 'buy_x_get_y' | 'product_specific' | 'category' | 'festival' | 'limited_time';
  discountValue?: number;
  buyQuantity?: number;
  getQuantity?: number;
  applicableProducts: Types.ObjectId[];
  applicableCategories: Types.ObjectId[];
  bannerImage?: string;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'inactive';
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const offerSchema = new Schema<IOffer>(
  {
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ['percentage', 'flat', 'buy_x_get_y', 'product_specific', 'category', 'festival', 'limited_time'],
      required: true,
    },
    discountValue: Number,
    buyQuantity: Number,
    getQuantity: Number,
    applicableProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    applicableCategories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    bannerImage: String,
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Offer = model<IOffer>('Offer', offerSchema);
