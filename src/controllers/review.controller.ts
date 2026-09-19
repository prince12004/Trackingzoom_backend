import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess, buildPagination } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { Review } from '../models/Review';
import { Product } from '../models/Product';
import { Order } from '../models/Order';

async function recalculateRating(productId: string) {
  const stats = await Review.aggregate([
    { $match: { product: new Types.ObjectId(productId), status: 'approved' } },
    { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const { avg = 0, count = 0 } = stats[0] || {};
  await Product.findByIdAndUpdate(productId, {
    ratingAverage: Math.round(avg * 10) / 10,
    ratingCount: count,
  });
}

export const listProductReviews = catchAsync(async (req: Request, res: Response) => {
  const { page = '1', limit = '10' } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));

  const filter = { product: req.params.productId, status: 'approved' };
  const [items, total] = await Promise.all([
    Review.find(filter)
      .populate('user', 'name avatarUrl')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Review.countDocuments(filter),
  ]);

  sendSuccess(res, items, 'Reviews fetched', 200, buildPagination(pageNum, limitNum, total));
});

export const listRecentReviews = catchAsync(async (req: Request, res: Response) => {
  const limit = Math.min(20, Math.max(1, parseInt((req.query.limit as string) || '8', 10)));
  const reviews = await Review.find({ status: 'approved' })
    .populate('user', 'name avatarUrl')
    .populate('product', 'name slug images')
    .sort({ createdAt: -1 })
    .limit(limit);
  sendSuccess(res, reviews);
});

export const submitReview = catchAsync(async (req: Request, res: Response) => {
  const { productId, rating, title, comment, images, videoUrl } = req.body;

  const existing = await Review.findOne({ product: productId, user: req.userId });
  if (existing) throw ApiError.conflict('You have already reviewed this product');

  const verifiedPurchase = !!(await Order.exists({
    user: req.userId,
    'items.product': productId,
    orderStatus: { $in: ['delivered', 'shipped', 'out_for_delivery'] },
  }));

  const review = await Review.create({
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

  sendSuccess(res, review, 'Review submitted and pending approval', 201);
});

export const listMyReviews = catchAsync(async (req: Request, res: Response) => {
  const reviews = await Review.find({ user: req.userId }).populate('product', 'name slug images').sort({ createdAt: -1 });
  sendSuccess(res, reviews);
});

// ---- Admin ----

export const adminListReviews = catchAsync(async (req: Request, res: Response) => {
  const { status, page = '1', limit = '20' } = req.query as Record<string, string>;
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  const [items, total] = await Promise.all([
    Review.find(filter)
      .populate('user', 'name mobile')
      .populate('product', 'name slug')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Review.countDocuments(filter),
  ]);

  sendSuccess(res, items, 'Reviews fetched', 200, buildPagination(pageNum, limitNum, total));
});

export const adminModerateReview = catchAsync(async (req: Request, res: Response) => {
  const { status } = req.body as { status: 'approved' | 'rejected' };
  const review = await Review.findById(req.params.id);
  if (!review) throw ApiError.notFound('Review not found');

  review.status = status;
  await review.save();
  await recalculateRating(String(review.product));

  sendSuccess(res, review, 'Review moderated');
});
