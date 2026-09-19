import { Router } from 'express';
import { requireAdminAuth, requirePermission } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess, buildPagination } from '../utils/ApiResponse';
import { ActivityLog } from '../models/ActivityLog';

const router = Router();

router.get(
  '/',
  requireAdminAuth,
  requirePermission('activitylog.view'),
  catchAsync(async (req, res) => {
    const { page = '1', limit = '30', module, admin } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = {};
    if (module) filter.module = module;
    if (admin) filter.admin = admin;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 30));

    const [items, total] = await Promise.all([
      ActivityLog.find(filter)
        .populate('admin', 'name email')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      ActivityLog.countDocuments(filter),
    ]);

    sendSuccess(res, items, 'Activity log fetched', 200, buildPagination(pageNum, limitNum, total));
  })
);

export default router;
