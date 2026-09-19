import { Cart } from '../models/Cart';
import { AbandonedCart } from '../models/AbandonedCart';
import { User } from '../models/User';
import { priceCart } from './cart.service';
import { sendSms } from './sms.service';
import { sendEmail } from './email.service';

const ABANDON_AFTER_MINUTES = 60;
const REMINDER_STAGES = [
  { afterMinutes: 60, channel: 'sms' as const },
  { afterMinutes: 24 * 60, channel: 'email' as const },
];

export async function captureAbandonedCarts(): Promise<number> {
  const cutoff = new Date(Date.now() - ABANDON_AFTER_MINUTES * 60 * 1000);

  const staleCarts = await Cart.find({
    user: { $ne: null },
    updatedAt: { $lte: cutoff },
    'items.0': { $exists: true },
  });

  let captured = 0;
  for (const cart of staleCarts) {
    const alreadyTracked = await AbandonedCart.exists({ cart: cart._id, recovered: false });
    if (alreadyTracked) continue;

    const user = await User.findById(cart.user);
    const summary = await priceCart(cart);
    const activeLines = summary.lines.filter((l) => !l.savedForLater);
    if (activeLines.length === 0) continue;

    await AbandonedCart.create({
      cart: cart._id,
      user: cart.user,
      mobile: user?.mobile,
      email: user?.email,
      items: activeLines.map((l) => ({
        product: l.product,
        variant: l.variant,
        quantity: l.quantity,
        priceSnapshot: l.unitPrice,
      })),
      cartTotal: summary.totalAmount,
      remindersSent: [],
      recovered: false,
      optedOut: user ? !user.marketingOptIn : false,
    });
    captured += 1;
  }
  return captured;
}

export async function sendAbandonedCartReminders(): Promise<number> {
  const pending = await AbandonedCart.find({ recovered: false, optedOut: false });
  let sent = 0;

  for (const abandoned of pending) {
    const ageMinutes = (Date.now() - abandoned.createdAt.getTime()) / (60 * 1000);

    for (const stage of REMINDER_STAGES) {
      if (ageMinutes < stage.afterMinutes) continue;
      const alreadySent = abandoned.remindersSent.some((r) => r.channel === stage.channel);
      if (alreadySent) continue;

      if (stage.channel === 'sms' && abandoned.mobile) {
        await sendSms({
          mobile: abandoned.mobile,
          message: `You left items worth ₹${abandoned.cartTotal} in your TrackingZoom GPS cart. Complete your order now!`,
        });
      } else if (stage.channel === 'email' && abandoned.email) {
        await sendEmail({
          to: abandoned.email,
          subject: 'You left something in your cart',
          html: `<p>Your cart worth ₹${abandoned.cartTotal} is waiting for you. Complete your purchase before it's gone!</p>`,
        });
      } else {
        continue;
      }

      abandoned.remindersSent.push({ channel: stage.channel, sentAt: new Date() });
      sent += 1;
    }

    if (abandoned.isModified()) await abandoned.save();
  }

  return sent;
}

export async function markCartRecovered(userId: string, orderId: string): Promise<void> {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) return;
  await AbandonedCart.updateMany(
    { cart: cart._id, recovered: false },
    { recovered: true, recoveredOrder: orderId }
  );
}
