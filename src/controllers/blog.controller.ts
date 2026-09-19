import { Request, Response } from 'express';
import { FilterQuery } from 'mongoose';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess, buildPagination } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { Blog, IBlog } from '../models/Blog';
import { toSlug, ensureUniqueSlug } from '../utils/slug';

export const listBlogs = catchAsync(async (req: Request, res: Response) => {
  const { category, search, featured, page = '1', limit = '12' } = req.query as Record<string, string>;

  const filter: FilterQuery<IBlog> = { status: 'published', publishedAt: { $lte: new Date() } };
  if (category) filter.category = category;
  if (featured === 'true') filter.featured = true;
  if (search) filter.$text = { $search: search };

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));

  const [items, total] = await Promise.all([
    Blog.find(filter)
      .populate('category', 'name slug')
      .select('-content')
      .sort({ publishedAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Blog.countDocuments(filter),
  ]);

  sendSuccess(res, items, 'Blogs fetched', 200, buildPagination(pageNum, limitNum, total));
});

export const getBlogBySlug = catchAsync(async (req: Request, res: Response) => {
  const blog = await Blog.findOneAndUpdate(
    { slug: req.params.slug, status: 'published' },
    { $inc: { views: 1 } },
    { new: true }
  )
    .populate('category', 'name slug')
    .populate('relatedProducts', 'name slug images regularPrice salePrice');
  if (!blog) throw ApiError.notFound('Blog not found');

  const related = await Blog.find({ category: blog.category, _id: { $ne: blog._id }, status: 'published' })
    .select('-content')
    .limit(4);

  sendSuccess(res, { blog, related });
});

// ---- Admin ----

export const adminListBlogs = catchAsync(async (req: Request, res: Response) => {
  const { page = '1', limit = '20', status, search } = req.query as Record<string, string>;
  const filter: FilterQuery<IBlog> = {};
  if (status) filter.status = status;
  if (search) filter.title = new RegExp(search, 'i');

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  const [items, total] = await Promise.all([
    Blog.find(filter)
      .populate('category', 'name')
      .select('-content')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Blog.countDocuments(filter),
  ]);

  sendSuccess(res, items, 'Blogs fetched', 200, buildPagination(pageNum, limitNum, total));
});

export const adminGetBlog = catchAsync(async (req: Request, res: Response) => {
  const blog = await Blog.findById(req.params.id).populate('category');
  if (!blog) throw ApiError.notFound('Blog not found');
  sendSuccess(res, blog);
});

export const createBlog = catchAsync(async (req: Request, res: Response) => {
  const body = req.body;
  const baseSlug = body.slug ? toSlug(body.slug) : toSlug(body.title);
  const slug = await ensureUniqueSlug(baseSlug, async (s) => !!(await Blog.findOne({ slug: s })));

  if (body.status === 'published' && !body.publishedAt) {
    body.publishedAt = new Date();
  }

  const wordCount = (body.content || '').split(/\s+/).length;
  body.readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  const blog = await Blog.create({ ...body, slug });
  sendSuccess(res, blog, 'Blog created', 201);
});

export const updateBlog = catchAsync(async (req: Request, res: Response) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) throw ApiError.notFound('Blog not found');

  const body = { ...req.body };
  if (body.title && body.title !== blog.title && !body.slug) {
    const baseSlug = toSlug(body.title);
    body.slug = await ensureUniqueSlug(baseSlug, async (s) => !!(await Blog.findOne({ slug: s, _id: { $ne: blog.id } })));
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
  sendSuccess(res, blog, 'Blog updated');
});

export const deleteBlog = catchAsync(async (req: Request, res: Response) => {
  const blog = await Blog.findByIdAndDelete(req.params.id);
  if (!blog) throw ApiError.notFound('Blog not found');
  sendSuccess(res, null, 'Blog deleted');
});
