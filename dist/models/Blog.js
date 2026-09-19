"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Blog = void 0;
const mongoose_1 = require("mongoose");
const blogSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    category: { type: mongoose_1.Schema.Types.ObjectId, ref: 'BlogCategory', required: true },
    author: { type: String, required: true },
    featuredImage: { type: String, required: true },
    excerpt: String,
    content: { type: String, required: true },
    tags: [String],
    relatedProducts: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Product' }],
    status: { type: String, enum: ['draft', 'published', 'scheduled'], default: 'draft', index: true },
    featured: { type: Boolean, default: false },
    publishedAt: Date,
    seoTitle: String,
    metaDescription: String,
    keywords: [String],
    canonicalUrl: String,
    ogImage: String,
    readingTimeMinutes: { type: Number, default: 3 },
    views: { type: Number, default: 0 },
}, { timestamps: true });
blogSchema.index({ title: 'text', excerpt: 'text', tags: 'text' });
exports.Blog = (0, mongoose_1.model)('Blog', blogSchema);
//# sourceMappingURL=Blog.js.map