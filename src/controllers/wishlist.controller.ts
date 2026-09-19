import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess } from '../utils/ApiResponse';
import { Wishlist } from '../models/Wishlist';

async function getOrCreate(userId: string) {
  let wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) wishlist = await Wishlist.create({ user: userId, products: [] });
  return wishlist;
}

export const getWishlist = catchAsync(async (req: Request, res: Response) => {
  const wishlist = await (await getOrCreate(req.userId!)).populate(
    'products',
    'name slug images regularPrice salePrice ratingAverage ratingCount stockQuantity'
  );
  sendSuccess(res, wishlist);
});

export const addToWishlist = catchAsync(async (req: Request, res: Response) => {
  const { productId } = req.body as { productId: string };
  const wishlist = await getOrCreate(req.userId!);
  if (!wishlist.products.some((p) => String(p) === productId)) {
    wishlist.products.push(productId as never);
    await wishlist.save();
  }
  sendSuccess(res, wishlist, 'Added to wishlist');
});

export const removeFromWishlist = catchAsync(async (req: Request, res: Response) => {
  const wishlist = await getOrCreate(req.userId!);
  wishlist.products = wishlist.products.filter((p) => String(p) !== req.params.productId) as never;
  await wishlist.save();
  sendSuccess(res, wishlist, 'Removed from wishlist');
});
