"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Wishlist = void 0;
const mongoose_1 = require("mongoose");
const wishlistSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    products: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Product' }],
}, { timestamps: true });
exports.Wishlist = (0, mongoose_1.model)('Wishlist', wishlistSchema);
//# sourceMappingURL=Wishlist.js.map