"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
const catchAsync_1 = require("../utils/catchAsync");
const ApiResponse_1 = require("../utils/ApiResponse");
const Setting_1 = require("../models/Setting");
const router = (0, express_1.Router)();
router.get('/public', (0, catchAsync_1.catchAsync)(async (_req, res) => {
    const settings = await (0, Setting_1.getSettings)();
    (0, ApiResponse_1.sendSuccess)(res, {
        general: settings.general,
        shipping: {
            freeShippingThreshold: settings.shipping.freeShippingThreshold,
            estimatedDeliveryDaysMin: settings.shipping.estimatedDeliveryDaysMin,
            estimatedDeliveryDaysMax: settings.shipping.estimatedDeliveryDaysMax,
        },
        payment: { codEnabled: settings.payment.codEnabled },
        seo: settings.seo,
        social: settings.social,
        apps: settings.apps,
        analytics: settings.analytics,
    });
}));
router.get('/pincode-check', [(0, express_validator_1.query)('pincode').matches(/^[1-9][0-9]{5}$/)], validate_1.validate, (0, catchAsync_1.catchAsync)(async (req, res) => {
    const settings = await (0, Setting_1.getSettings)();
    const pincode = req.query.pincode;
    const serviceable = !settings.shipping.nonServiceablePincodes.includes(pincode);
    const codAvailable = serviceable && settings.payment.codEnabled && !settings.shipping.nonCodPincodes.includes(pincode);
    (0, ApiResponse_1.sendSuccess)(res, {
        pincode,
        serviceable,
        codAvailable,
        estimatedDeliveryDaysMin: settings.shipping.estimatedDeliveryDaysMin,
        estimatedDeliveryDaysMax: settings.shipping.estimatedDeliveryDaysMax,
    });
}));
router.get('/', auth_1.requireAdminAuth, (0, auth_1.requirePermission)('settings.manage'), (0, catchAsync_1.catchAsync)(async (_req, res) => {
    const settings = await (0, Setting_1.getSettings)();
    (0, ApiResponse_1.sendSuccess)(res, settings);
}));
router.patch('/', auth_1.requireAdminAuth, (0, auth_1.requirePermission)('settings.manage'), (0, catchAsync_1.catchAsync)(async (req, res) => {
    const settings = await (0, Setting_1.getSettings)();
    Object.entries(req.body).forEach(([key, value]) => {
        if (Object.prototype.hasOwnProperty.call(settings.toObject(), key) && typeof value === 'object') {
            Object.assign(settings[key], value);
        }
    });
    await settings.save();
    (0, ApiResponse_1.sendSuccess)(res, settings, 'Settings updated');
}));
exports.default = router;
//# sourceMappingURL=settings.routes.js.map