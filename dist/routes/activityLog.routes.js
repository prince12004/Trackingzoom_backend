"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const catchAsync_1 = require("../utils/catchAsync");
const ApiResponse_1 = require("../utils/ApiResponse");
const ActivityLog_1 = require("../models/ActivityLog");
const router = (0, express_1.Router)();
router.get('/', auth_1.requireAdminAuth, (0, auth_1.requirePermission)('activitylog.view'), (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { page = '1', limit = '30', module, admin } = req.query;
    const filter = {};
    if (module)
        filter.module = module;
    if (admin)
        filter.admin = admin;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 30));
    const [items, total] = await Promise.all([
        ActivityLog_1.ActivityLog.find(filter)
            .populate('admin', 'name email')
            .sort({ createdAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum),
        ActivityLog_1.ActivityLog.countDocuments(filter),
    ]);
    (0, ApiResponse_1.sendSuccess)(res, items, 'Activity log fetched', 200, (0, ApiResponse_1.buildPagination)(pageNum, limitNum, total));
}));
exports.default = router;
//# sourceMappingURL=activityLog.routes.js.map