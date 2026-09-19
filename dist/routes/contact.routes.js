"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
const catchAsync_1 = require("../utils/catchAsync");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const ContactMessage_1 = require("../models/ContactMessage");
const notification_service_1 = require("../services/notification.service");
const router = (0, express_1.Router)();
router.post('/', [(0, express_validator_1.body)('name').trim().notEmpty(), (0, express_validator_1.body)('mobile').matches(/^[6-9]\d{9}$/), (0, express_validator_1.body)('message').trim().notEmpty()], validate_1.validate, (0, catchAsync_1.catchAsync)(async (req, res) => {
    const contact = await ContactMessage_1.ContactMessage.create(req.body);
    await (0, notification_service_1.createNotification)({
        recipientType: 'admin',
        type: 'new_contact_message',
        title: 'New contact message',
        message: `${contact.name} sent a message: "${contact.subject || contact.message.slice(0, 50)}"`,
        link: `/admin/leads/contact/${contact._id}`,
    });
    (0, ApiResponse_1.sendSuccess)(res, contact, 'Thank you for reaching out! We will get back to you soon.', 201);
}));
router.get('/admin/all', auth_1.requireAdminAuth, (0, auth_1.requirePermission)('leads.view'), (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { page = '1', limit = '20', status } = req.query;
    const filter = {};
    if (status)
        filter.status = status;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const [items, total] = await Promise.all([
        ContactMessage_1.ContactMessage.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
        ContactMessage_1.ContactMessage.countDocuments(filter),
    ]);
    (0, ApiResponse_1.sendSuccess)(res, items, 'Messages fetched', 200, (0, ApiResponse_1.buildPagination)(pageNum, limitNum, total));
}));
router.patch('/admin/:id', auth_1.requireAdminAuth, (0, auth_1.requirePermission)('leads.assign'), (0, catchAsync_1.catchAsync)(async (req, res) => {
    const message = await ContactMessage_1.ContactMessage.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!message)
        throw ApiError_1.ApiError.notFound('Message not found');
    (0, ApiResponse_1.sendSuccess)(res, message, 'Message updated');
}));
exports.default = router;
//# sourceMappingURL=contact.routes.js.map