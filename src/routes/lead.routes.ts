import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { requireAdminAuth, requirePermission } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess, buildPagination } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { Lead } from '../models/Lead';
import { createNotification } from '../services/notification.service';

const router = Router();

router.post(
  '/',
  [
    body('name').trim().notEmpty(),
    body('mobile').matches(/^[6-9]\d{9}$/),
    body('leadType').isIn(['callback', 'expert']),
  ],
  validate,
  catchAsync(async (req, res) => {
    const lead = await Lead.create(req.body);
    await createNotification({
      recipientType: 'admin',
      type: 'new_lead',
      title: 'New callback request',
      message: `${lead.name} (${lead.mobile}) requested a callback.`,
      link: `/admin/leads/${lead._id}`,
    });
    sendSuccess(res, lead, 'Thank you! Our team will contact you shortly.', 201);
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
      Lead.find(filter)
        .populate('assignedTo', 'name email')
        .populate('interestedProduct', 'name')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Lead.countDocuments(filter),
    ]);

    sendSuccess(res, items, 'Leads fetched', 200, buildPagination(pageNum, limitNum, total));
  })
);

router.patch(
  '/admin/:id',
  requireAdminAuth,
  requirePermission('leads.assign'),
  catchAsync(async (req, res) => {
    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!lead) throw ApiError.notFound('Lead not found');
    sendSuccess(res, lead, 'Lead updated');
  })
);

export default router;
