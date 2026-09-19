import { Schema, model, Document } from 'mongoose';

export interface ITax extends Document {
  name: string;
  percentage: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const taxSchema = new Schema<ITax>(
  {
    name: { type: String, required: true, unique: true },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Tax = model<ITax>('Tax', taxSchema);
