import { Schema, model, Document, Types } from 'mongoose';

interface IVariantAttribute {
  name: string;
  value: string;
}

export interface IProductVariant extends Document {
  product: Types.ObjectId;
  sku: string;
  attributes: IVariantAttribute[];
  price: number;
  salePrice?: number;
  stockQuantity: number;
  images: string[];
  weightGrams?: number;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const productVariantSchema = new Schema<IProductVariant>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    sku: { type: String, required: true, unique: true, index: true },
    attributes: [{ name: String, value: String, _id: false }],
    price: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, min: 0 },
    stockQuantity: { type: Number, default: 0, min: 0 },
    images: [String],
    weightGrams: Number,
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

export const ProductVariant = model<IProductVariant>('ProductVariant', productVariantSchema);
