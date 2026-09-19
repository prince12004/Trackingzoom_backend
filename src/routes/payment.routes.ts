import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { requireCustomerAuth } from '../middleware/auth';
import * as controller from '../controllers/payment.controller';

const router = Router();

router.post(
  '/verify',
  requireCustomerAuth,
  [
    body('orderId').isMongoId(),
    body('razorpay_order_id').notEmpty(),
    body('razorpay_payment_id').notEmpty(),
    body('razorpay_signature').notEmpty(),
  ],
  validate,
  controller.verifyPayment
);

// Mounted separately with raw body parsing in app.ts
router.post('/webhook', controller.razorpayWebhook);

export default router;
