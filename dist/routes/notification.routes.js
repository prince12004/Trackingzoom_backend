"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const catchAsync_1 = require("../utils/catchAsync");
const ApiResponse_1 = require("../utils/ApiResponse");
const Notification_1 = require("../models/Notification");
const router = (0, express_1.Router)();
router.get('/customer', auth_1.requireCustomerAuth, (0, catchAsync_1.catchAsync)(async (req, res) => {
    const notifications = await Notification_1.Notification.find({ recipientType: 'customer', recipient: req.userId })
        .sort({ createdAt: -1 })
        .limit(50);
    const unreadCount = await Notification_1.Notification.countDocuments({
        recipientType: 'customer',
        recipient: req.userId,
        read: false,
    });
    (0, ApiResponse_1.sendSuccess)(res, { notifications, unreadCount });
}));
router.patch('/customer/:id/read', auth_1.requireCustomerAuth, (0, catchAsync_1.catchAsync)(async (req, res) => {
    await Notification_1.Notification.findOneAndUpdate({ _id: req.params.id, recipientType: 'customer', recipient: req.userId }, { read: true });
    (0, ApiResponse_1.sendSuccess)(res, null, 'Marked as read');
}));
router.patch('/customer/read-all', auth_1.requireCustomerAuth, (0, catchAsync_1.catchAsync)(async (req, res) => {
    await Notification_1.Notification.updateMany({ recipientType: 'customer', recipient: req.userId, read: false }, { read: true });
    (0, ApiResponse_1.sendSuccess)(res, null, 'All notifications marked as read');
}));
router.get('/admin', auth_1.requireAdminAuth, (0, catchAsync_1.catchAsync)(async (_req, res) => {
    const notifications = await Notification_1.Notification.find({ recipientType: 'admin' }).sort({ createdAt: -1 }).limit(50);
    const unreadCount = await Notification_1.Notification.countDocuments({ recipientType: 'admin', read: false });
    (0, ApiResponse_1.sendSuccess)(res, { notifications, unreadCount });
}));
router.patch('/admin/:id/read', auth_1.requireAdminAuth, (0, catchAsync_1.catchAsync)(async (req, res) => {
    await Notification_1.Notification.findOneAndUpdate({ _id: req.params.id, recipientType: 'admin' }, { read: true });
    (0, ApiResponse_1.sendSuccess)(res, null, 'Marked as read');
}));
exports.default = router;
//# sourceMappingURL=notification.routes.js.map