import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { requireAdminAuth, requirePermission } from '../middleware/auth';
import * as controller from '../controllers/brand.controller';

const router = Router();

router.get('/', controller.listBrands);

router.post(
  '/',
  requireAdminAuth,
  requirePermission('products.create'),
  [body('name').trim().isLength({ min: 2 })],
  validate,
  controller.createBrand
);
router.patch('/:id', requireAdminAuth, requirePermission('products.edit'), controller.updateBrand);
router.delete('/:id', requireAdminAuth, requirePermission('products.delete'), controller.deleteBrand);

export default router;
