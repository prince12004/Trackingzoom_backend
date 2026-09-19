import { Schema, model, Document, Types } from 'mongoose';

export interface INotification extends Document {
  recipientType: 'admin' | 'customer';
  recipient?: Types.ObjectId;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipientType: { type: String, enum: ['admin', 'customer'], required: true, index: true },
    recipient: { type: Schema.Types.ObjectId, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: String,
    read: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ recipientType: 1, recipient: 1, read: 1, createdAt: -1 });

export const Notification = model<INotification>('Notification', notificationSchema);
