"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
const catchAsync_1 = require("../utils/catchAsync");
const ApiResponse_1 = require("../utils/ApiResponse");
const Product_1 = require("../models/Product");
const Inventory_1 = require("../models/Inventory");
const StockMovement_1 = require("../models/StockMovement");
const inventory_service_1 = require("../services/inventory.service");
const router = (0, express_1.Router)();
router.use(auth_1.requireAdminAuth, (0, auth_1.requirePermission)('inventory.view'));
router.get('/dashboard', (0, catchAsync_1.catchAsync)(async (_req, res) => {
    const [totalProducts, stockAgg, lowStockProducts, outOfStockCount] = await Promise.all([
        Product_1.Product.countDocuments({ status: 'active' }),
        Inventory_1.Inventory.aggregate([
            { $group: { _id: null, totalAvailable: { $sum: '$available' }, totalReserved: { $sum: '$reserved' } } },
        ]),
        Product_1.Product.find({ status: 'active', $expr: { $lte: ['$stockQuantity', '$minStockLevel'] }, stockQuantity: { $gt: 0 } })
            .select('name sku stockQuantity minStockLevel')
            .limit(50),
        Product_1.Product.countDocuments({ status: 'active', stockQuantity: 0 }),
    ]);
    const recentMovements = await StockMovement_1.StockMovement.find()
        .populate('product', 'name sku')
        .populate('admin', 'name')
        .sort({ createdAt: -1 })
        .limit(20);
    (0, ApiResponse_1.sendSuccess)(res, {
        totalProducts,
        totalStock: stockAgg[0]?.totalAvailable || 0,
        totalReserved: stockAgg[0]?.totalReserved || 0,
        lowStockCount: lowStockProducts.length,
        outOfStockCount,
        lowStockProducts,
        recentMovements,
    });
}));
router.get('/movements', (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { page = '1', limit = '30', product } = req.query;
    const filter = {};
    if (product)
        filter.product = product;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 30));
    const [items, total] = await Promise.all([
        StockMovement_1.StockMovement.find(filter)
            .populate('product', 'name sku')
            .populate('variant', 'sku')
            .populate('admin', 'name')
            .sort({ createdAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum),
        StockMovement_1.StockMovement.countDocuments(filter),
    ]);
    (0, ApiResponse_1.sendSuccess)(res, items, 'Stock movements fetched', 200, (0, ApiResponse_1.buildPagination)(pageNum, limitNum, total));
}));
router.post('/adjust', (0, auth_1.requirePermission)('inventory.adjust'), [
    (0, express_validator_1.body)('productId').isMongoId(),
    (0, express_validator_1.body)('quantity').isInt(),
    (0, express_validator_1.body)('movementType').isIn(['manual_addition', 'damage', 'adjustment']),
    (0, express_validator_1.body)('reason').trim().notEmpty(),
], validate_1.validate, (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { productId, variantId, quantity, movementType, reason } = req.body;
    const inv = await (0, inventory_service_1.addStock)({
        productId,
        variantId,
        quantity,
        movementType,
        adminId: req.adminId,
        reason,
    });
    (0, ApiResponse_1.sendSuccess)(res, inv, 'Stock adjusted');
}));
exports.default = router;
//# sourceMappingURL=inventory.routes.js.map