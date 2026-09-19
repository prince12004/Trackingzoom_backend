import { Router } from 'express';
import { requireAdminAuth, requirePermission } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess, buildPagination } from '../utils/ApiResponse';
import { AbandonedCart } from '../models/AbandonedCart';

const router = Router();
router.use(requireAdminAuth, requirePermission('marketing.manage'));

router.get(
  '/',
  catchAsync(async (req, res) => {
    const { page = '1', limit = '20', recovered } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = {};
    if (recovered !== undefined) filter.recovered = recovered === 'true';

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const [items, total, recoveredCount] = await Promise.all([
      AbandonedCart.find(filter)
        .populate('user', 'name mobile email')
        .populate('items.product', 'name slug images')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      AbandonedCart.countDocuments(filter),
      AbandonedCart.countDocuments({ recovered: true }),
    ]);

    const totalCount = await AbandonedCart.countDocuments();
    sendSuccess(
      res,
      { items, recoveryRate: totalCount > 0 ? Math.round((recoveredCount / totalCount) * 1000) / 10 : 0 },
      'Abandoned carts fetched',
      200,
      buildPagination(pageNum, limitNum, total)
    );
  })
);

export default router;
