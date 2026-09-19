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
const controller = __importStar(require("../controllers/order.controller"));
const router = (0, express_1.Router)();
router.get('/admin/all', auth_1.requireAdminAuth, (0, auth_1.requirePermission)('orders.view'), controller.adminListOrders);
router.get('/admin/:id', auth_1.requireAdminAuth, (0, auth_1.requirePermission)('orders.view'), controller.adminGetOrder);
router.patch('/admin/:id/status', auth_1.requireAdminAuth, (0, auth_1.requirePermission)('orders.update'), [(0, express_validator_1.body)('status').notEmpty()], validate_1.validate, controller.adminUpdateOrderStatus);
router.patch('/admin/:id/notes', auth_1.requireAdminAuth, (0, auth_1.requirePermission)('orders.update'), controller.adminAddNote);
router.get('/admin/:id/invoice', auth_1.requireAdminAuth, (0, auth_1.requirePermission)('orders.view'), controller.adminDownloadInvoice);
router.get('/', auth_1.requireCustomerAuth, controller.listMyOrders);
router.get('/:id', auth_1.requireCustomerAuth, controller.getMyOrder);
router.get('/:id/invoice', auth_1.requireCustomerAuth, controller.downloadMyInvoice);
router.post('/:id/cancel', auth_1.requireCustomerAuth, [(0, express_validator_1.body)('reason').trim().notEmpty()], validate_1.validate, controller.cancelMyOrder);
router.post('/:id/return', auth_1.requireCustomerAuth, [(0, express_validator_1.body)('reason').trim().notEmpty()], validate_1.validate, controller.requestReturn);
exports.default = router;
//# sourceMappingURL=order.routes.js.map