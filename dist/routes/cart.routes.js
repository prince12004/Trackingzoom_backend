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
const guestId_1 = require("../middleware/guestId");
const controller = __importStar(require("../controllers/cart.controller"));
const router = (0, express_1.Router)();
router.use(guestId_1.ensureGuestId, auth_1.optionalCustomerAuth);
router.get('/', controller.getCart);
router.post('/items', [(0, express_validator_1.body)('productId').isMongoId(), (0, express_validator_1.body)('quantity').optional().isInt({ min: 1 })], validate_1.validate, controller.addItem);
router.patch('/items/:itemId', [(0, express_validator_1.param)('itemId').isMongoId(), (0, express_validator_1.body)('quantity').isInt({ min: 0 })], validate_1.validate, controller.updateItemQuantity);
router.delete('/items/:itemId', [(0, express_validator_1.param)('itemId').isMongoId()], validate_1.validate, controller.removeItem);
router.post('/items/:itemId/save-for-later', [(0, express_validator_1.param)('itemId').isMongoId()], validate_1.validate, controller.toggleSaveForLater);
router.post('/coupon', [(0, express_validator_1.body)('code').trim().notEmpty()], validate_1.validate, controller.applyCoupon);
router.delete('/coupon', controller.removeCoupon);
router.delete('/', controller.clearCart);
exports.default = router;
//# sourceMappingURL=cart.routes.js.map