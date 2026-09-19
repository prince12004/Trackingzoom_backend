"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeFromWishlist = exports.addToWishlist = exports.getWishlist = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const ApiResponse_1 = require("../utils/ApiResponse");
const Wishlist_1 = require("../models/Wishlist");
async function getOrCreate(userId) {
    let wishlist = await Wishlist_1.Wishlist.findOne({ user: userId });
    if (!wishlist)
        wishlist = await Wishlist_1.Wishlist.create({ user: userId, products: [] });
    return wishlist;
}
exports.getWishlist = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const wishlist = await (await getOrCreate(req.userId)).populate('products', 'name slug images regularPrice salePrice ratingAverage ratingCount stockQuantity');
    (0, ApiResponse_1.sendSuccess)(res, wishlist);
});
exports.addToWishlist = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { productId } = req.body;
    const wishlist = await getOrCreate(req.userId);
    if (!wishlist.products.some((p) => String(p) === productId)) {
        wishlist.products.push(productId);
        await wishlist.save();
    }
    (0, ApiResponse_1.sendSuccess)(res, wishlist, 'Added to wishlist');
});
exports.removeFromWishlist = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const wishlist = await getOrCreate(req.userId);
    wishlist.products = wishlist.products.filter((p) => String(p) !== req.params.productId);
    await wishlist.save();
    (0, ApiResponse_1.sendSuccess)(res, wishlist, 'Removed from wishlist');
});
//# sourceMappingURL=wishlist.controller.js.map