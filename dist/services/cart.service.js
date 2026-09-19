"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrCreateCart = getOrCreateCart;
exports.priceCart = priceCart;
exports.mergeGuestCartIntoUserCart = mergeGuestCartIntoUserCart;
const Cart_1 = require("../models/Cart");
const Product_1 = require("../models/Product");
const ProductVariant_1 = require("../models/ProductVariant");
const Setting_1 = require("../models/Setting");
const coupon_service_1 = require("./coupon.service");
const ApiError_1 = require("../utils/ApiError");
async function getOrCreateCart(userId, guestId) {
    if (userId) {
        let cart = await Cart_1.Cart.findOne({ user: userId });
        if (!cart)
            cart = await Cart_1.Cart.create({ user: userId, items: [] });
        return cart;
    }
    if (guestId) {
        let cart = await Cart_1.Cart.findOne({ guestId });
        if (!cart)
            cart = await Cart_1.Cart.create({ guestId, items: [] });
        return cart;
    }
    throw ApiError_1.ApiError.badRequest('Unable to resolve cart context');
}
async function priceCart(cart, paymentMethod = 'online') {
    const settings = await (0, Setting_1.getSettings)();
    const lines = [];
    for (const item of cart.items) {
        const product = await Product_1.Product.findById(item.product);
        if (!product || product.status !== 'active')
            continue;
        let unitPrice = product.salePrice && product.salePrice < product.regularPrice ? product.salePrice : product.regularPrice;
        let availableStock = product.stockQuantity;
        let sku = product.sku;
        let image = product.images.find((i) => i.isThumbnail)?.url || product.images[0]?.url;
        if (item.variant) {
            const variant = await ProductVariant_1.ProductVariant.findById(item.variant);
            if (variant && variant.status === 'active') {
                unitPrice = variant.salePrice && variant.salePrice < variant.price ? variant.salePrice : variant.price;
                availableStock = variant.stockQuantity;
                sku = variant.sku;
                if (variant.images[0])
                    image = variant.images[0];
            }
        }
        const lineSubtotal = unitPrice * item.quantity;
        const lineTax = Math.round(((lineSubtotal * product.gstPercentage) / 100) * 100) / 100;
        lines.push({
            itemId: String(item._id),
            product: String(product._id),
            variant: item.variant ? String(item.variant) : undefined,
            name: product.name,
            slug: product.slug,
            image,
            sku,
            quantity: item.quantity,
            unitPrice,
            regularPrice: product.regularPrice,
            gstPercentage: product.gstPercentage,
            category: String(product.category),
            maxOrderQuantity: product.maxOrderQuantity,
            availableStock,
            requiresInstallation: product.requiresInstallation,
            requiresSubscription: product.requiresSubscription,
            codAvailable: product.codAvailable,
            lineSubtotal,
            lineTax,
            lineTotal: lineSubtotal + lineTax,
            savedForLater: item.savedForLater,
            stockOk: availableStock >= item.quantity,
        });
    }
    const activeLines = lines.filter((l) => !l.savedForLater);
    const subtotal = activeLines.reduce((s, l) => s + l.lineSubtotal, 0);
    const taxAmount = activeLines.reduce((s, l) => s + l.lineTax, 0);
    let discountAmount = 0;
    let couponCode;
    let couponError;
    if (cart.coupon && cart.user) {
        try {
            const couponLines = activeLines.map((l) => ({ product: l.product, category: l.category, lineTotal: l.lineSubtotal }));
            const result = await (0, coupon_service_1.validateAndComputeCoupon)(String(cart.coupon), String(cart.user), couponLines, subtotal);
            discountAmount = result.discountAmount;
            couponCode = result.coupon.code;
        }
        catch (err) {
            couponError = err instanceof Error ? err.message : 'Coupon is no longer valid';
        }
    }
    const shippingCharge = subtotal >= settings.shipping.freeShippingThreshold || activeLines.length === 0
        ? 0
        : settings.shipping.defaultShippingCharge;
    const codCharge = paymentMethod === 'cod' ? settings.payment.codCharge : 0;
    const totalAmount = Math.round((subtotal + taxAmount - discountAmount + shippingCharge + codCharge) * 100) / 100;
    return {
        lines,
        subtotal: Math.round(subtotal * 100) / 100,
        taxAmount: Math.round(taxAmount * 100) / 100,
        discountAmount,
        shippingCharge,
        codCharge,
        totalAmount,
        couponCode,
        couponError,
        itemCount: activeLines.reduce((s, l) => s + l.quantity, 0),
    };
}
async function mergeGuestCartIntoUserCart(guestId, userId) {
    const guestCart = await Cart_1.Cart.findOne({ guestId });
    if (!guestCart || guestCart.items.length === 0)
        return;
    let userCart = await Cart_1.Cart.findOne({ user: userId });
    if (!userCart) {
        userCart = await Cart_1.Cart.create({ user: userId, items: [] });
    }
    for (const guestItem of guestCart.items) {
        const existing = userCart.items.find((i) => String(i.product) === String(guestItem.product) &&
            String(i.variant || '') === String(guestItem.variant || ''));
        if (existing) {
            existing.quantity += guestItem.quantity;
        }
        else {
            userCart.items.push(guestItem);
        }
    }
    await userCart.save();
    await Cart_1.Cart.deleteOne({ _id: guestCart._id });
}
//# sourceMappingURL=cart.service.js.map