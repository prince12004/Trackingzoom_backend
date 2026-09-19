"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductVariant = void 0;
const mongoose_1 = require("mongoose");
const productVariantSchema = new mongoose_1.Schema({
    product: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    sku: { type: String, required: true, unique: true, index: true },
    attributes: [{ name: String, value: String, _id: false }],
    price: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, min: 0 },
    stockQuantity: { type: Number, default: 0, min: 0 },
    images: [String],
    weightGrams: Number,
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true });
exports.ProductVariant = (0, mongoose_1.model)('ProductVariant', productVariantSchema);
//# sourceMappingURL=ProductVariant.js.map