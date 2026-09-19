import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { Brand } from '../models/Brand';
import { toSlug, ensureUniqueSlug } from '../utils/slug';

export const listBrands = catchAsync(async (req: Request, res: Response) => {
  const filter = req.query.all === 'true' ? {} : { status: 'active' };
  const brands = await Brand.find(filter).sort({ name: 1 });
  sendSuccess(res, brands);
});

export const createBrand = catchAsync(async (req: Request, res: Response) => {
  const baseSlug = toSlug(req.body.name);
  const slug = await ensureUniqueSlug(baseSlug, async (s) => !!(await Brand.findOne({ slug: s })));
  const brand = await Brand.create({ ...req.body, slug });
  sendSuccess(res, brand, 'Brand created', 201);
});

export const updateBrand = catchAsync(async (req: Request, res: Response) => {
  const brand = await Brand.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!brand) throw ApiError.notFound('Brand not found');
  sendSuccess(res, brand, 'Brand updated');
});

export const deleteBrand = catchAsync(async (req: Request, res: Response) => {
  const brand = await Brand.findByIdAndDelete(req.params.id);
  if (!brand) throw ApiError.notFound('Brand not found');
  sendSuccess(res, null, 'Brand deleted');
});
