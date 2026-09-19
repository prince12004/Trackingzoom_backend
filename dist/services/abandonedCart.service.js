"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.captureAbandonedCarts = captureAbandonedCarts;
exports.sendAbandonedCartReminders = sendAbandonedCartReminders;
exports.markCartRecovered = markCartRecovered;
const Cart_1 = require("../models/Cart");
const AbandonedCart_1 = require("../models/AbandonedCart");
const User_1 = require("../models/User");
const cart_service_1 = require("./cart.service");
const sms_service_1 = require("./sms.service");
const email_service_1 = require("./email.service");
const ABANDON_AFTER_MINUTES = 60;
const REMINDER_STAGES = [
    { afterMinutes: 60, channel: 'sms' },
    { afterMinutes: 24 * 60, channel: 'email' },
];
async function captureAbandonedCarts() {
    const cutoff = new Date(Date.now() - ABANDON_AFTER_MINUTES * 60 * 1000);
    const staleCarts = await Cart_1.Cart.find({
        user: { $ne: null },
        updatedAt: { $lte: cutoff },
        'items.0': { $exists: true },
    });
    let captured = 0;
    for (const cart of staleCarts) {
        const alreadyTracked = await AbandonedCart_1.AbandonedCart.exists({ cart: cart._id, recovered: false });
        if (alreadyTracked)
            continue;
        const user = await User_1.User.findById(cart.user);
        const summary = await (0, cart_service_1.priceCart)(cart);
        const activeLines = summary.lines.filter((l) => !l.savedForLater);
        if (activeLines.length === 0)
            continue;
        await AbandonedCart_1.AbandonedCart.create({
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
async function sendAbandonedCartReminders() {
    const pending = await AbandonedCart_1.AbandonedCart.find({ recovered: false, optedOut: false });
    let sent = 0;
    for (const abandoned of pending) {
        const ageMinutes = (Date.now() - abandoned.createdAt.getTime()) / (60 * 1000);
        for (const stage of REMINDER_STAGES) {
            if (ageMinutes < stage.afterMinutes)
                continue;
            const alreadySent = abandoned.remindersSent.some((r) => r.channel === stage.channel);
            if (alreadySent)
                continue;
            if (stage.channel === 'sms' && abandoned.mobile) {
                await (0, sms_service_1.sendSms)({
                    mobile: abandoned.mobile,
                    message: `You left items worth ₹${abandoned.cartTotal} in your TrackingZoom GPS cart. Complete your order now!`,
                });
            }
            else if (stage.channel === 'email' && abandoned.email) {
                await (0, email_service_1.sendEmail)({
                    to: abandoned.email,
                    subject: 'You left something in your cart',
                    html: `<p>Your cart worth ₹${abandoned.cartTotal} is waiting for you. Complete your purchase before it's gone!</p>`,
                });
            }
            else {
                continue;
            }
            abandoned.remindersSent.push({ channel: stage.channel, sentAt: new Date() });
            sent += 1;
        }
        if (abandoned.isModified())
            await abandoned.save();
    }
    return sent;
}
async function markCartRecovered(userId, orderId) {
    const cart = await Cart_1.Cart.findOne({ user: userId });
    if (!cart)
        return;
    await AbandonedCart_1.AbandonedCart.updateMany({ cart: cart._id, recovered: false }, { recovered: true, recoveredOrder: orderId });
}
//# sourceMappingURL=abandonedCart.service.js.map