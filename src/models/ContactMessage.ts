import { Schema, model, Document } from 'mongoose';

export interface IContactMessage extends Document {
  name: string;
  mobile: string;
  email?: string;
  subject?: string;
  message: string;
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

const contactMessageSchema = new Schema<IContactMessage>(
  {
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    email: String,
    subject: String,
    message: { type: String, required: true },
    status: { type: String, enum: ['new', 'in_progress', 'resolved', 'closed'], default: 'new', index: true },
  },
  { timestamps: true }
);

export const ContactMessage = model<IContactMessage>('ContactMessage', contactMessageSchema);
