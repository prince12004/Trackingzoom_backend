import { Router } from 'express';
import { query } from 'express-validator';
import { validate } from '../middleware/validate';
import { requireAdminAuth, requirePermission } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess } from '../utils/ApiResponse';
import { getSettings } from '../models/Setting';

const router = Router();

router.get(
  '/public',
  catchAsync(async (_req, res) => {
    const settings = await getSettings();
    sendSuccess(res, {
      general: settings.general,
      shipping: {
        freeShippingThreshold: settings.shipping.freeShippingThreshold,
        estimatedDeliveryDaysMin: settings.shipping.estimatedDeliveryDaysMin,
        estimatedDeliveryDaysMax: settings.shipping.estimatedDeliveryDaysMax,
      },
      payment: {
        codEnabled: settings.payment.codEnabled,
        qrPaymentEnabled: settings.payment.qrPaymentEnabled,
        qrCodeImage: settings.payment.qrCodeImage,
        upiId: settings.payment.upiId,
      },
      seo: settings.seo,
      social: settings.social,
      apps: settings.apps,
      analytics: settings.analytics,
    });
  })
);

router.get(
  '/pincode-check',
  [query('pincode').matches(/^[1-9][0-9]{5}$/)],
  validate,
  catchAsync(async (req, res) => {
    const settings = await getSettings();
    const pincode = req.query.pincode as string;
    const serviceable = !settings.shipping.nonServiceablePincodes.includes(pincode);
    const codAvailable = serviceable && settings.payment.codEnabled && !settings.shipping.nonCodPincodes.includes(pincode);
    sendSuccess(res, {
      pincode,
      serviceable,
      codAvailable,
      estimatedDeliveryDaysMin: settings.shipping.estimatedDeliveryDaysMin,
      estimatedDeliveryDaysMax: settings.shipping.estimatedDeliveryDaysMax,
    });
  })
);

router.get(
  '/',
  requireAdminAuth,
  requirePermission('settings.manage'),
  catchAsync(async (_req, res) => {
    const settings = await getSettings();
    sendSuccess(res, settings);
  })
);

router.patch(
  '/',
  requireAdminAuth,
  requirePermission('settings.manage'),
  catchAsync(async (req, res) => {
    const settings = await getSettings();
    Object.entries(req.body).forEach(([key, value]) => {
      if (Object.prototype.hasOwnProperty.call(settings.toObject(), key) && typeof value === 'object') {
        Object.assign((settings as unknown as Record<string, object>)[key], value);
      }
    });
    await settings.save();
    sendSuccess(res, settings, 'Settings updated');
  })
);

export default router;
