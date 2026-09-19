import { Schema, model, Document, Types } from 'mongoose';

export interface IBlog extends Document {
  title: string;
  slug: string;
  category: Types.ObjectId;
  author: string;
  featuredImage: string;
  excerpt?: string;
  content: string;
  tags: string[];
  relatedProducts: Types.ObjectId[];
  status: 'draft' | 'published' | 'scheduled';
  featured: boolean;
  publishedAt?: Date;
  seoTitle?: string;
  metaDescription?: string;
  keywords: string[];
  canonicalUrl?: string;
  ogImage?: string;
  readingTimeMinutes: number;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

const blogSchema = new Schema<IBlog>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    category: { type: Schema.Types.ObjectId, ref: 'BlogCategory', required: true },
    author: { type: String, required: true },
    featuredImage: { type: String, required: true },
    excerpt: String,
    content: { type: String, required: true },
    tags: [String],
    relatedProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    status: { type: String, enum: ['draft', 'published', 'scheduled'], default: 'draft', index: true },
    featured: { type: Boolean, default: false },
    publishedAt: Date,
    seoTitle: String,
    metaDescription: String,
    keywords: [String],
    canonicalUrl: String,
    ogImage: String,
    readingTimeMinutes: { type: Number, default: 3 },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

blogSchema.index({ title: 'text', excerpt: 'text', tags: 'text' });

export const Blog = model<IBlog>('Blog', blogSchema);
