"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Category = void 0;
const mongoose_1 = require("mongoose");
const categorySchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: String,
    image: String,
    icon: String,
    banner: String,
    seoTitle: String,
    metaDescription: String,
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    displayOrder: { type: Number, default: 0 },
    parent: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Category', default: null },
}, { timestamps: true });
categorySchema.index({ parent: 1, displayOrder: 1 });
exports.Category = (0, mongoose_1.model)('Category', categorySchema);
//# sourceMappingURL=Category.js.map