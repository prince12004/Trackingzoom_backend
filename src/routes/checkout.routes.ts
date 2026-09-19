import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { requireCustomerAuth } from '../middleware/auth';
import * as controller from '../controllers/checkout.controller';

const router = Router();

router.post(
  '/initiate',
  requireCustomerAuth,
  [body('addressId').isMongoId(), body('paymentMethod').isIn(['online', 'cod', 'qr_manual']), body('screenshotUrl').optional().isString()],
  validate,
  controller.initiate
);

export default router;
