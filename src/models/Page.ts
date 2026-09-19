import { Schema, model, Document } from 'mongoose';

export type PageSlug =
  | 'about-us'
  | 'terms-and-conditions'
  | 'privacy-policy'
  | 'cancellation-policy'
  | 'refund-policy'
  | 'shipping-policy'
  | 'warranty-policy'
  | 'data-protection-policy';

export interface IPage extends Document {
  slug: PageSlug;
  title: string;
  content: string;
  seoTitle?: string;
  metaDescription?: string;
  updatedAt: Date;
  createdAt: Date;
}

const pageSchema = new Schema<IPage>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      enum: [
        'about-us',
        'terms-and-conditions',
        'privacy-policy',
        'cancellation-policy',
        'refund-policy',
        'shipping-policy',
        'warranty-policy',
        'data-protection-policy',
      ],
    },
    title: { type: String, required: true },
    content: { type: String, required: true },
    seoTitle: String,
    metaDescription: String,
  },
  { timestamps: true }
);

export const Page = model<IPage>('Page', pageSchema);
