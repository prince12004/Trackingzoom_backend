import { Schema, model, Document, Types } from 'mongoose';

export interface ICompareList extends Document {
  user?: Types.ObjectId;
  guestId?: string;
  products: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const compareListSchema = new Schema<ICompareList>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', index: true, sparse: true },
    guestId: { type: String, index: true, sparse: true },
    products: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  },
  { timestamps: true }
);

export const CompareList = model<ICompareList>('CompareList', compareListSchema);
