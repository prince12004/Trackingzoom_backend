"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cart = void 0;
const mongoose_1 = require("mongoose");
const cartItemSchema = new mongoose_1.Schema({
    product: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Product', required: true },
    variant: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ProductVariant', default: null },
    quantity: { type: Number, required: true, min: 1 },
    priceSnapshot: { type: Number, required: true },
    savedForLater: { type: Boolean, default: false },
}, { _id: true });
const cartSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', index: true, sparse: true },
    guestId: { type: String, index: true, sparse: true },
    items: [cartItemSchema],
    coupon: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Coupon', default: null },
}, { timestamps: true });
exports.Cart = (0, mongoose_1.model)('Cart', cartSchema);
//# sourceMappingURL=Cart.js.map