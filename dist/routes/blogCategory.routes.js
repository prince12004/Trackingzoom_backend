"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
const catchAsync_1 = require("../utils/catchAsync");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const BlogCategory_1 = require("../models/BlogCategory");
const slug_1 = require("../utils/slug");
const router = (0, express_1.Router)();
router.get('/', (0, catchAsync_1.catchAsync)(async (_req, res) => {
    const items = await BlogCategory_1.BlogCategory.find({ status: 'active' }).sort({ name: 1 });
    (0, ApiResponse_1.sendSuccess)(res, items);
}));
router.post('/', auth_1.requireAdminAuth, (0, auth_1.requirePermission)('blogs.create'), [(0, express_validator_1.body)('name').trim().notEmpty()], validate_1.validate, (0, catchAsync_1.catchAsync)(async (req, res) => {
    const baseSlug = (0, slug_1.toSlug)(req.body.name);
    const slug = await (0, slug_1.ensureUniqueSlug)(baseSlug, async (s) => !!(await BlogCategory_1.BlogCategory.findOne({ slug: s })));
    const category = await BlogCategory_1.BlogCategory.create({ ...req.body, slug });
    (0, ApiResponse_1.sendSuccess)(res, category, 'Blog category created', 201);
}));
router.patch('/:id', auth_1.requireAdminAuth, (0, auth_1.requirePermission)('blogs.edit'), (0, catchAsync_1.catchAsync)(async (req, res) => {
    const category = await BlogCategory_1.BlogCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category)
        throw ApiError_1.ApiError.notFound('Blog category not found');
    (0, ApiResponse_1.sendSuccess)(res, category, 'Blog category updated');
}));
router.delete('/:id', auth_1.requireAdminAuth, (0, auth_1.requirePermission)('blogs.delete'), (0, catchAsync_1.catchAsync)(async (req, res) => {
    const category = await BlogCategory_1.BlogCategory.findByIdAndDelete(req.params.id);
    if (!category)
        throw ApiError_1.ApiError.notFound('Blog category not found');
    (0, ApiResponse_1.sendSuccess)(res, null, 'Blog category deleted');
}));
exports.default = router;
//# sourceMappingURL=blogCategory.routes.js.map