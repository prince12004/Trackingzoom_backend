import { Types } from 'mongoose';
import { Cart, ICart } from '../models/Cart';
import { Product } from '../models/Product';
import { ProductVariant } from '../models/ProductVariant';
import { getSettings } from '../models/Setting';
import { validateAndComputeCoupon } from './coupon.service';
import { ApiError } from '../utils/ApiError';

export interface PricedLine {
  itemId: string;
  product: string;
  variant?: string;
  name: string;
  slug: string;
  image?: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  regularPrice: number;
  gstPercentage: number;
  category: string;
  maxOrderQuantity: number;
  availableStock: number;
  requiresInstallation: boolean;
  requiresSubscription: boolean;
  codAvailable: boolean;
  lineSubtotal: number;
  lineTax: number;
  lineTotal: number;
  savedForLater: boolean;
  stockOk: boolean;
}

export interface CartSummary {
  lines: PricedLine[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  shippingCharge: number;
  codCharge: number;
  totalAmount: number;
  couponCode?: string;
  couponError?: string;
  itemCount: number;
}

async function upsertCart(filter: Record<string, string>): Promise<ICart> {
  try {
    // Atomic — avoids the separate findOne/create race, but MongoDB upserts on a
    // not-yet-existing document can still collide when truly concurrent (e.g. header
    // + cart drawer both fetching the same brand-new user/guest cart on mount).
    return await Cart.findOneAndUpdate({ ...filter }, { $setOnInsert: { ...filter, items: [] } }, { upsert: true, new: true });
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code: number }).code === 11000) {
      // The other concurrent request won the race and already created it — just fetch it.
      const existing = await Cart.findOne(filter);
      if (existing) return existing;
    }
    throw err;
  }
}

export async function getOrCreateCart(userId?: string, guestId?: string): Promise<ICart> {
  if (userId) return upsertCart({ user: userId });
  if (guestId) return upsertCart({ guestId });
  throw ApiError.badRequest('Unable to resolve cart context');
}

export async function priceCart(cart: ICart, paymentMethod: 'online' | 'cod' | 'qr_manual' = 'online'): Promise<CartSummary> {
  const settings = await getSettings();
  const lines: PricedLine[] = [];

  for (const item of cart.items) {
    const product = await Product.findById(item.product);
    if (!product || product.status !== 'active') continue;

    let unitPrice = product.salePrice && product.salePrice < product.regularPrice ? product.salePrice : product.regularPrice;
    let availableStock = product.stockQuantity;
    let sku = product.sku;
    let image = product.images.find((i) => i.isThumbnail)?.url || product.images[0]?.url;

    if (item.variant) {
      const variant = await ProductVariant.findById(item.variant);
      if (variant && variant.status === 'active') {
        unitPrice = variant.salePrice && variant.salePrice < variant.price ? variant.salePrice : variant.price;
        availableStock = variant.stockQuantity;
        sku = variant.sku;
        if (variant.images[0]) image = variant.images[0];
      }
    }

    const lineSubtotal = unitPrice * item.quantity;
    const lineTax = Math.round(((lineSubtotal * product.gstPercentage) / 100) * 100) / 100;

    lines.push({
      itemId: String(item._id),
      product: String(product._id),
      variant: item.variant ? String(item.variant) : undefined,
      name: product.name,
      slug: product.slug,
      image,
      sku,
      quantity: item.quantity,
      unitPrice,
      regularPrice: product.regularPrice,
      gstPercentage: product.gstPercentage,
      category: String(product.category),
      maxOrderQuantity: product.maxOrderQuantity,
      availableStock,
      requiresInstallation: product.requiresInstallation,
      requiresSubscription: product.requiresSubscription,
      codAvailable: product.codAvailable,
      lineSubtotal,
      lineTax,
      lineTotal: lineSubtotal + lineTax,
      savedForLater: item.savedForLater,
      stockOk: availableStock >= item.quantity,
    });
  }

  const activeLines = lines.filter((l) => !l.savedForLater);
  const subtotal = activeLines.reduce((s, l) => s + l.lineSubtotal, 0);
  const taxAmount = activeLines.reduce((s, l) => s + l.lineTax, 0);

  let discountAmount = 0;
  let couponCode: string | undefined;
  let couponError: string | undefined;

  if (cart.coupon && cart.user) {
    try {
      const couponLines = activeLines.map((l) => ({ product: l.product, category: l.category, lineTotal: l.lineSubtotal }));
      const result = await validateAndComputeCoupon(String(cart.coupon), String(cart.user), couponLines, subtotal);
      discountAmount = result.discountAmount;
      couponCode = result.coupon.code;
    } catch (err) {
      couponError = err instanceof Error ? err.message : 'Coupon is no longer valid';
    }
  }

  const shippingCharge =
    subtotal >= settings.shipping.freeShippingThreshold || activeLines.length === 0
      ? 0
      : settings.shipping.defaultShippingCharge;

  const codCharge = paymentMethod === 'cod' ? settings.payment.codCharge : 0;

  const totalAmount = Math.round((subtotal + taxAmount - discountAmount + shippingCharge + codCharge) * 100) / 100;

  return {
    lines,
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    discountAmount,
    shippingCharge,
    codCharge,
    totalAmount,
    couponCode,
    couponError,
    itemCount: activeLines.reduce((s, l) => s + l.quantity, 0),
  };
}

export async function mergeGuestCartIntoUserCart(guestId: string, userId: string): Promise<void> {
  const guestCart = await Cart.findOne({ guestId });
  if (!guestCart || guestCart.items.length === 0) return;

  const userCart = await upsertCart({ user: userId });

  for (const guestItem of guestCart.items) {
    const existing = userCart.items.find(
      (i) =>
        String(i.product) === String(guestItem.product) &&
        String(i.variant || '') === String(guestItem.variant || '')
    );
    if (existing) {
      existing.quantity += guestItem.quantity;
    } else {
      userCart.items.push(guestItem);
    }
  }

  await userCart.save();
  await Cart.deleteOne({ _id: guestCart._id });
}
