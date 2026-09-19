import { Router } from 'express';
import { requireAdminAuth, requirePermission } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { toCsv, sendCsv } from '../utils/csv';
import { Order } from '../models/Order';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { Lead } from '../models/Lead';
import { StockMovement } from '../models/StockMovement';

const router = Router();
router.use(requireAdminAuth, requirePermission('reports.view'));

router.get(
  '/orders',
  catchAsync(async (_req, res) => {
    const orders = await Order.find().populate('user', 'name mobile').sort({ createdAt: -1 }).limit(5000);
    const csv = toCsv(
      orders.map((o) => ({
        orderNumber: o.orderNumber,
        customer: (o.user as unknown as { name?: string })?.name,
        mobile: o.shippingAddress.mobile,
        amount: o.totalAmount,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        orderStatus: o.orderStatus,
        date: o.createdAt.toISOString(),
      })),
      [
        { key: 'orderNumber', label: 'Order Number' },
        { key: 'customer', label: 'Customer' },
        { key: 'mobile', label: 'Mobile' },
        { key: 'amount', label: 'Amount' },
        { key: 'paymentMethod', label: 'Payment Method' },
        { key: 'paymentStatus', label: 'Payment Status' },
        { key: 'orderStatus', label: 'Order Status' },
        { key: 'date', label: 'Date' },
      ]
    );
    sendCsv(res, 'orders.csv', csv);
  })
);

router.get(
  '/customers',
  catchAsync(async (_req, res) => {
    const customers = await User.find().sort({ createdAt: -1 }).limit(5000);
    const csv = toCsv(
      customers.map((c) => ({
        name: c.name,
        mobile: c.mobile,
        email: c.email,
        status: c.status,
        registeredOn: c.createdAt.toISOString(),
      })),
      [
        { key: 'name', label: 'Name' },
        { key: 'mobile', label: 'Mobile' },
        { key: 'email', label: 'Email' },
        { key: 'status', label: 'Status' },
        { key: 'registeredOn', label: 'Registered On' },
      ]
    );
    sendCsv(res, 'customers.csv', csv);
  })
);

router.get(
  '/products',
  catchAsync(async (_req, res) => {
    const products = await Product.find().populate('category', 'name').sort({ createdAt: -1 }).limit(5000);
    const csv = toCsv(
      products.map((p) => ({
        name: p.name,
        sku: p.sku,
        category: (p.category as unknown as { name?: string })?.name,
        price: p.regularPrice,
        salePrice: p.salePrice,
        stock: p.stockQuantity,
        status: p.status,
      })),
      [
        { key: 'name', label: 'Name' },
        { key: 'sku', label: 'SKU' },
        { key: 'category', label: 'Category' },
        { key: 'price', label: 'Price' },
        { key: 'salePrice', label: 'Sale Price' },
        { key: 'stock', label: 'Stock' },
        { key: 'status', label: 'Status' },
      ]
    );
    sendCsv(res, 'products.csv', csv);
  })
);

router.get(
  '/leads',
  catchAsync(async (_req, res) => {
    const leads = await Lead.find().sort({ createdAt: -1 }).limit(5000);
    const csv = toCsv(
      leads.map((l) => ({
        name: l.name,
        mobile: l.mobile,
        email: l.email,
        type: l.leadType,
        status: l.status,
        date: l.createdAt.toISOString(),
      })),
      [
        { key: 'name', label: 'Name' },
        { key: 'mobile', label: 'Mobile' },
        { key: 'email', label: 'Email' },
        { key: 'type', label: 'Type' },
        { key: 'status', label: 'Status' },
        { key: 'date', label: 'Date' },
      ]
    );
    sendCsv(res, 'leads.csv', csv);
  })
);

router.get(
  '/stock-movements',
  catchAsync(async (_req, res) => {
    const movements = await StockMovement.find().populate('product', 'name sku').sort({ createdAt: -1 }).limit(5000);
    const csv = toCsv(
      movements.map((m) => ({
        product: (m.product as unknown as { name?: string })?.name,
        sku: (m.product as unknown as { sku?: string })?.sku,
        type: m.movementType,
        change: m.quantityChanged,
        newStock: m.newStock,
        date: m.createdAt.toISOString(),
      })),
      [
        { key: 'product', label: 'Product' },
        { key: 'sku', label: 'SKU' },
        { key: 'type', label: 'Movement Type' },
        { key: 'change', label: 'Quantity Changed' },
        { key: 'newStock', label: 'New Stock' },
        { key: 'date', label: 'Date' },
      ]
    );
    sendCsv(res, 'stock-movements.csv', csv);
  })
);

export default router;
