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
const adminAuthController = __importStar(require("../controllers/adminAuth.controller"));
const router = (0, express_1.Router)();
router.post('/login', rateLimiter_1.authLimiter, [(0, express_validator_1.body)('email').isEmail(), (0, express_validator_1.body)('password').isLength({ min: 8 })], validate_1.validate, adminAuthController.adminLogin);
router.post('/2fa/verify-login', rateLimiter_1.authLimiter, [(0, express_validator_1.body)('adminId').isMongoId(), (0, express_validator_1.body)('code').isLength({ min: 6, max: 6 })], validate_1.validate, adminAuthController.adminVerifyTwoFactor);
router.post('/refresh', adminAuthController.refreshAdminToken);
router.post('/logout', auth_1.requireAdminAuth, adminAuthController.adminLogout);
router.get('/me', auth_1.requireAdminAuth, adminAuthController.getAdminMe);
router.post('/2fa/setup', auth_1.requireAdminAuth, adminAuthController.setupTwoFactor);
router.post('/2fa/enable', auth_1.requireAdminAuth, [(0, express_validator_1.body)('code').isLength({ min: 6, max: 6 })], validate_1.validate, adminAuthController.enableTwoFactor);
router.post('/2fa/disable', auth_1.requireAdminAuth, adminAuthController.disableTwoFactor);
exports.default = router;
//# sourceMappingURL=adminAuth.routes.js.map