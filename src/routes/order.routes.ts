import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { requireCustomerAuth, requireAdminAuth, requirePermission } from '../middleware/auth';
import * as controller from '../controllers/order.controller';

const router = Router();

router.get('/admin/all', requireAdminAuth, requirePermission('orders.view'), controller.adminListOrders);
router.get('/admin/:id', requireAdminAuth, requirePermission('orders.view'), controller.adminGetOrder);
router.patch(
  '/admin/:id/status',
  requireAdminAuth,
  requirePermission('orders.update'),
  [body('status').notEmpty()],
  validate,
  controller.adminUpdateOrderStatus
);
router.patch('/admin/:id/notes', requireAdminAuth, requirePermission('orders.update'), controller.adminAddNote);
router.patch(
  '/admin/:id/verify-payment',
  requireAdminAuth,
  requirePermission('orders.update'),
  [body('approved').isBoolean()],
  validate,
  controller.adminVerifyPayment
);
router.get('/admin/:id/invoice', requireAdminAuth, requirePermission('orders.view'), controller.adminDownloadInvoice);

router.get('/', requireCustomerAuth, controller.listMyOrders);
router.get('/:id', requireCustomerAuth, controller.getMyOrder);
router.get('/:id/invoice', requireCustomerAuth, controller.downloadMyInvoice);
router.post(
  '/:id/payment-proof',
  requireCustomerAuth,
  [body('screenshotUrl').trim().notEmpty()],
  validate,
  controller.submitMyPaymentProof
);
router.post(
  '/:id/cancel',
  requireCustomerAuth,
  [body('reason').trim().notEmpty()],
  validate,
  controller.cancelMyOrder
);
router.post(
  '/:id/return',
  requireCustomerAuth,
  [body('reason').trim().notEmpty()],
  validate,
  controller.requestReturn
);

export default router;
