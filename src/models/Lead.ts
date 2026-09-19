import { Schema, model, Document, Types } from 'mongoose';

export interface ILead extends Document {
  name: string;
  mobile: string;
  email?: string;
  interestedProduct?: Types.ObjectId;
  category?: Types.ObjectId;
  sourcePage?: string;
  leadType: 'callback' | 'expert';
  message?: string;
  assignedTo?: Types.ObjectId;
  status: 'new' | 'contacted' | 'follow_up' | 'converted' | 'not_interested' | 'closed';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const leadSchema = new Schema<ILead>(
  {
    name: { type: String, required: true },
    mobile: { type: String, required: true, index: true },
    email: String,
    interestedProduct: { type: Schema.Types.ObjectId, ref: 'Product' },
    category: { type: Schema.Types.ObjectId, ref: 'Category' },
    sourcePage: String,
    leadType: { type: String, enum: ['callback', 'expert'], default: 'callback' },
    message: String,
    assignedTo: { type: Schema.Types.ObjectId, ref: 'Admin' },
    status: {
      type: String,
      enum: ['new', 'contacted', 'follow_up', 'converted', 'not_interested', 'closed'],
      default: 'new',
      index: true,
    },
    notes: String,
  },
  { timestamps: true }
);

export const Lead = model<ILead>('Lead', leadSchema);
