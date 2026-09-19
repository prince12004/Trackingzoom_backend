import { Notification } from '../models/Notification';

interface CreateNotificationInput {
  recipientType: 'admin' | 'customer';
  recipient?: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}

export async function createNotification(input: CreateNotificationInput) {
  return Notification.create(input);
}
