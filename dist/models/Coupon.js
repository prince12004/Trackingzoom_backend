"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Coupon = void 0;
const mongoose_1 = require("mongoose");
const couponSchema = new mongoose_1.Schema({
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    minCartAmount: { type: Number, default: 0 },
    maxDiscountAmount: Number,
    startDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    usageLimit: Number,
    usedCount: { type: Number, default: 0 },
    perUserLimit: Number,
    applicableProducts: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Product' }],
    applicableCategories: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Category' }],
    firstOrderOnly: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true });
exports.Coupon = (0, mongoose_1.model)('Coupon', couponSchema);
//# sourceMappingURL=Coupon.js.map