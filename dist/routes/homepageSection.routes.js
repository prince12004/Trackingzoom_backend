"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const catchAsync_1 = require("../utils/catchAsync");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const HomepageSection_1 = require("../models/HomepageSection");
const router = (0, express_1.Router)();
router.get('/', (0, catchAsync_1.catchAsync)(async (_req, res) => {
    const sections = await HomepageSection_1.HomepageSection.find({ enabled: true }).sort({ displayOrder: 1 });
    (0, ApiResponse_1.sendSuccess)(res, sections);
}));
router.get('/admin/all', auth_1.requireAdminAuth, (0, auth_1.requirePermission)('marketing.manage'), (0, catchAsync_1.catchAsync)(async (_req, res) => {
    const sections = await HomepageSection_1.HomepageSection.find().sort({ displayOrder: 1 });
    (0, ApiResponse_1.sendSuccess)(res, sections);
}));
router.patch('/admin/:id', auth_1.requireAdminAuth, (0, auth_1.requirePermission)('marketing.manage'), (0, catchAsync_1.catchAsync)(async (req, res) => {
    const section = await HomepageSection_1.HomepageSection.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!section)
        throw ApiError_1.ApiError.notFound('Homepage section not found');
    (0, ApiResponse_1.sendSuccess)(res, section, 'Homepage section updated');
}));
router.post('/admin/reorder', auth_1.requireAdminAuth, (0, auth_1.requirePermission)('marketing.manage'), (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { order } = req.body;
    await Promise.all(order.map((o) => HomepageSection_1.HomepageSection.findByIdAndUpdate(o.id, { displayOrder: o.displayOrder })));
    const sections = await HomepageSection_1.HomepageSection.find().sort({ displayOrder: 1 });
    (0, ApiResponse_1.sendSuccess)(res, sections, 'Homepage sections reordered');
}));
exports.default = router;
//# sourceMappingURL=homepageSection.routes.js.map