"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
const catchAsync_1 = require("../utils/catchAsync");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const User_1 = require("../models/User");
const Order_1 = require("../models/Order");
const router = (0, express_1.Router)();
router.patch('/me', auth_1.requireCustomerAuth, [
    (0, express_validator_1.body)('name').optional().trim().isLength({ min: 2 }),
    (0, express_validator_1.body)('email').optional().isEmail(),
    (0, express_validator_1.body)('gender').optional().isIn(['male', 'female', 'other']),
], validate_1.validate, (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { name, email, gender, dob, avatarUrl, marketingOptIn } = req.body;
    const user = await User_1.User.findById(req.userId);
    if (!user)
        throw ApiError_1.ApiError.notFound('User not found');
    if (name)
        user.name = name;
    if (email && email !== user.email) {
        user.email = email;
        user.emailVerified = false;
    }
    if (gender)
        user.gender = gender;
    if (dob)
        user.dob = dob;
    if (avatarUrl)
        user.avatarUrl = avatarUrl;
    if (typeof marketingOptIn === 'boolean')
        user.marketingOptIn = marketingOptIn;
    await user.save();
    (0, ApiResponse_1.sendSuccess)(res, user, 'Profile updated');
}));
router.get('/me/dashboard', auth_1.requireCustomerAuth, (0, catchAsync_1.catchAsync)(async (req, res) => {
    const [totalOrders, activeOrders, deliveredOrders] = await Promise.all([
        Order_1.Order.countDocuments({ user: req.userId }),
        Order_1.Order.countDocuments({
            user: req.userId,
            orderStatus: { $in: ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery'] },
        }),
        Order_1.Order.countDocuments({ user: req.userId, orderStatus: 'delivered' }),
    ]);
    (0, ApiResponse_1.sendSuccess)(res, { totalOrders, activeOrders, deliveredOrders });
}));
// ---- Admin ----
router.get('/admin/all', auth_1.requireAdminAuth, (0, auth_1.requirePermission)('customers.view'), (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { page = '1', limit = '20', search } = req.query;
    const filter = {};
    if (search) {
        filter.$or = [{ name: new RegExp(search, 'i') }, { mobile: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
    }
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const [items, total] = await Promise.all([
        User_1.User.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
        User_1.User.countDocuments(filter),
    ]);
    (0, ApiResponse_1.sendSuccess)(res, items, 'Customers fetched', 200, (0, ApiResponse_1.buildPagination)(pageNum, limitNum, total));
}));
router.get('/admin/:id', auth_1.requireAdminAuth, (0, auth_1.requirePermission)('customers.view'), (0, catchAsync_1.catchAsync)(async (req, res) => {
    const user = await User_1.User.findById(req.params.id);
    if (!user)
        throw ApiError_1.ApiError.notFound('Customer not found');
    const orders = await Order_1.Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(20);
    const totalSpent = await Order_1.Order.aggregate([
        { $match: { user: user._id, paymentStatus: 'success' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    (0, ApiResponse_1.sendSuccess)(res, { user, orders, totalSpent: totalSpent[0]?.total || 0 });
}));
router.patch('/admin/:id/status', auth_1.requireAdminAuth, (0, auth_1.requirePermission)('customers.manage'), [(0, express_validator_1.body)('status').isIn(['active', 'blocked'])], validate_1.validate, (0, catchAsync_1.catchAsync)(async (req, res) => {
    const user = await User_1.User.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!user)
        throw ApiError_1.ApiError.notFound('Customer not found');
    (0, ApiResponse_1.sendSuccess)(res, user, 'Customer status updated');
}));
exports.default = router;
//# sourceMappingURL=user.routes.js.map