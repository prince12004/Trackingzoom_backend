"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpertReview = void 0;
const mongoose_1 = require("mongoose");
const expertReviewSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    designation: String,
    profileImage: String,
    videoThumbnail: String,
    videoUrl: String,
    product: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Product' },
    language: { type: String, default: 'English' },
    description: { type: String, required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    displayOrder: { type: Number, default: 0 },
}, { timestamps: true });
exports.ExpertReview = (0, mongoose_1.model)('ExpertReview', expertReviewSchema);
//# sourceMappingURL=ExpertReview.js.map