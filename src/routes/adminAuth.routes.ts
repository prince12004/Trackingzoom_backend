import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { authLimiter } from '../middleware/rateLimiter';
import { requireAdminAuth } from '../middleware/auth';
import * as adminAuthController from '../controllers/adminAuth.controller';

const router = Router();

router.post(
  '/login',
  authLimiter,
  [body('email').isEmail(), body('password').isLength({ min: 8 })],
  validate,
  adminAuthController.adminLogin
);

router.post(
  '/2fa/verify-login',
  authLimiter,
  [body('adminId').isMongoId(), body('code').isLength({ min: 6, max: 6 })],
  validate,
  adminAuthController.adminVerifyTwoFactor
);

router.post('/refresh', adminAuthController.refreshAdminToken);
router.post('/logout', requireAdminAuth, adminAuthController.adminLogout);
router.get('/me', requireAdminAuth, adminAuthController.getAdminMe);

router.post('/2fa/setup', requireAdminAuth, adminAuthController.setupTwoFactor);
router.post(
  '/2fa/enable',
  requireAdminAuth,
  [body('code').isLength({ min: 6, max: 6 })],
  validate,
  adminAuthController.enableTwoFactor
);
router.post('/2fa/disable', requireAdminAuth, adminAuthController.disableTwoFactor);

export default router;
