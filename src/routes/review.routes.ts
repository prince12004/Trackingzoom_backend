import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { requireCustomerAuth, requireAdminAuth, requirePermission } from '../middleware/auth';
import * as controller from '../controllers/review.controller';

const router = Router();

router.get('/product/:productId', controller.listProductReviews);
router.get('/recent', controller.listRecentReviews);

router.get('/mine', requireCustomerAuth, controller.listMyReviews);
router.post(
  '/',
  requireCustomerAuth,
  [
    body('productId').isMongoId(),
    body('rating').isInt({ min: 1, max: 5 }),
    body('comment').trim().isLength({ min: 5 }),
  ],
  validate,
  controller.submitReview
);

router.get('/admin/all', requireAdminAuth, requirePermission('customers.view'), controller.adminListReviews);
router.patch(
  '/admin/:id/moderate',
  requireAdminAuth,
  requirePermission('customers.view'),
  [body('status').isIn(['approved', 'rejected'])],
  validate,
  controller.adminModerateReview
);

export default router;
