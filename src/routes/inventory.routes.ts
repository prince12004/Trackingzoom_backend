import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { requireAdminAuth, requirePermission } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess, buildPagination } from '../utils/ApiResponse';
import { Product } from '../models/Product';
import { Inventory } from '../models/Inventory';
import { StockMovement } from '../models/StockMovement';
import { addStock } from '../services/inventory.service';

const router = Router();
router.use(requireAdminAuth, requirePermission('inventory.view'));

router.get(
  '/dashboard',
  catchAsync(async (_req, res) => {
    const [totalProducts, stockAgg, lowStockProducts, outOfStockCount] = await Promise.all([
      Product.countDocuments({ status: 'active' }),
      Inventory.aggregate([
        { $group: { _id: null, totalAvailable: { $sum: '$available' }, totalReserved: { $sum: '$reserved' } } },
      ]),
      Product.find({ status: 'active', $expr: { $lte: ['$stockQuantity', '$minStockLevel'] }, stockQuantity: { $gt: 0 } })
        .select('name sku stockQuantity minStockLevel')
        .limit(50),
      Product.countDocuments({ status: 'active', stockQuantity: 0 }),
    ]);

    const recentMovements = await StockMovement.find()
      .populate('product', 'name sku')
      .populate('admin', 'name')
      .sort({ createdAt: -1 })
      .limit(20);

    sendSuccess(res, {
      totalProducts,
      totalStock: stockAgg[0]?.totalAvailable || 0,
      totalReserved: stockAgg[0]?.totalReserved || 0,
      lowStockCount: lowStockProducts.length,
      outOfStockCount,
      lowStockProducts,
      recentMovements,
    });
  })
);

router.get(
  '/movements',
  catchAsync(async (req, res) => {
    const { page = '1', limit = '30', product } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = {};
    if (product) filter.product = product;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 30));

    const [items, total] = await Promise.all([
      StockMovement.find(filter)
        .populate('product', 'name sku')
        .populate('variant', 'sku')
        .populate('admin', 'name')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      StockMovement.countDocuments(filter),
    ]);

    sendSuccess(res, items, 'Stock movements fetched', 200, buildPagination(pageNum, limitNum, total));
  })
);

router.post(
  '/adjust',
  requirePermission('inventory.adjust'),
  [
    body('productId').isMongoId(),
    body('quantity').isInt(),
    body('movementType').isIn(['manual_addition', 'damage', 'adjustment']),
    body('reason').trim().notEmpty(),
  ],
  validate,
  catchAsync(async (req, res) => {
    const { productId, variantId, quantity, movementType, reason } = req.body;
    const inv = await addStock({
      productId,
      variantId,
      quantity,
      movementType,
      adminId: req.adminId,
      reason,
    });
    sendSuccess(res, inv, 'Stock adjusted');
  })
);

export default router;
