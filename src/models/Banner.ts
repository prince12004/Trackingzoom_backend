import { Schema, model, Document } from 'mongoose';

export interface IBanner extends Document {
  title: string;
  subtitle?: string;
  desktopImage: string;
  mobileImage: string;
  ctaText?: string;
  ctaUrl?: string;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'inactive';
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const bannerSchema = new Schema<IBanner>(
  {
    title: { type: String, required: true },
    subtitle: String,
    desktopImage: { type: String, required: true },
    mobileImage: { type: String, required: true },
    ctaText: String,
    ctaUrl: String,
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Banner = model<IBanner>('Banner', bannerSchema);
