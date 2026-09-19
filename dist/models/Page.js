"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Page = void 0;
const mongoose_1 = require("mongoose");
const pageSchema = new mongoose_1.Schema({
    slug: {
        type: String,
        required: true,
        unique: true,
        enum: [
            'about-us',
            'terms-and-conditions',
            'privacy-policy',
            'cancellation-policy',
            'refund-policy',
            'shipping-policy',
            'warranty-policy',
            'data-protection-policy',
        ],
    },
    title: { type: String, required: true },
    content: { type: String, required: true },
    seoTitle: String,
    metaDescription: String,
}, { timestamps: true });
exports.Page = (0, mongoose_1.model)('Page', pageSchema);
//# sourceMappingURL=Page.js.map