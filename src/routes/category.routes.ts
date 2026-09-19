import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { requireAdminAuth, requirePermission } from '../middleware/auth';
import * as controller from '../controllers/category.controller';

const router = Router();

router.get('/', controller.listCategories);
router.get('/:slug', controller.getCategoryBySlug);

router.get(
  '/admin/all',
  requireAdminAuth,
  requirePermission('categories.view'),
  controller.adminListCategories
);

router.post(
  '/',
  requireAdminAuth,
  requirePermission('categories.create'),
  [body('name').trim().isLength({ min: 2 })],
  validate,
  controller.createCategory
);

router.patch(
  '/:id',
  requireAdminAuth,
  requirePermission('categories.edit'),
  controller.updateCategory
);

router.delete(
  '/:id',
  requireAdminAuth,
  requirePermission('categories.delete'),
  controller.deleteCategory
);

export default router;
