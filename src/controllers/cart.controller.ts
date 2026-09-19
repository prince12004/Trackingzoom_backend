import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { Product } from '../models/Product';
import { ProductVariant } from '../models/ProductVariant';
import { Coupon } from '../models/Coupon';
import { getOrCreateCart, priceCart } from '../services/cart.service';

async function respondWithCart(req: Request, res: Response, message = 'Cart fetched') {
  const cart = await getOrCreateCart(req.userId, req.guestId);
  const summary = await priceCart(cart);
  sendSuccess(res, summary, message);
}

export const getCart = catchAsync(async (req: Request, res: Response) => {
  await respondWithCart(req, res);
});

export const addItem = catchAsync(async (req: Request, res: Response) => {
  const { productId, variantId, quantity = 1 } = req.body as {
    productId: string;
    variantId?: string;
    quantity?: number;
  };

  const product = await Product.findById(productId);
  if (!product || product.status !== 'active') throw ApiError.notFound('Product not found');

  let stock = product.stockQuantity;
  if (variantId) {
    const variant = await ProductVariant.findOne({ _id: variantId, product: productId });
    if (!variant) throw ApiError.notFound('Product variant not found');
    stock = variant.stockQuantity;
  }
  if (stock < 1) throw ApiError.badRequest('This product is out of stock');
  if (quantity > product.maxOrderQuantity) {
    throw ApiError.badRequest(`Maximum ${product.maxOrderQuantity} units allowed per order`);
  }

  const cart = await getOrCreateCart(req.userId, req.guestId);
  const existing = cart.items.find(
    (i) => String(i.product) === productId && String(i.variant || '') === String(variantId || '')
  );

  const unitPrice = product.salePrice && product.salePrice < product.regularPrice ? product.salePrice : product.regularPrice;

  if (existing) {
    const newQty = existing.quantity + quantity;
    if (newQty > stock) throw ApiError.badRequest(`Only ${stock} units available in stock`);
    if (newQty > product.maxOrderQuantity) {
      throw ApiError.badRequest(`Maximum ${product.maxOrderQuantity} units allowed per order`);
    }
    existing.quantity = newQty;
    existing.savedForLater = false;
  } else {
    if (quantity > stock) throw ApiError.badRequest(`Only ${stock} units available in stock`);
    cart.items.push({
      product: product._id,
      variant: variantId ? (variantId as unknown as typeof product._id) : undefined,
      quantity,
      priceSnapshot: unitPrice,
      savedForLater: false,
    } as never);
  }

  await cart.save();
  await respondWithCart(req, res, 'Item added to cart');
});

export const updateItemQuantity = catchAsync(async (req: Request, res: Response) => {
  const { itemId } = req.params;
  const { quantity } = req.body as { quantity: number };

  const cart = await getOrCreateCart(req.userId, req.guestId);
  const item = cart.items.id(itemId);
  if (!item) throw ApiError.notFound('Cart item not found');

  if (quantity <= 0) {
    item.deleteOne();
  } else {
    const product = await Product.findById(item.product);
    if (!product) throw ApiError.notFound('Product not found');
    let stock = product.stockQuantity;
    if (item.variant) {
      const variant = await ProductVariant.findById(item.variant);
      stock = variant?.stockQuantity ?? 0;
    }
    if (quantity > stock) throw ApiError.badRequest(`Only ${stock} units available in stock`);
    if (quantity > product.maxOrderQuantity) {
      throw ApiError.badRequest(`Maximum ${product.maxOrderQuantity} units allowed per order`);
    }
    item.quantity = quantity;
  }

  await cart.save();
  await respondWithCart(req, res, 'Cart updated');
});

export const removeItem = catchAsync(async (req: Request, res: Response) => {
  const cart = await getOrCreateCart(req.userId, req.guestId);
  const item = cart.items.id(req.params.itemId);
  if (!item) throw ApiError.notFound('Cart item not found');
  item.deleteOne();
  await cart.save();
  await respondWithCart(req, res, 'Item removed from cart');
});

export const toggleSaveForLater = catchAsync(async (req: Request, res: Response) => {
  const cart = await getOrCreateCart(req.userId, req.guestId);
  const item = cart.items.id(req.params.itemId);
  if (!item) throw ApiError.notFound('Cart item not found');
  item.savedForLater = !item.savedForLater;
  await cart.save();
  await respondWithCart(req, res, 'Cart updated');
});

export const applyCoupon = catchAsync(async (req: Request, res: Response) => {
  if (!req.userId) throw ApiError.unauthorized('Please log in to apply a coupon');
  const { code } = req.body as { code: string };

  const coupon = await Coupon.findOne({ code: code.toUpperCase(), status: 'active' });
  if (!coupon) throw ApiError.badRequest('Invalid coupon code');

  const cart = await getOrCreateCart(req.userId, req.guestId);
  cart.coupon = coupon._id as never;
  await cart.save();

  const summary = await priceCart(cart);
  if (summary.couponError) throw ApiError.badRequest(summary.couponError);

  sendSuccess(res, summary, 'Coupon applied');
});

export const removeCoupon = catchAsync(async (req: Request, res: Response) => {
  const cart = await getOrCreateCart(req.userId, req.guestId);
  cart.coupon = undefined;
  await cart.save();
  await respondWithCart(req, res, 'Coupon removed');
});

export const clearCart = catchAsync(async (req: Request, res: Response) => {
  const cart = await getOrCreateCart(req.userId, req.guestId);
  cart.items = [] as never;
  cart.coupon = undefined;
  await cart.save();
  await respondWithCart(req, res, 'Cart cleared');
});
