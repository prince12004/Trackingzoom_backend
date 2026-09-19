"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearCart = exports.removeCoupon = exports.applyCoupon = exports.toggleSaveForLater = exports.removeItem = exports.updateItemQuantity = exports.addItem = exports.getCart = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const Product_1 = require("../models/Product");
const ProductVariant_1 = require("../models/ProductVariant");
const Coupon_1 = require("../models/Coupon");
const cart_service_1 = require("../services/cart.service");
async function respondWithCart(req, res, message = 'Cart fetched') {
    const cart = await (0, cart_service_1.getOrCreateCart)(req.userId, req.guestId);
    const summary = await (0, cart_service_1.priceCart)(cart);
    (0, ApiResponse_1.sendSuccess)(res, summary, message);
}
exports.getCart = (0, catchAsync_1.catchAsync)(async (req, res) => {
    await respondWithCart(req, res);
});
exports.addItem = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { productId, variantId, quantity = 1 } = req.body;
    const product = await Product_1.Product.findById(productId);
    if (!product || product.status !== 'active')
        throw ApiError_1.ApiError.notFound('Product not found');
    let stock = product.stockQuantity;
    if (variantId) {
        const variant = await ProductVariant_1.ProductVariant.findOne({ _id: variantId, product: productId });
        if (!variant)
            throw ApiError_1.ApiError.notFound('Product variant not found');
        stock = variant.stockQuantity;
    }
    if (stock < 1)
        throw ApiError_1.ApiError.badRequest('This product is out of stock');
    if (quantity > product.maxOrderQuantity) {
        throw ApiError_1.ApiError.badRequest(`Maximum ${product.maxOrderQuantity} units allowed per order`);
    }
    const cart = await (0, cart_service_1.getOrCreateCart)(req.userId, req.guestId);
    const existing = cart.items.find((i) => String(i.product) === productId && String(i.variant || '') === String(variantId || ''));
    const unitPrice = product.salePrice && product.salePrice < product.regularPrice ? product.salePrice : product.regularPrice;
    if (existing) {
        const newQty = existing.quantity + quantity;
        if (newQty > stock)
            throw ApiError_1.ApiError.badRequest(`Only ${stock} units available in stock`);
        if (newQty > product.maxOrderQuantity) {
            throw ApiError_1.ApiError.badRequest(`Maximum ${product.maxOrderQuantity} units allowed per order`);
        }
        existing.quantity = newQty;
        existing.savedForLater = false;
    }
    else {
        if (quantity > stock)
            throw ApiError_1.ApiError.badRequest(`Only ${stock} units available in stock`);
        cart.items.push({
            product: product._id,
            variant: variantId ? variantId : undefined,
            quantity,
            priceSnapshot: unitPrice,
            savedForLater: false,
        });
    }
    await cart.save();
    await respondWithCart(req, res, 'Item added to cart');
});
exports.updateItemQuantity = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const cart = await (0, cart_service_1.getOrCreateCart)(req.userId, req.guestId);
    const item = cart.items.id(itemId);
    if (!item)
        throw ApiError_1.ApiError.notFound('Cart item not found');
    if (quantity <= 0) {
        item.deleteOne();
    }
    else {
        const product = await Product_1.Product.findById(item.product);
        if (!product)
            throw ApiError_1.ApiError.notFound('Product not found');
        let stock = product.stockQuantity;
        if (item.variant) {
            const variant = await ProductVariant_1.ProductVariant.findById(item.variant);
            stock = variant?.stockQuantity ?? 0;
        }
        if (quantity > stock)
            throw ApiError_1.ApiError.badRequest(`Only ${stock} units available in stock`);
        if (quantity > product.maxOrderQuantity) {
            throw ApiError_1.ApiError.badRequest(`Maximum ${product.maxOrderQuantity} units allowed per order`);
        }
        item.quantity = quantity;
    }
    await cart.save();
    await respondWithCart(req, res, 'Cart updated');
});
exports.removeItem = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const cart = await (0, cart_service_1.getOrCreateCart)(req.userId, req.guestId);
    const item = cart.items.id(req.params.itemId);
    if (!item)
        throw ApiError_1.ApiError.notFound('Cart item not found');
    item.deleteOne();
    await cart.save();
    await respondWithCart(req, res, 'Item removed from cart');
});
exports.toggleSaveForLater = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const cart = await (0, cart_service_1.getOrCreateCart)(req.userId, req.guestId);
    const item = cart.items.id(req.params.itemId);
    if (!item)
        throw ApiError_1.ApiError.notFound('Cart item not found');
    item.savedForLater = !item.savedForLater;
    await cart.save();
    await respondWithCart(req, res, 'Cart updated');
});
exports.applyCoupon = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.userId)
        throw ApiError_1.ApiError.unauthorized('Please log in to apply a coupon');
    const { code } = req.body;
    const coupon = await Coupon_1.Coupon.findOne({ code: code.toUpperCase(), status: 'active' });
    if (!coupon)
        throw ApiError_1.ApiError.badRequest('Invalid coupon code');
    const cart = await (0, cart_service_1.getOrCreateCart)(req.userId, req.guestId);
    cart.coupon = coupon._id;
    await cart.save();
    const summary = await (0, cart_service_1.priceCart)(cart);
    if (summary.couponError)
        throw ApiError_1.ApiError.badRequest(summary.couponError);
    (0, ApiResponse_1.sendSuccess)(res, summary, 'Coupon applied');
});
exports.removeCoupon = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const cart = await (0, cart_service_1.getOrCreateCart)(req.userId, req.guestId);
    cart.coupon = undefined;
    await cart.save();
    await respondWithCart(req, res, 'Coupon removed');
});
exports.clearCart = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const cart = await (0, cart_service_1.getOrCreateCart)(req.userId, req.guestId);
    cart.items = [];
    cart.coupon = undefined;
    await cart.save();
    await respondWithCart(req, res, 'Cart cleared');
});
//# sourceMappingURL=cart.controller.js.map