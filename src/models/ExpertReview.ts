import { Schema, model, Document, Types } from 'mongoose';

export interface IExpertReview extends Document {
  name: string;
  designation?: string;
  profileImage?: string;
  videoThumbnail?: string;
  videoUrl?: string;
  product?: Types.ObjectId;
  language: string;
  description: string;
  status: 'active' | 'inactive';
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const expertReviewSchema = new Schema<IExpertReview>(
  {
    name: { type: String, required: true },
    designation: String,
    profileImage: String,
    videoThumbnail: String,
    videoUrl: String,
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    language: { type: String, default: 'English' },
    description: { type: String, required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const ExpertReview = model<IExpertReview>('ExpertReview', expertReviewSchema);
