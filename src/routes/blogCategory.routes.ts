import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { requireAdminAuth, requirePermission } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { BlogCategory } from '../models/BlogCategory';
import { toSlug, ensureUniqueSlug } from '../utils/slug';

const router = Router();

router.get(
  '/',
  catchAsync(async (_req, res) => {
    const items = await BlogCategory.find({ status: 'active' }).sort({ name: 1 });
    sendSuccess(res, items);
  })
);

router.post(
  '/',
  requireAdminAuth,
  requirePermission('blogs.create'),
  [body('name').trim().notEmpty()],
  validate,
  catchAsync(async (req, res) => {
    const baseSlug = toSlug(req.body.name);
    const slug = await ensureUniqueSlug(baseSlug, async (s) => !!(await BlogCategory.findOne({ slug: s })));
    const category = await BlogCategory.create({ ...req.body, slug });
    sendSuccess(res, category, 'Blog category created', 201);
  })
);

router.patch(
  '/:id',
  requireAdminAuth,
  requirePermission('blogs.edit'),
  catchAsync(async (req, res) => {
    const category = await BlogCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) throw ApiError.notFound('Blog category not found');
    sendSuccess(res, category, 'Blog category updated');
  })
);

router.delete(
  '/:id',
  requireAdminAuth,
  requirePermission('blogs.delete'),
  catchAsync(async (req, res) => {
    const category = await BlogCategory.findByIdAndDelete(req.params.id);
    if (!category) throw ApiError.notFound('Blog category not found');
    sendSuccess(res, null, 'Blog category deleted');
  })
);

export default router;
