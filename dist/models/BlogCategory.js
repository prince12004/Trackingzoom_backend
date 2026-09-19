"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlogCategory = void 0;
const mongoose_1 = require("mongoose");
const blogCategorySchema = new mongoose_1.Schema({
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true, index: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true });
exports.BlogCategory = (0, mongoose_1.model)('BlogCategory', blogCategorySchema);
//# sourceMappingURL=BlogCategory.js.map