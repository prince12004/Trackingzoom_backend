import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { CompareList } from '../models/CompareList';
import { Product } from '../models/Product';

const MAX_COMPARE = 4;
const PRODUCT_FIELDS = 'name slug images regularPrice salePrice category specifications features warranty ratingAverage ratingCount';

async function getOrCreate(userId?: string, guestId?: string) {
  const filter = userId ? { user: userId } : { guestId };
  let list = await CompareList.findOne(filter);
  if (!list) list = await CompareList.create({ ...filter, products: [] });
  return list;
}

export const getCompareList = catchAsync(async (req: Request, res: Response) => {
  const list = await (await getOrCreate(req.userId, req.guestId)).populate('products', PRODUCT_FIELDS);
  sendSuccess(res, list);
});

export const addToCompare = catchAsync(async (req: Request, res: Response) => {
  const { productId } = req.body as { productId: string };
  const product = await Product.findById(productId);
  if (!product) throw ApiError.notFound('Product not found');
  if (!product.comparable) throw ApiError.badRequest('This product is not available for comparison');

  const list = await getOrCreate(req.userId, req.guestId);

  if (list.products.length > 0) {
    const firstProduct = await Product.findById(list.products[0]);
    if (firstProduct && String(firstProduct.category) !== String(product.category)) {
      throw ApiError.badRequest('You can only compare products from the same category');
    }
  }

  if (list.products.some((p) => String(p) === productId)) {
    await list.populate('products', PRODUCT_FIELDS);
    return sendSuccess(res, list, 'Product already in compare list');
  }

  if (list.products.length >= MAX_COMPARE) {
    throw ApiError.badRequest(`You can compare up to ${MAX_COMPARE} products at a time`);
  }

  list.products.push(productId as never);
  await list.save();
  await list.populate('products', PRODUCT_FIELDS);
  sendSuccess(res, list, 'Added to compare');
});

export const removeFromCompare = catchAsync(async (req: Request, res: Response) => {
  const list = await getOrCreate(req.userId, req.guestId);
  list.products = list.products.filter((p) => String(p) !== req.params.productId) as never;
  await list.save();
  await list.populate('products', PRODUCT_FIELDS);
  sendSuccess(res, list, 'Removed from compare');
});

export const clearCompare = catchAsync(async (req: Request, res: Response) => {
  const list = await getOrCreate(req.userId, req.guestId);
  list.products = [] as never;
  await list.save();
  sendSuccess(res, list, 'Compare list cleared');
});
