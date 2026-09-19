"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearCompare = exports.removeFromCompare = exports.addToCompare = exports.getCompareList = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const CompareList_1 = require("../models/CompareList");
const Product_1 = require("../models/Product");
const MAX_COMPARE = 4;
async function getOrCreate(userId, guestId) {
    const filter = userId ? { user: userId } : { guestId };
    let list = await CompareList_1.CompareList.findOne(filter);
    if (!list)
        list = await CompareList_1.CompareList.create({ ...filter, products: [] });
    return list;
}
exports.getCompareList = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const list = await (await getOrCreate(req.userId, req.guestId)).populate('products', 'name slug images regularPrice salePrice category specifications features warranty ratingAverage ratingCount');
    (0, ApiResponse_1.sendSuccess)(res, list);
});
exports.addToCompare = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { productId } = req.body;
    const product = await Product_1.Product.findById(productId);
    if (!product)
        throw ApiError_1.ApiError.notFound('Product not found');
    if (!product.comparable)
        throw ApiError_1.ApiError.badRequest('This product is not available for comparison');
    const list = await getOrCreate(req.userId, req.guestId);
    if (list.products.length > 0) {
        const firstProduct = await Product_1.Product.findById(list.products[0]);
        if (firstProduct && String(firstProduct.category) !== String(product.category)) {
            throw ApiError_1.ApiError.badRequest('You can only compare products from the same category');
        }
    }
    if (list.products.some((p) => String(p) === productId)) {
        return (0, ApiResponse_1.sendSuccess)(res, list, 'Product already in compare list');
    }
    if (list.products.length >= MAX_COMPARE) {
        throw ApiError_1.ApiError.badRequest(`You can compare up to ${MAX_COMPARE} products at a time`);
    }
    list.products.push(productId);
    await list.save();
    (0, ApiResponse_1.sendSuccess)(res, list, 'Added to compare');
});
exports.removeFromCompare = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const list = await getOrCreate(req.userId, req.guestId);
    list.products = list.products.filter((p) => String(p) !== req.params.productId);
    await list.save();
    (0, ApiResponse_1.sendSuccess)(res, list, 'Removed from compare');
});
exports.clearCompare = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const list = await getOrCreate(req.userId, req.guestId);
    list.products = [];
    await list.save();
    (0, ApiResponse_1.sendSuccess)(res, list, 'Compare list cleared');
});
//# sourceMappingURL=compare.controller.js.map