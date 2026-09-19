"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
const catchAsync_1 = require("../utils/catchAsync");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const Lead_1 = require("../models/Lead");
const notification_service_1 = require("../services/notification.service");
const router = (0, express_1.Router)();
router.post('/', [
    (0, express_validator_1.body)('name').trim().notEmpty(),
    (0, express_validator_1.body)('mobile').matches(/^[6-9]\d{9}$/),
    (0, express_validator_1.body)('leadType').isIn(['callback', 'expert']),
], validate_1.validate, (0, catchAsync_1.catchAsync)(async (req, res) => {
    const lead = await Lead_1.Lead.create(req.body);
    await (0, notification_service_1.createNotification)({
        recipientType: 'admin',
        type: 'new_lead',
        title: 'New callback request',
        message: `${lead.name} (${lead.mobile}) requested a callback.`,
        link: `/admin/leads/${lead._id}`,
    });
    (0, ApiResponse_1.sendSuccess)(res, lead, 'Thank you! Our team will contact you shortly.', 201);
}));
router.get('/admin/all', auth_1.requireAdminAuth, (0, auth_1.requirePermission)('leads.view'), (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { page = '1', limit = '20', status } = req.query;
    const filter = {};
    if (status)
        filter.status = status;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const [items, total] = await Promise.all([
        Lead_1.Lead.find(filter)
            .populate('assignedTo', 'name email')
            .populate('interestedProduct', 'name')
            .sort({ createdAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum),
        Lead_1.Lead.countDocuments(filter),
    ]);
    (0, ApiResponse_1.sendSuccess)(res, items, 'Leads fetched', 200, (0, ApiResponse_1.buildPagination)(pageNum, limitNum, total));
}));
router.patch('/admin/:id', auth_1.requireAdminAuth, (0, auth_1.requirePermission)('leads.assign'), (0, catchAsync_1.catchAsync)(async (req, res) => {
    const lead = await Lead_1.Lead.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!lead)
        throw ApiError_1.ApiError.notFound('Lead not found');
    (0, ApiResponse_1.sendSuccess)(res, lead, 'Lead updated');
}));
exports.default = router;
//# sourceMappingURL=lead.routes.js.map