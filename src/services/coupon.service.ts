import { Types } from 'mongoose';
import { Coupon, ICoupon } from '../models/Coupon';
import { Order } from '../models/Order';
import { ApiError } from '../utils/ApiError';

interface CartLine {
  product: Types.ObjectId | string;
  category?: Types.ObjectId | string;
  lineTotal: number;
}

export async function validateAndComputeCoupon(
  code: string,
  userId: string,
  lines: CartLine[],
  subtotal: number
): Promise<{ coupon: ICoupon; discountAmount: number }> {
  const coupon = await Coupon.findOne({ code: code.toUpperCase(), status: 'active' });
  if (!coupon) throw ApiError.badRequest('Invalid coupon code');

  const now = new Date();
  if (now < coupon.startDate || now > coupon.expiryDate) {
    throw ApiError.badRequest('This coupon has expired or is not yet active');
  }

  if (subtotal < coupon.minCartAmount) {
    throw ApiError.badRequest(`Minimum cart amount of ₹${coupon.minCartAmount} required for this coupon`);
  }

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw ApiError.badRequest('This coupon has reached its usage limit');
  }

  if (coupon.perUserLimit) {
    const userUsageCount = await Order.countDocuments({
      user: userId,
      coupon: coupon._id,
      paymentStatus: { $ne: 'failed' },
    });
    if (userUsageCount >= coupon.perUserLimit) {
      throw ApiError.badRequest('You have already used this coupon the maximum number of times');
    }
  }

  if (coupon.firstOrderOnly) {
    const anyOrder = await Order.exists({ user: userId, paymentStatus: { $ne: 'failed' } });
    if (anyOrder) throw ApiError.badRequest('This coupon is valid only on your first order');
  }

  let applicableTotal = subtotal;
  if (coupon.applicableProducts.length > 0 || coupon.applicableCategories.length > 0) {
    const productIds = new Set(coupon.applicableProducts.map(String));
    const categoryIds = new Set(coupon.applicableCategories.map(String));
    applicableTotal = lines
      .filter((l) => productIds.has(String(l.product)) || (l.category && categoryIds.has(String(l.category))))
      .reduce((sum, l) => sum + l.lineTotal, 0);

    if (applicableTotal === 0) {
      throw ApiError.badRequest('This coupon is not applicable to the items in your cart');
    }
  }

  let discountAmount =
    coupon.discountType === 'percentage'
      ? (applicableTotal * coupon.discountValue) / 100
      : coupon.discountValue;

  if (coupon.maxDiscountAmount) {
    discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
  }
  discountAmount = Math.min(discountAmount, subtotal);

  return { coupon, discountAmount: Math.round(discountAmount * 100) / 100 };
}
