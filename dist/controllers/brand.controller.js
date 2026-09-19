"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBrand = exports.updateBrand = exports.createBrand = exports.listBrands = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const Brand_1 = require("../models/Brand");
const slug_1 = require("../utils/slug");
exports.listBrands = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const filter = req.query.all === 'true' ? {} : { status: 'active' };
    const brands = await Brand_1.Brand.find(filter).sort({ name: 1 });
    (0, ApiResponse_1.sendSuccess)(res, brands);
});
exports.createBrand = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const baseSlug = (0, slug_1.toSlug)(req.body.name);
    const slug = await (0, slug_1.ensureUniqueSlug)(baseSlug, async (s) => !!(await Brand_1.Brand.findOne({ slug: s })));
    const brand = await Brand_1.Brand.create({ ...req.body, slug });
    (0, ApiResponse_1.sendSuccess)(res, brand, 'Brand created', 201);
});
exports.updateBrand = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const brand = await Brand_1.Brand.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!brand)
        throw ApiError_1.ApiError.notFound('Brand not found');
    (0, ApiResponse_1.sendSuccess)(res, brand, 'Brand updated');
});
exports.deleteBrand = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const brand = await Brand_1.Brand.findByIdAndDelete(req.params.id);
    if (!brand)
        throw ApiError_1.ApiError.notFound('Brand not found');
    (0, ApiResponse_1.sendSuccess)(res, null, 'Brand deleted');
});
//# sourceMappingURL=brand.controller.js.map