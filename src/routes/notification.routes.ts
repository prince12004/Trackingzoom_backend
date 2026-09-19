import { Router } from 'express';
import { requireCustomerAuth, requireAdminAuth } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess } from '../utils/ApiResponse';
import { Notification } from '../models/Notification';

const router = Router();

router.get(
  '/customer',
  requireCustomerAuth,
  catchAsync(async (req, res) => {
    const notifications = await Notification.find({ recipientType: 'customer', recipient: req.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({
      recipientType: 'customer',
      recipient: req.userId,
      read: false,
    });
    sendSuccess(res, { notifications, unreadCount });
  })
);

router.patch(
  '/customer/:id/read',
  requireCustomerAuth,
  catchAsync(async (req, res) => {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientType: 'customer', recipient: req.userId },
      { read: true }
    );
    sendSuccess(res, null, 'Marked as read');
  })
);

router.patch(
  '/customer/read-all',
  requireCustomerAuth,
  catchAsync(async (req, res) => {
    await Notification.updateMany({ recipientType: 'customer', recipient: req.userId, read: false }, { read: true });
    sendSuccess(res, null, 'All notifications marked as read');
  })
);

router.get(
  '/admin',
  requireAdminAuth,
  catchAsync(async (_req, res) => {
    const notifications = await Notification.find({ recipientType: 'admin' }).sort({ createdAt: -1 }).limit(50);
    const unreadCount = await Notification.countDocuments({ recipientType: 'admin', read: false });
    sendSuccess(res, { notifications, unreadCount });
  })
);

router.patch(
  '/admin/:id/read',
  requireAdminAuth,
  catchAsync(async (req, res) => {
    await Notification.findOneAndUpdate({ _id: req.params.id, recipientType: 'admin' }, { read: true });
    sendSuccess(res, null, 'Marked as read');
  })
);

export default router;
