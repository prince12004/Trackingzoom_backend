"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const catchAsync_1 = require("../utils/catchAsync");
const csv_1 = require("../utils/csv");
const Order_1 = require("../models/Order");
const User_1 = require("../models/User");
const Product_1 = require("../models/Product");
const Lead_1 = require("../models/Lead");
const StockMovement_1 = require("../models/StockMovement");
const router = (0, express_1.Router)();
router.use(auth_1.requireAdminAuth, (0, auth_1.requirePermission)('reports.view'));
router.get('/orders', (0, catchAsync_1.catchAsync)(async (_req, res) => {
    const orders = await Order_1.Order.find().populate('user', 'name mobile').sort({ createdAt: -1 }).limit(5000);
    const csv = (0, csv_1.toCsv)(orders.map((o) => ({
        orderNumber: o.orderNumber,
        customer: o.user?.name,
        mobile: o.shippingAddress.mobile,
        amount: o.totalAmount,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        orderStatus: o.orderStatus,
        date: o.createdAt.toISOString(),
    })), [
        { key: 'orderNumber', label: 'Order Number' },
        { key: 'customer', label: 'Customer' },
        { key: 'mobile', label: 'Mobile' },
        { key: 'amount', label: 'Amount' },
        { key: 'paymentMethod', label: 'Payment Method' },
        { key: 'paymentStatus', label: 'Payment Status' },
        { key: 'orderStatus', label: 'Order Status' },
        { key: 'date', label: 'Date' },
    ]);
    (0, csv_1.sendCsv)(res, 'orders.csv', csv);
}));
router.get('/customers', (0, catchAsync_1.catchAsync)(async (_req, res) => {
    const customers = await User_1.User.find().sort({ createdAt: -1 }).limit(5000);
    const csv = (0, csv_1.toCsv)(customers.map((c) => ({
        name: c.name,
        mobile: c.mobile,
        email: c.email,
        status: c.status,
        registeredOn: c.createdAt.toISOString(),
    })), [
        { key: 'name', label: 'Name' },
        { key: 'mobile', label: 'Mobile' },
        { key: 'email', label: 'Email' },
        { key: 'status', label: 'Status' },
        { key: 'registeredOn', label: 'Registered On' },
    ]);
    (0, csv_1.sendCsv)(res, 'customers.csv', csv);
}));
router.get('/products', (0, catchAsync_1.catchAsync)(async (_req, res) => {
    const products = await Product_1.Product.find().populate('category', 'name').sort({ createdAt: -1 }).limit(5000);
    const csv = (0, csv_1.toCsv)(products.map((p) => ({
        name: p.name,
        sku: p.sku,
        category: p.category?.name,
        price: p.regularPrice,
        salePrice: p.salePrice,
        stock: p.stockQuantity,
        status: p.status,
    })), [
        { key: 'name', label: 'Name' },
        { key: 'sku', label: 'SKU' },
        { key: 'category', label: 'Category' },
        { key: 'price', label: 'Price' },
        { key: 'salePrice', label: 'Sale Price' },
        { key: 'stock', label: 'Stock' },
        { key: 'status', label: 'Status' },
    ]);
    (0, csv_1.sendCsv)(res, 'products.csv', csv);
}));
router.get('/leads', (0, catchAsync_1.catchAsync)(async (_req, res) => {
    const leads = await Lead_1.Lead.find().sort({ createdAt: -1 }).limit(5000);
    const csv = (0, csv_1.toCsv)(leads.map((l) => ({
        name: l.name,
        mobile: l.mobile,
        email: l.email,
        type: l.leadType,
        status: l.status,
        date: l.createdAt.toISOString(),
    })), [
        { key: 'name', label: 'Name' },
        { key: 'mobile', label: 'Mobile' },
        { key: 'email', label: 'Email' },
        { key: 'type', label: 'Type' },
        { key: 'status', label: 'Status' },
        { key: 'date', label: 'Date' },
    ]);
    (0, csv_1.sendCsv)(res, 'leads.csv', csv);
}));
router.get('/stock-movements', (0, catchAsync_1.catchAsync)(async (_req, res) => {
    const movements = await StockMovement_1.StockMovement.find().populate('product', 'name sku').sort({ createdAt: -1 }).limit(5000);
    const csv = (0, csv_1.toCsv)(movements.map((m) => ({
        product: m.product?.name,
        sku: m.product?.sku,
        type: m.movementType,
        change: m.quantityChanged,
        newStock: m.newStock,
        date: m.createdAt.toISOString(),
    })), [
        { key: 'product', label: 'Product' },
        { key: 'sku', label: 'SKU' },
        { key: 'type', label: 'Movement Type' },
        { key: 'change', label: 'Quantity Changed' },
        { key: 'newStock', label: 'New Stock' },
        { key: 'date', label: 'Date' },
    ]);
    (0, csv_1.sendCsv)(res, 'stock-movements.csv', csv);
}));
exports.default = router;
//# sourceMappingURL=export.routes.js.map