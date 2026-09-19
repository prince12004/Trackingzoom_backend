"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const catchAsync_1 = require("../utils/catchAsync");
const ApiResponse_1 = require("../utils/ApiResponse");
const AbandonedCart_1 = require("../models/AbandonedCart");
const router = (0, express_1.Router)();
router.use(auth_1.requireAdminAuth, (0, auth_1.requirePermission)('marketing.manage'));
router.get('/', (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { page = '1', limit = '20', recovered } = req.query;
    const filter = {};
    if (recovered !== undefined)
        filter.recovered = recovered === 'true';
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const [items, total, recoveredCount] = await Promise.all([
        AbandonedCart_1.AbandonedCart.find(filter)
            .populate('user', 'name mobile email')
            .populate('items.product', 'name slug images')
            .sort({ createdAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum),
        AbandonedCart_1.AbandonedCart.countDocuments(filter),
        AbandonedCart_1.AbandonedCart.countDocuments({ recovered: true }),
    ]);
    const totalCount = await AbandonedCart_1.AbandonedCart.countDocuments();
    (0, ApiResponse_1.sendSuccess)(res, { items, recoveryRate: totalCount > 0 ? Math.round((recoveredCount / totalCount) * 1000) / 10 : 0 }, 'Abandoned carts fetched', 200, (0, ApiResponse_1.buildPagination)(pageNum, limitNum, total));
}));
exports.default = router;
//# sourceMappingURL=abandonedCart.routes.js.map