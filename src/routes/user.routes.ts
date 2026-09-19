import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { requireCustomerAuth, requireAdminAuth, requirePermission } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess, buildPagination } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { User } from '../models/User';
import { Order } from '../models/Order';

const router = Router();

router.patch(
  '/me',
  requireCustomerAuth,
  [
    body('name').optional().trim().isLength({ min: 2 }),
    body('email').optional().isEmail(),
    body('gender').optional().isIn(['male', 'female', 'other']),
  ],
  validate,
  catchAsync(async (req, res) => {
    const { name, email, gender, dob, avatarUrl, marketingOptIn } = req.body;
    const user = await User.findById(req.userId);
    if (!user) throw ApiError.notFound('User not found');

    if (name) user.name = name;
    if (email && email !== user.email) {
      user.email = email;
      user.emailVerified = false;
    }
    if (gender) user.gender = gender;
    if (dob) user.dob = dob;
    if (avatarUrl) user.avatarUrl = avatarUrl;
    if (typeof marketingOptIn === 'boolean') user.marketingOptIn = marketingOptIn;

    await user.save();
    sendSuccess(res, user, 'Profile updated');
  })
);

router.get(
  '/me/dashboard',
  requireCustomerAuth,
  catchAsync(async (req, res) => {
    const [totalOrders, activeOrders, deliveredOrders] = await Promise.all([
      Order.countDocuments({ user: req.userId }),
      Order.countDocuments({
        user: req.userId,
        orderStatus: { $in: ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery'] },
      }),
      Order.countDocuments({ user: req.userId, orderStatus: 'delivered' }),
    ]);
    sendSuccess(res, { totalOrders, activeOrders, deliveredOrders });
  })
);

// ---- Admin ----

router.get(
  '/admin/all',
  requireAdminAuth,
  requirePermission('customers.view'),
  catchAsync(async (req, res) => {
    const { page = '1', limit = '20', search } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = {};
    if (search) {
      filter.$or = [{ name: new RegExp(search, 'i') }, { mobile: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const [items, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
      User.countDocuments(filter),
    ]);

    sendSuccess(res, items, 'Customers fetched', 200, buildPagination(pageNum, limitNum, total));
  })
);

router.get(
  '/admin/:id',
  requireAdminAuth,
  requirePermission('customers.view'),
  catchAsync(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) throw ApiError.notFound('Customer not found');

    const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(20);
    const totalSpent = await Order.aggregate([
      { $match: { user: user._id, paymentStatus: 'success' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    sendSuccess(res, { user, orders, totalSpent: totalSpent[0]?.total || 0 });
  })
);

router.patch(
  '/admin/:id/status',
  requireAdminAuth,
  requirePermission('customers.manage'),
  [body('status').isIn(['active', 'blocked'])],
  validate,
  catchAsync(async (req, res) => {
    const user = await User.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!user) throw ApiError.notFound('Customer not found');
    sendSuccess(res, user, 'Customer status updated');
  })
);

router.delete(
  '/admin/:id',
  requireAdminAuth,
  requirePermission('customers.manage'),
  catchAsync(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) throw ApiError.notFound('Customer not found');

    const orderCount = await Order.countDocuments({ user: user._id });
    if (orderCount > 0) {
      throw ApiError.badRequest(
        `This customer has ${orderCount} order(s) on record. Block the account instead of deleting it, so order history stays intact.`
      );
    }

    const { Cart } = await import('../models/Cart');
    const { Address } = await import('../models/Address');
    const { Wishlist } = await import('../models/Wishlist');
    const { CompareList } = await import('../models/CompareList');
    const { OtpToken } = await import('../models/OtpToken');

    await Promise.all([
      Cart.deleteMany({ user: user._id }),
      Address.deleteMany({ user: user._id }),
      Wishlist.deleteMany({ user: user._id }),
      CompareList.deleteMany({ user: user._id }),
      OtpToken.deleteMany({ mobile: user.mobile }),
    ]);
    await user.deleteOne();

    sendSuccess(res, null, 'Customer deleted');
  })
);

export default router;
