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
const controller = __importStar(require("../controllers/product.controller"));
const router = (0, express_1.Router)();
router.get('/', controller.listProducts);
router.get('/search/autocomplete', controller.searchAutocomplete);
router.get('/admin/all', auth_1.requireAdminAuth, (0, auth_1.requirePermission)('products.view'), controller.adminListProducts);
router.get('/admin/:id', auth_1.requireAdminAuth, (0, auth_1.requirePermission)('products.view'), controller.adminGetProduct);
router.post('/', auth_1.requireAdminAuth, (0, auth_1.requirePermission)('products.create'), [
    (0, express_validator_1.body)('name').trim().isLength({ min: 2 }),
    (0, express_validator_1.body)('sku').trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('category').isMongoId(),
    (0, express_validator_1.body)('regularPrice').isFloat({ min: 0 }),
], validate_1.validate, controller.createProduct);
router.patch('/:id', auth_1.requireAdminAuth, (0, auth_1.requirePermission)('products.edit'), controller.updateProduct);
router.delete('/:id', auth_1.requireAdminAuth, (0, auth_1.requirePermission)('products.delete'), controller.deleteProduct);
router.post('/:productId/variants', auth_1.requireAdminAuth, (0, auth_1.requirePermission)('products.edit'), controller.createVariant);
router.patch('/variants/:variantId', auth_1.requireAdminAuth, (0, auth_1.requirePermission)('products.edit'), controller.updateVariant);
router.delete('/variants/:variantId', auth_1.requireAdminAuth, (0, auth_1.requirePermission)('products.edit'), controller.deleteVariant);
router.get('/:slug', controller.getProductBySlug);
exports.default = router;
//# sourceMappingURL=product.routes.js.map