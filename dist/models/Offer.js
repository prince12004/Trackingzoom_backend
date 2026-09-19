"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Offer = void 0;
const mongoose_1 = require("mongoose");
const offerSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    type: {
        type: String,
        enum: ['percentage', 'flat', 'buy_x_get_y', 'product_specific', 'category', 'festival', 'limited_time'],
        required: true,
    },
    discountValue: Number,
    buyQuantity: Number,
    getQuantity: Number,
    applicableProducts: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Product' }],
    applicableCategories: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Category' }],
    bannerImage: String,
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    displayOrder: { type: Number, default: 0 },
}, { timestamps: true });
exports.Offer = (0, mongoose_1.model)('Offer', offerSchema);
//# sourceMappingURL=Offer.js.map