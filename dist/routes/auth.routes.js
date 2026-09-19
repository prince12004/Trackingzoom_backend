"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const validate_1 = require("../middleware/validate");
const rateLimiter_1 = require("../middleware/rateLimiter");
const auth_1 = require("../middleware/auth");
const authController = __importStar(require("../controllers/auth.controller"));
const router = (0, express_1.Router)();
const mobileValidator = (0, express_validator_1.body)('mobile')
    .trim()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Enter a valid 10-digit Indian mobile number');
router.post('/otp/request', rateLimiter_1.otpLimiter, [mobileValidator, (0, express_validator_1.body)('purpose').isIn(['register', 'login'])], validate_1.validate, authController.requestOtp);
router.post('/register/verify', rateLimiter_1.authLimiter, [
    mobileValidator,
    (0, express_validator_1.body)('code').isLength({ min: 6, max: 6 }).isNumeric(),
    (0, express_validator_1.body)('name').trim().isLength({ min: 2, max: 80 }),
], validate_1.validate, authController.verifyRegister);
router.post('/login/verify', rateLimiter_1.authLimiter, [mobileValidator, (0, express_validator_1.body)('code').isLength({ min: 6, max: 6 }).isNumeric()], validate_1.validate, authController.verifyLogin);
router.post('/refresh', authController.refreshCustomerToken);
router.post('/logout', auth_1.requireCustomerAuth, authController.logout);
router.get('/me', auth_1.requireCustomerAuth, authController.getMe);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map