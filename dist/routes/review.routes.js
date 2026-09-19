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
const auth_1 = require("../middleware/auth");
const controller = __importStar(require("../controllers/review.controller"));
const router = (0, express_1.Router)();
router.get('/product/:productId', controller.listProductReviews);
router.get('/recent', controller.listRecentReviews);
router.get('/mine', auth_1.requireCustomerAuth, controller.listMyReviews);
router.post('/', auth_1.requireCustomerAuth, [
    (0, express_validator_1.body)('productId').isMongoId(),
    (0, express_validator_1.body)('rating').isInt({ min: 1, max: 5 }),
    (0, express_validator_1.body)('comment').trim().isLength({ min: 5 }),
], validate_1.validate, controller.submitReview);
router.get('/admin/all', auth_1.requireAdminAuth, (0, auth_1.requirePermission)('customers.view'), controller.adminListReviews);
router.patch('/admin/:id/moderate', auth_1.requireAdminAuth, (0, auth_1.requirePermission)('customers.view'), [(0, express_validator_1.body)('status').isIn(['approved', 'rejected'])], validate_1.validate, controller.adminModerateReview);
exports.default = router;
//# sourceMappingURL=review.routes.js.map