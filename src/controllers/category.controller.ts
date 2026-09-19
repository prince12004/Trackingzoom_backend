import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { Category } from '../models/Category';
import { toSlug, ensureUniqueSlug } from '../utils/slug';

export const listCategories = catchAsync(async (req: Request, res: Response) => {
  const { parent, status, tree } = req.query as { parent?: string; status?: string; tree?: string };

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  else filter.status = 'active';

  if (tree === 'true') {
    const categories = await Category.find(filter).sort({ displayOrder: 1 }).lean();
    const byParent = new Map<string, typeof categories>();
    categories.forEach((c) => {
      const key = c.parent ? String(c.parent) : 'root';
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key)!.push(c);
    });
    const buildTree = (parentId: string): unknown[] =>
      (byParent.get(parentId) || []).map((c) => ({ ...c, children: buildTree(String(c._id)) }));
    return sendSuccess(res, buildTree('root'));
  }

  if (parent === 'root') filter.parent = null;
  else if (parent) filter.parent = parent;

  const categories = await Category.find(filter).sort({ displayOrder: 1 });
  sendSuccess(res, categories);
});

export const getCategoryBySlug = catchAsync(async (req: Request, res: Response) => {
  const category = await Category.findOne({ slug: req.params.slug, status: 'active' });
  if (!category) throw ApiError.notFound('Category not found');
  sendSuccess(res, category);
});

export const createCategory = catchAsync(async (req: Request, res: Response) => {
  const body = req.body;
  const baseSlug = body.slug ? toSlug(body.slug) : toSlug(body.name);
  const slug = await ensureUniqueSlug(baseSlug, async (s) => !!(await Category.findOne({ slug: s })));

  const category = await Category.create({ ...body, slug });
  sendSuccess(res, category, 'Category created', 201);
});

export const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw ApiError.notFound('Category not found');

  const body = req.body;
  if (body.name && body.name !== category.name && !body.slug) {
    const baseSlug = toSlug(body.name);
    body.slug = await ensureUniqueSlug(
      baseSlug,
      async (s) => !!(await Category.findOne({ slug: s, _id: { $ne: category.id } }))
    );
  }

  Object.assign(category, body);
  await category.save();
  sendSuccess(res, category, 'Category updated');
});

export const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const hasChildren = await Category.exists({ parent: req.params.id });
  if (hasChildren) throw ApiError.badRequest('Cannot delete a category that has subcategories');

  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw ApiError.notFound('Category not found');
  sendSuccess(res, null, 'Category deleted');
});

export const adminListCategories = catchAsync(async (req: Request, res: Response) => {
  const categories = await Category.find().sort({ displayOrder: 1 });
  sendSuccess(res, categories);
});
