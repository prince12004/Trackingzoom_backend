import { Router } from 'express';
import { requireAdminAuth, requirePermission } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess } from '../utils/ApiResponse';
import { Order } from '../models/Order';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { Lead } from '../models/Lead';
import { AbandonedCart } from '../models/AbandonedCart';

function rangeFromQuery(range?: string, from?: string, to?: string) {
  const now = new Date();
  if (from && to) return { start: new Date(from), end: new Date(to) };

  const end = new Date(now);
  const start = new Date(now);
  switch (range) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'yesterday':
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      break;
    case '30d':
      start.setDate(start.getDate() - 30);
      break;
    case 'this_month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    case '7d':
    default:
      start.setDate(start.getDate() - 7);
  }
  return { start, end };
}

const router = Router();
router.use(requireAdminAuth, requirePermission('reports.view'));

router.get(
  '/summary',
  catchAsync(async (req, res) => {
    const { range, from, to } = req.query as Record<string, string>;
    const { start, end } = rangeFromQuery(range, from, to);
    const dateFilter = { createdAt: { $gte: start, $lte: end } };

    const [
      salesAgg,
      totalOrders,
      pendingOrders,
      deliveredOrders,
      cancelledOrders,
      totalCustomers,
      newCustomers,
      totalProducts,
      lowStock,
      outOfStock,
      callbackLeads,
      abandonedCarts,
      topProducts,
      revenueByDate,
    ] = await Promise.all([
      Order.aggregate([
        { $match: { ...dateFilter, paymentStatus: { $in: ['success', 'pending'] }, orderStatus: { $ne: 'cancelled' } } },
        { $group: { _id: null, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
      ]),
      Order.countDocuments(dateFilter),
      Order.countDocuments({ ...dateFilter, orderStatus: 'pending' }),
      Order.countDocuments({ ...dateFilter, orderStatus: 'delivered' }),
      Order.countDocuments({ ...dateFilter, orderStatus: 'cancelled' }),
      User.countDocuments({}),
      User.countDocuments(dateFilter),
      Product.countDocuments({ status: 'active' }),
      Product.countDocuments({ status: 'active', $expr: { $lte: ['$stockQuantity', '$minStockLevel'] }, stockQuantity: { $gt: 0 } }),
      Product.countDocuments({ status: 'active', stockQuantity: 0 }),
      Lead.countDocuments(dateFilter),
      AbandonedCart.countDocuments({ ...dateFilter, recovered: false }),
      Order.aggregate([
        { $match: dateFilter },
        { $unwind: '$items' },
        { $group: { _id: '$items.product', unitsSold: { $sum: '$items.quantity' }, revenue: { $sum: '$items.lineTotal' } } },
        { $sort: { unitsSold: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
        { $unwind: '$product' },
        { $project: { name: '$product.name', slug: '$product.slug', unitsSold: 1, revenue: 1 } },
      ]),
      Order.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$totalAmount' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    sendSuccess(res, {
      revenue: salesAgg[0]?.revenue || 0,
      orderCount: salesAgg[0]?.count || 0,
      totalOrders,
      pendingOrders,
      deliveredOrders,
      cancelledOrders,
      totalCustomers,
      newCustomers,
      totalProducts,
      lowStock,
      outOfStock,
      callbackLeads,
      abandonedCarts,
      conversionRate: totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 1000) / 10 : 0,
      topProducts,
      revenueByDate,
    });
  })
);

export default router;
