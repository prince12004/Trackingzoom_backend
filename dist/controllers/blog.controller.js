"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBlog = exports.updateBlog = exports.createBlog = exports.adminGetBlog = exports.adminListBlogs = exports.getBlogBySlug = exports.listBlogs = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const Blog_1 = require("../models/Blog");
const slug_1 = require("../utils/slug");
exports.listBlogs = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { category, search, featured, page = '1', limit = '12' } = req.query;
    const filter = { status: 'published', publishedAt: { $lte: new Date() } };
    if (category)
        filter.category = category;
    if (featured === 'true')
        filter.featured = true;
    if (search)
        filter.$text = { $search: search };
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const [items, total] = await Promise.all([
        Blog_1.Blog.find(filter)
            .populate('category', 'name slug')
            .select('-content')
            .sort({ publishedAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum),
        Blog_1.Blog.countDocuments(filter),
    ]);
    (0, ApiResponse_1.sendSuccess)(res, items, 'Blogs fetched', 200, (0, ApiResponse_1.buildPagination)(pageNum, limitNum, total));
});
exports.getBlogBySlug = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const blog = await Blog_1.Blog.findOneAndUpdate({ slug: req.params.slug, status: 'published' }, { $inc: { views: 1 } }, { new: true })
        .populate('category', 'name slug')
        .populate('relatedProducts', 'name slug images regularPrice salePrice');
    if (!blog)
        throw ApiError_1.ApiError.notFound('Blog not found');
    const related = await Blog_1.Blog.find({ category: blog.category, _id: { $ne: blog._id }, status: 'published' })
        .select('-content')
        .limit(4);
    (0, ApiResponse_1.sendSuccess)(res, { blog, related });
});
// ---- Admin ----
exports.adminListBlogs = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { page = '1', limit = '20', status, search } = req.query;
    const filter = {};
    if (status)
        filter.status = status;
    if (search)
        filter.title = new RegExp(search, 'i');
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const [items, total] = await Promise.all([
        Blog_1.Blog.find(filter)
            .populate('category', 'name')
            .select('-content')
            .sort({ createdAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum),
        Blog_1.Blog.countDocuments(filter),
    ]);
    (0, ApiResponse_1.sendSuccess)(res, items, 'Blogs fetched', 200, (0, ApiResponse_1.buildPagination)(pageNum, limitNum, total));
});
exports.adminGetBlog = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const blog = await Blog_1.Blog.findById(req.params.id).populate('category');
    if (!blog)
        throw ApiError_1.ApiError.notFound('Blog not found');
    (0, ApiResponse_1.sendSuccess)(res, blog);
});
exports.createBlog = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const body = req.body;
    const baseSlug = body.slug ? (0, slug_1.toSlug)(body.slug) : (0, slug_1.toSlug)(body.title);
    const slug = await (0, slug_1.ensureUniqueSlug)(baseSlug, async (s) => !!(await Blog_1.Blog.findOne({ slug: s })));
    if (body.status === 'published' && !body.publishedAt) {
        body.publishedAt = new Date();
    }
    const wordCount = (body.content || '').split(/\s+/).length;
    body.readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));
    const blog = await Blog_1.Blog.create({ ...body, slug });
    (0, ApiResponse_1.sendSuccess)(res, blog, 'Blog created', 201);
});
exports.updateBlog = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const blog = await Blog_1.Blog.findById(req.params.id);
    if (!blog)
        throw ApiError_1.ApiError.notFound('Blog not found');
    const body = { ...req.body };
    if (body.title && body.title !== blog.title && !body.slug) {
        const baseSlug = (0, slug_1.toSlug)(body.title);
        body.slug = await (0, slug_1.ensureUniqueSlug)(baseSlug, async (s) => !!(await Blog_1.Blog.findOne({ slug: s, _id: { $ne: blog.id } })));
    }
    if (body.status === 'published' && blog.status !== 'published' && !body.publishedAt) {
        body.publishedAt = new Date();
    }
    if (body.content) {
        const wordCount = body.content.split(/\s+/).length;
        body.readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));
    }
    Object.assign(blog, body);
    await blog.save();
    (0, ApiResponse_1.sendSuccess)(res, blog, 'Blog updated');
});
exports.deleteBlog = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const blog = await Blog_1.Blog.findByIdAndDelete(req.params.id);
    if (!blog)
        throw ApiError_1.ApiError.notFound('Blog not found');
    (0, ApiResponse_1.sendSuccess)(res, null, 'Blog deleted');
});
//# sourceMappingURL=blog.controller.js.map