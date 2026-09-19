import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { requireAdminAuth, requirePermission } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { Page } from '../models/Page';

const router = Router();

router.get(
  '/:slug',
  catchAsync(async (req, res) => {
    const page = await Page.findOne({ slug: req.params.slug });
    if (!page) throw ApiError.notFound('Page not found');
    sendSuccess(res, page);
  })
);

router.get(
  '/',
  requireAdminAuth,
  requirePermission('content.manage'),
  catchAsync(async (_req, res) => {
    const pages = await Page.find().sort({ slug: 1 });
    sendSuccess(res, pages);
  })
);

router.put(
  '/:slug',
  requireAdminAuth,
  requirePermission('content.manage'),
  [body('title').trim().notEmpty(), body('content').trim().notEmpty()],
  validate,
  catchAsync(async (req, res) => {
    const page = await Page.findOneAndUpdate(
      { slug: req.params.slug },
      { ...req.body, slug: req.params.slug },
      { new: true, upsert: true }
    );
    sendSuccess(res, page, 'Page saved');
  })
);

export default router;
