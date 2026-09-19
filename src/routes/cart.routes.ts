import { Router } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validate';
import { optionalCustomerAuth } from '../middleware/auth';
import { ensureGuestId } from '../middleware/guestId';
import * as controller from '../controllers/cart.controller';

const router = Router();

router.use(ensureGuestId, optionalCustomerAuth);

router.get('/', controller.getCart);

router.post(
  '/items',
  [body('productId').isMongoId(), body('quantity').optional().isInt({ min: 1 })],
  validate,
  controller.addItem
);

router.patch(
  '/items/:itemId',
  [param('itemId').isMongoId(), body('quantity').isInt({ min: 0 })],
  validate,
  controller.updateItemQuantity
);

router.delete('/items/:itemId', [param('itemId').isMongoId()], validate, controller.removeItem);
router.post('/items/:itemId/save-for-later', [param('itemId').isMongoId()], validate, controller.toggleSaveForLater);

router.post('/coupon', [body('code').trim().notEmpty()], validate, controller.applyCoupon);
router.delete('/coupon', controller.removeCoupon);
router.delete('/', controller.clearCart);

export default router;
