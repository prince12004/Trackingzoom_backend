import { Router } from 'express';
import { requireAdminAuth, requirePermission } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { HomepageSection } from '../models/HomepageSection';

const router = Router();

router.get(
  '/',
  catchAsync(async (_req, res) => {
    const sections = await HomepageSection.find({ enabled: true }).sort({ displayOrder: 1 });
    sendSuccess(res, sections);
  })
);

router.get(
  '/admin/all',
  requireAdminAuth,
  requirePermission('marketing.manage'),
  catchAsync(async (_req, res) => {
    const sections = await HomepageSection.find().sort({ displayOrder: 1 });
    sendSuccess(res, sections);
  })
);

router.patch(
  '/admin/:id',
  requireAdminAuth,
  requirePermission('marketing.manage'),
  catchAsync(async (req, res) => {
    const section = await HomepageSection.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!section) throw ApiError.notFound('Homepage section not found');
    sendSuccess(res, section, 'Homepage section updated');
  })
);

router.post(
  '/admin/reorder',
  requireAdminAuth,
  requirePermission('marketing.manage'),
  catchAsync(async (req, res) => {
    const { order } = req.body as { order: { id: string; displayOrder: number }[] };
    await Promise.all(
      order.map((o) => HomepageSection.findByIdAndUpdate(o.id, { displayOrder: o.displayOrder }))
    );
    const sections = await HomepageSection.find().sort({ displayOrder: 1 });
    sendSuccess(res, sections, 'Homepage sections reordered');
  })
);

export default router;
