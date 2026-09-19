"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminModerateReview = exports.adminListReviews = exports.listMyReviews = exports.submitReview = exports.listRecentReviews = exports.listProductReviews = void 0;
const mongoose_1 = require("mongoose");
const catchAsync_1 = require("../utils/catchAsync");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const Review_1 = require("../models/Review");
const Product_1 = require("../models/Product");
const Order_1 = require("../models/Order");
async function recalculateRating(productId) {
    const stats = await Review_1.Review.aggregate([
        { $match: { product: new mongoose_1.Types.ObjectId(productId), status: 'approved' } },
        { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    const { avg = 0, count = 0 } = stats[0] || {};
    await Product_1.Product.findByIdAndUpdate(productId, {
        ratingAverage: Math.round(avg * 10) / 10,
        ratingCount: count,
    });
}
exports.listProductReviews = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { page = '1', limit = '10' } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const filter = { product: req.params.productId, status: 'approved' };
    const [items, total] = await Promise.all([
        Review_1.Review.find(filter)
            .populate('user', 'name avatarUrl')
            .sort({ createdAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum),
        Review_1.Review.countDocuments(filter),
    ]);
    (0, ApiResponse_1.sendSuccess)(res, items, 'Reviews fetched', 200, (0, ApiResponse_1.buildPagination)(pageNum, limitNum, total));
});
exports.listRecentReviews = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit || '8', 10)));
    const reviews = await Review_1.Review.find({ status: 'approved' })
        .populate('user', 'name avatarUrl')
        .populate('product', 'name slug images')
        .sort({ createdAt: -1 })
        .limit(limit);
    (0, ApiResponse_1.sendSuccess)(res, reviews);
});
exports.submitReview = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { productId, rating, title, comment, images, videoUrl } = req.body;
    const existing = await Review_1.Review.findOne({ product: productId, user: req.userId });
    if (existing)
        throw ApiError_1.ApiError.conflict('You have already reviewed this product');
    const verifiedPurchase = !!(await Order_1.Order.exists({
        user: req.userId,
        'items.product': productId,
        orderStatus: { $in: ['delivered', 'shipped', 'out_for_delivery'] },
    }));
    const review = await Review_1.Review.create({
        product: productId,
        user: req.userId,
        rating,
        title,
        comment,
        images: images || [],
        videoUrl,
        verifiedPurchase,
        status: 'pending',
    });
    (0, ApiResponse_1.sendSuccess)(res, review, 'Review submitted and pending approval', 201);
});
exports.listMyReviews = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const reviews = await Review_1.Review.find({ user: req.userId }).populate('product', 'name slug images').sort({ createdAt: -1 });
    (0, ApiResponse_1.sendSuccess)(res, reviews);
});
// ---- Admin ----
exports.adminListReviews = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { status, page = '1', limit = '20' } = req.query;
    const filter = {};
    if (status)
        filter.status = status;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const [items, total] = await Promise.all([
        Review_1.Review.find(filter)
            .populate('user', 'name mobile')
            .populate('product', 'name slug')
            .sort({ createdAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum),
        Review_1.Review.countDocuments(filter),
    ]);
    (0, ApiResponse_1.sendSuccess)(res, items, 'Reviews fetched', 200, (0, ApiResponse_1.buildPagination)(pageNum, limitNum, total));
});
exports.adminModerateReview = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { status } = req.body;
    const review = await Review_1.Review.findById(req.params.id);
    if (!review)
        throw ApiError_1.ApiError.notFound('Review not found');
    review.status = status;
    await review.save();
    await recalculateRating(String(review.product));
    (0, ApiResponse_1.sendSuccess)(res, review, 'Review moderated');
});
//# sourceMappingURL=review.controller.js.map