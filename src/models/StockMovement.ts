import { Schema, model, Document, Types } from 'mongoose';

export type StockMovementType =
  | 'purchase'
  | 'manual_addition'
  | 'order'
  | 'cancellation'
  | 'return'
  | 'damage'
  | 'adjustment'
  | 'replacement';

export interface IStockMovement extends Document {
  product: Types.ObjectId;
  variant?: Types.ObjectId;
  previousStock: number;
  quantityChanged: number;
  newStock: number;
  movementType: StockMovementType;
  referenceId?: string;
  admin?: Types.ObjectId;
  reason?: string;
  createdAt: Date;
}

const stockMovementSchema = new Schema<IStockMovement>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    variant: { type: Schema.Types.ObjectId, ref: 'ProductVariant', default: null },
    previousStock: { type: Number, required: true },
    quantityChanged: { type: Number, required: true },
    newStock: { type: Number, required: true },
    movementType: {
      type: String,
      enum: [
        'purchase',
        'manual_addition',
        'order',
        'cancellation',
        'return',
        'damage',
        'adjustment',
        'replacement',
      ],
      required: true,
    },
    referenceId: String,
    admin: { type: Schema.Types.ObjectId, ref: 'Admin' },
    reason: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

stockMovementSchema.index({ createdAt: -1 });

export const StockMovement = model<IStockMovement>('StockMovement', stockMovementSchema);
