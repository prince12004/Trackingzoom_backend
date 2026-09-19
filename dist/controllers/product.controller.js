"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVariant = exports.updateVariant = exports.createVariant = exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.adminGetProduct = exports.adminListProducts = exports.searchAutocomplete = exports.getProductBySlug = exports.listProducts = void 0;
exports.effectivePrice = effectivePrice;
const catchAsync_1 = require("../utils/catchAsync");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const Product_1 = require("../models/Product");
const ProductVariant_1 = require("../models/ProductVariant");
const Category_1 = require("../models/Category");
const slug_1 = require("../utils/slug");
const inventory_service_1 = require("../services/inventory.service");
function effectivePrice(p) {
    return p.salePrice && p.salePrice < p.regularPrice ? p.salePrice : p.regularPrice;
}
exports.listProducts = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { category, brand, minPrice, maxPrice, search, sort, page = '1', limit = '20', featured, bestSeller, newArrival, inStock, } = req.query;
    const filter = { status: 'active' };
    if (category) {
        const cat = await Category_1.Category.findOne({ slug: category });
        if (cat) {
            const children = await Category_1.Category.find({ parent: cat._id }).select('_id');
            const ids = [cat._id, ...children.map((c) => c._id)];
            filter.$or = [{ category: { $in: ids } }, { subCategory: { $in: ids } }];
        }
        else {
            filter.category = null;
        }
    }
    if (brand) {
        const brandSlugs = brand.split(',');
        const brandDocs = await Category_1.Category.db.model('Brand').find({ slug: { $in: brandSlugs } }).select('_id');
        filter.brand = { $in: brandDocs.map((b) => b._id) };
    }
    if (featured === 'true')
        filter.featured = true;
    if (bestSeller === 'true')
        filter.bestSeller = true;
    if (newArrival === 'true')
        filter.newArrival = true;
    if (inStock === 'true')
        filter.stockQuantity = { $gt: 0 };
    if (minPrice || maxPrice) {
        filter.regularPrice = {};
        if (minPrice)
            filter.regularPrice.$gte = Number(minPrice);
        if (maxPrice)
            filter.regularPrice.$lte = Number(maxPrice);
    }
    if (search) {
        filter.$text = { $search: search };
    }
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    let sortSpec = { createdAt: -1 };
    switch (sort) {
        case 'price_asc':
            sortSpec = { regularPrice: 1 };
            break;
        case 'price_desc':
            sortSpec = { regularPrice: -1 };
            break;
        case 'rating':
            sortSpec = { ratingAverage: -1 };
            break;
        case 'best_selling':
            sortSpec = { soldCount: -1 };
            break;
        case 'newest':
            sortSpec = { createdAt: -1 };
            break;
        case 'popular':
        default:
            sortSpec = { ratingCount: -1, soldCount: -1 };
    }
    const [items, total] = await Promise.all([
        Product_1.Product.find(filter)
            .populate('category', 'name slug')
            .populate('brand', 'name slug')
            .sort(sortSpec)
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum),
        Product_1.Product.countDocuments(filter),
    ]);
    (0, ApiResponse_1.sendSuccess)(res, items, 'Products fetched', 200, (0, ApiResponse_1.buildPagination)(pageNum, limitNum, total));
});
exports.getProductBySlug = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const product = await Product_1.Product.findOne({ slug: req.params.slug, status: 'active' })
        .populate('category', 'name slug')
        .populate('subCategory', 'name slug')
        .populate('brand', 'name slug logo');
    if (!product)
        throw ApiError_1.ApiError.notFound('Product not found');
    const variants = await ProductVariant_1.ProductVariant.find({ product: product._id, status: 'active' });
    const related = await Product_1.Product.find({
        category: product.category,
        _id: { $ne: product._id },
        status: 'active',
    })
        .limit(8)
        .select('name slug images regularPrice salePrice ratingAverage ratingCount');
    (0, ApiResponse_1.sendSuccess)(res, { product, variants, relatedProducts: related });
});
exports.searchAutocomplete = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const q = req.query.q || '';
    if (q.length < 2)
        return (0, ApiResponse_1.sendSuccess)(res, []);
    const products = await Product_1.Product.find({
        status: 'active',
        $text: { $search: q },
    })
        .select('name slug images regularPrice salePrice')
        .limit(8);
    (0, ApiResponse_1.sendSuccess)(res, products);
});
// ---- Admin ----
exports.adminListProducts = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { page = '1', limit = '20', status, search } = req.query;
    const filter = {};
    if (status)
        filter.status = status;
    if (search)
        filter.$or = [
            { name: new RegExp(search, 'i') },
            { sku: new RegExp(search, 'i') },
        ];
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const [items, total] = await Promise.all([
        Product_1.Product.find(filter)
            .populate('category', 'name')
            .populate('brand', 'name')
            .sort({ createdAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum),
        Product_1.Product.countDocuments(filter),
    ]);
    (0, ApiResponse_1.sendSuccess)(res, items, 'Products fetched', 200, (0, ApiResponse_1.buildPagination)(pageNum, limitNum, total));
});
exports.adminGetProduct = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const product = await Product_1.Product.findById(req.params.id).populate('category').populate('brand');
    if (!product)
        throw ApiError_1.ApiError.notFound('Product not found');
    const variants = await ProductVariant_1.ProductVariant.find({ product: product._id });
    (0, ApiResponse_1.sendSuccess)(res, { product, variants });
});
exports.createProduct = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const body = req.body;
    const baseSlug = body.slug ? (0, slug_1.toSlug)(body.slug) : (0, slug_1.toSlug)(body.name);
    const slug = await (0, slug_1.ensureUniqueSlug)(baseSlug, async (s) => !!(await Product_1.Product.findOne({ slug: s })));
    const existingSku = await Product_1.Product.findOne({ sku: body.sku });
    if (existingSku)
        throw ApiError_1.ApiError.conflict('A product with this SKU already exists');
    const product = await Product_1.Product.create({ ...body, slug });
    if (body.stockQuantity && body.stockQuantity > 0) {
        await (0, inventory_service_1.addStock)({
            productId: product.id,
            quantity: body.stockQuantity,
            movementType: 'manual_addition',
            adminId: req.adminId,
            reason: 'Initial stock on product creation',
        });
    }
    (0, ApiResponse_1.sendSuccess)(res, product, 'Product created', 201);
});
exports.updateProduct = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const product = await Product_1.Product.findById(req.params.id);
    if (!product)
        throw ApiError_1.ApiError.notFound('Product not found');
    const body = { ...req.body };
    delete body.stockQuantity; // stock changes must go through inventory endpoints for audit trail
    if (body.name && body.name !== product.name && !body.slug) {
        const baseSlug = (0, slug_1.toSlug)(body.name);
        body.slug = await (0, slug_1.ensureUniqueSlug)(baseSlug, async (s) => !!(await Product_1.Product.findOne({ slug: s, _id: { $ne: product.id } })));
    }
    Object.assign(product, body);
    await product.save();
    (0, ApiResponse_1.sendSuccess)(res, product, 'Product updated');
});
exports.deleteProduct = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const product = await Product_1.Product.findByIdAndUpdate(req.params.id, { status: 'inactive' }, { new: true });
    if (!product)
        throw ApiError_1.ApiError.notFound('Product not found');
    (0, ApiResponse_1.sendSuccess)(res, null, 'Product deactivated');
});
// ---- Variants ----
exports.createVariant = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const product = await Product_1.Product.findById(req.params.productId);
    if (!product)
        throw ApiError_1.ApiError.notFound('Product not found');
    const variant = await ProductVariant_1.ProductVariant.create({ ...req.body, product: product._id });
    if (req.body.stockQuantity && req.body.stockQuantity > 0) {
        await (0, inventory_service_1.addStock)({
            productId: product.id,
            variantId: variant.id,
            quantity: req.body.stockQuantity,
            movementType: 'manual_addition',
            adminId: req.adminId,
            reason: 'Initial stock on variant creation',
        });
    }
    (0, ApiResponse_1.sendSuccess)(res, variant, 'Variant created', 201);
});
exports.updateVariant = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const body = { ...req.body };
    delete body.stockQuantity;
    const variant = await ProductVariant_1.ProductVariant.findByIdAndUpdate(req.params.variantId, body, { new: true });
    if (!variant)
        throw ApiError_1.ApiError.notFound('Variant not found');
    (0, ApiResponse_1.sendSuccess)(res, variant, 'Variant updated');
});
exports.deleteVariant = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const variant = await ProductVariant_1.ProductVariant.findByIdAndUpdate(req.params.variantId, { status: 'inactive' }, { new: true });
    if (!variant)
        throw ApiError_1.ApiError.notFound('Variant not found');
    (0, ApiResponse_1.sendSuccess)(res, null, 'Variant deactivated');
});
//# sourceMappingURL=product.controller.js.map