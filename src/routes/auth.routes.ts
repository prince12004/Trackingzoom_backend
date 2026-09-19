import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { otpLimiter, authLimiter } from '../middleware/rateLimiter';
import { requireCustomerAuth } from '../middleware/auth';
import * as authController from '../controllers/auth.controller';

const router = Router();

const mobileValidator = body('mobile')
  .trim()
  .matches(/^[6-9]\d{9}$/)
  .withMessage('Enter a valid 10-digit Indian mobile number');

router.post(
  '/otp/request',
  otpLimiter,
  [mobileValidator, body('purpose').isIn(['register', 'login'])],
  validate,
  authController.requestOtp
);

router.post(
  '/register/verify',
  authLimiter,
  [
    mobileValidator,
    body('code').isLength({ min: 6, max: 6 }).isNumeric(),
    body('name').trim().isLength({ min: 2, max: 80 }),
  ],
  validate,
  authController.verifyRegister
);

router.post(
  '/login/verify',
  authLimiter,
  [mobileValidator, body('code').isLength({ min: 6, max: 6 }).isNumeric()],
  validate,
  authController.verifyLogin
);

router.post('/refresh', authController.refreshCustomerToken);
router.post('/logout', requireCustomerAuth, authController.logout);
router.get('/me', requireCustomerAuth, authController.getMe);

export default router;
