"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminListCategories = exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getCategoryBySlug = exports.listCategories = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const Category_1 = require("../models/Category");
const slug_1 = require("../utils/slug");
exports.listCategories = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { parent, status, tree } = req.query;
    const filter = {};
    if (status)
        filter.status = status;
    else
        filter.status = 'active';
    if (tree === 'true') {
        const categories = await Category_1.Category.find(filter).sort({ displayOrder: 1 }).lean();
        const byParent = new Map();
        categories.forEach((c) => {
            const key = c.parent ? String(c.parent) : 'root';
            if (!byParent.has(key))
                byParent.set(key, []);
            byParent.get(key).push(c);
        });
        const buildTree = (parentId) => (byParent.get(parentId) || []).map((c) => ({ ...c, children: buildTree(String(c._id)) }));
        return (0, ApiResponse_1.sendSuccess)(res, buildTree('root'));
    }
    if (parent === 'root')
        filter.parent = null;
    else if (parent)
        filter.parent = parent;
    const categories = await Category_1.Category.find(filter).sort({ displayOrder: 1 });
    (0, ApiResponse_1.sendSuccess)(res, categories);
});
exports.getCategoryBySlug = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const category = await Category_1.Category.findOne({ slug: req.params.slug, status: 'active' });
    if (!category)
        throw ApiError_1.ApiError.notFound('Category not found');
    (0, ApiResponse_1.sendSuccess)(res, category);
});
exports.createCategory = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const body = req.body;
    const baseSlug = body.slug ? (0, slug_1.toSlug)(body.slug) : (0, slug_1.toSlug)(body.name);
    const slug = await (0, slug_1.ensureUniqueSlug)(baseSlug, async (s) => !!(await Category_1.Category.findOne({ slug: s })));
    const category = await Category_1.Category.create({ ...body, slug });
    (0, ApiResponse_1.sendSuccess)(res, category, 'Category created', 201);
});
exports.updateCategory = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const category = await Category_1.Category.findById(req.params.id);
    if (!category)
        throw ApiError_1.ApiError.notFound('Category not found');
    const body = req.body;
    if (body.name && body.name !== category.name && !body.slug) {
        const baseSlug = (0, slug_1.toSlug)(body.name);
        body.slug = await (0, slug_1.ensureUniqueSlug)(baseSlug, async (s) => !!(await Category_1.Category.findOne({ slug: s, _id: { $ne: category.id } })));
    }
    Object.assign(category, body);
    await category.save();
    (0, ApiResponse_1.sendSuccess)(res, category, 'Category updated');
});
exports.deleteCategory = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const hasChildren = await Category_1.Category.exists({ parent: req.params.id });
    if (hasChildren)
        throw ApiError_1.ApiError.badRequest('Cannot delete a category that has subcategories');
    const category = await Category_1.Category.findByIdAndDelete(req.params.id);
    if (!category)
        throw ApiError_1.ApiError.notFound('Category not found');
    (0, ApiResponse_1.sendSuccess)(res, null, 'Category deleted');
});
exports.adminListCategories = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const categories = await Category_1.Category.find().sort({ displayOrder: 1 });
    (0, ApiResponse_1.sendSuccess)(res, categories);
});
//# sourceMappingURL=category.controller.js.map