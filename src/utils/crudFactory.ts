import { Request, Response } from 'express';
import { Model } from 'mongoose';
import { catchAsync } from './catchAsync';
import { sendSuccess, buildPagination } from './ApiResponse';
import { ApiError } from './ApiError';

interface CrudOptions {
  entityName: string;
  defaultSort?: Record<string, 1 | -1>;
  searchFields?: string[];
}

export function createCrudController<T>(model: Model<T>, opts: CrudOptions) {
  const list = catchAsync(async (req: Request, res: Response) => {
    const { page = '1', limit = '50', search, status } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (search && opts.searchFields?.length) {
      filter.$or = opts.searchFields.map((f) => ({ [f]: new RegExp(search, 'i') }));
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));

    const [items, total] = await Promise.all([
      model
        .find(filter)
        .sort(opts.defaultSort || { createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      model.countDocuments(filter),
    ]);

    sendSuccess(res, items, `${opts.entityName} list fetched`, 200, buildPagination(pageNum, limitNum, total));
  });

  const getById = catchAsync(async (req: Request, res: Response) => {
    const doc = await model.findById(req.params.id);
    if (!doc) throw ApiError.notFound(`${opts.entityName} not found`);
    sendSuccess(res, doc);
  });

  const create = catchAsync(async (req: Request, res: Response) => {
    const doc = await model.create(req.body);
    sendSuccess(res, doc, `${opts.entityName} created`, 201);
  });

  const update = catchAsync(async (req: Request, res: Response) => {
    const doc = await model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!doc) throw ApiError.notFound(`${opts.entityName} not found`);
    sendSuccess(res, doc, `${opts.entityName} updated`);
  });

  const remove = catchAsync(async (req: Request, res: Response) => {
    const doc = await model.findByIdAndDelete(req.params.id);
    if (!doc) throw ApiError.notFound(`${opts.entityName} not found`);
    sendSuccess(res, null, `${opts.entityName} deleted`);
  });

  return { list, getById, create, update, remove };
}
