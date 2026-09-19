"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Banner = void 0;
const mongoose_1 = require("mongoose");
const bannerSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    subtitle: String,
    desktopImage: { type: String, required: true },
    mobileImage: { type: String, required: true },
    ctaText: String,
    ctaUrl: String,
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    displayOrder: { type: Number, default: 0 },
}, { timestamps: true });
exports.Banner = (0, mongoose_1.model)('Banner', bannerSchema);
//# sourceMappingURL=Banner.js.map