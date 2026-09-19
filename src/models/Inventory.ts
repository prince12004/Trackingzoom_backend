import { Schema, model, Document, Types } from 'mongoose';

export interface IInventory extends Document {
  product: Types.ObjectId;
  variant?: Types.ObjectId;
  available: number;
  reserved: number;
  sold: number;
  damaged: number;
  returned: number;
  createdAt: Date;
  updatedAt: Date;
}

const inventorySchema = new Schema<IInventory>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    variant: { type: Schema.Types.ObjectId, ref: 'ProductVariant', default: null },
    available: { type: Number, default: 0, min: 0 },
    reserved: { type: Number, default: 0, min: 0 },
    sold: { type: Number, default: 0, min: 0 },
    damaged: { type: Number, default: 0, min: 0 },
    returned: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

inventorySchema.index({ product: 1, variant: 1 }, { unique: true });

export const Inventory = model<IInventory>('Inventory', inventorySchema);
