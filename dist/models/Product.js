"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Product = void 0;
const mongoose_1 = require("mongoose");
const productSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    sku: { type: String, required: true, unique: true, index: true },
    productCode: String,
    category: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    subCategory: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Category' },
    brand: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Brand' },
    shortDescription: String,
    description: String,
    specifications: [{ key: String, value: String, _id: false }],
    features: [String],
    highlights: [String],
    images: [
        {
            url: { type: String, required: true },
            altText: String,
            isThumbnail: { type: Boolean, default: false },
            displayOrder: { type: Number, default: 0 },
            _id: false,
        },
    ],
    videoUrl: String,
    regularPrice: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, min: 0 },
    costPrice: { type: Number, min: 0 },
    gstPercentage: { type: Number, default: 18, min: 0, max: 100 },
    hsnCode: String,
    stockQuantity: { type: Number, default: 0, min: 0 },
    minStockLevel: { type: Number, default: 5 },
    maxOrderQuantity: { type: Number, default: 10 },
    weightGrams: Number,
    dimensions: { length: Number, width: Number, height: Number },
    warranty: String,
    deliveryInfo: String,
    codAvailable: { type: Boolean, default: true },
    status: { type: String, enum: ['active', 'inactive', 'draft'], default: 'draft', index: true },
    featured: { type: Boolean, default: false },
    bestSeller: { type: Boolean, default: false },
    newArrival: { type: Boolean, default: false },
    searchKeywords: [String],
    seoTitle: String,
    metaDescription: String,
    requiresSubscription: { type: Boolean, default: false },
    requiresInstallation: { type: Boolean, default: false },
    comparable: { type: Boolean, default: true },
    vehicleCompatibility: [String],
    whatsInTheBox: [String],
    faqs: [{ question: String, answer: String, _id: false }],
    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
}, { timestamps: true });
productSchema.index({ name: 'text', shortDescription: 'text', searchKeywords: 'text' });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ featured: 1, status: 1 });
productSchema.index({ bestSeller: 1, status: 1 });
productSchema.index({ newArrival: 1, status: 1 });
exports.Product = (0, mongoose_1.model)('Product', productSchema);
//# sourceMappingURL=Product.js.map