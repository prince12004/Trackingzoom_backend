import { Schema, model, Document, Types } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  banner?: string;
  seoTitle?: string;
  metaDescription?: string;
  status: 'active' | 'inactive';
  displayOrder: number;
  parent?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: String,
    image: String,
    icon: String,
    banner: String,
    seoTitle: String,
    metaDescription: String,
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    displayOrder: { type: Number, default: 0 },
    parent: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
  },
  { timestamps: true }
);

categorySchema.index({ parent: 1, displayOrder: 1 });

export const Category = model<ICategory>('Category', categorySchema);
