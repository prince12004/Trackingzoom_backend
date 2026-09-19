import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { requireAdminAuth, requirePermission } from '../middleware/auth';
import * as controller from '../controllers/product.controller';

const router = Router();

router.get('/', controller.listProducts);
router.get('/search/autocomplete', controller.searchAutocomplete);

router.get(
  '/admin/all',
  requireAdminAuth,
  requirePermission('products.view'),
  controller.adminListProducts
);
router.get(
  '/admin/:id',
  requireAdminAuth,
  requirePermission('products.view'),
  controller.adminGetProduct
);

router.post(
  '/',
  requireAdminAuth,
  requirePermission('products.create'),
  [
    body('name').trim().isLength({ min: 2 }),
    body('sku').trim().isLength({ min: 1 }),
    body('category').isMongoId(),
    body('regularPrice').isFloat({ min: 0 }),
  ],
  validate,
  controller.createProduct
);

router.patch(
  '/:id',
  requireAdminAuth,
  requirePermission('products.edit'),
  controller.updateProduct
);

router.delete(
  '/:id',
  requireAdminAuth,
  requirePermission('products.delete'),
  controller.deleteProduct
);

router.post(
  '/:productId/variants',
  requireAdminAuth,
  requirePermission('products.edit'),
  controller.createVariant
);
router.patch(
  '/variants/:variantId',
  requireAdminAuth,
  requirePermission('products.edit'),
  controller.updateVariant
);
router.delete(
  '/variants/:variantId',
  requireAdminAuth,
  requirePermission('products.edit'),
  controller.deleteVariant
);

router.get('/:slug', controller.getProductBySlug);

export default router;
