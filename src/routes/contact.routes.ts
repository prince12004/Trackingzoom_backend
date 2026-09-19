import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { requireAdminAuth, requirePermission } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess, buildPagination } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { ContactMessage } from '../models/ContactMessage';
import { createNotification } from '../services/notification.service';

const router = Router();

router.post(
  '/',
  [body('name').trim().notEmpty(), body('mobile').matches(/^[6-9]\d{9}$/), body('message').trim().notEmpty()],
  validate,
  catchAsync(async (req, res) => {
    const contact = await ContactMessage.create(req.body);
    await createNotification({
      recipientType: 'admin',
      type: 'new_contact_message',
      title: 'New contact message',
      message: `${contact.name} sent a message: "${contact.subject || contact.message.slice(0, 50)}"`,
      link: `/admin/leads/contact/${contact._id}`,
    });
    sendSuccess(res, contact, 'Thank you for reaching out! We will get back to you soon.', 201);
  })
);

router.get(
  '/admin/all',
  requireAdminAuth,
  requirePermission('leads.view'),
  catchAsync(async (req, res) => {
    const { page = '1', limit = '20', status } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const [items, total] = await Promise.all([
      ContactMessage.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
      ContactMessage.countDocuments(filter),
    ]);

    sendSuccess(res, items, 'Messages fetched', 200, buildPagination(pageNum, limitNum, total));
  })
);

router.patch(
  '/admin/:id',
  requireAdminAuth,
  requirePermission('leads.assign'),
  catchAsync(async (req, res) => {
    const message = await ContactMessage.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!message) throw ApiError.notFound('Message not found');
    sendSuccess(res, message, 'Message updated');
  })
);

export default router;
