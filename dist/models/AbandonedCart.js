"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbandonedCart = void 0;
const mongoose_1 = require("mongoose");
const abandonedCartSchema = new mongoose_1.Schema({
    cart: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Cart', required: true, index: true },
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    mobile: String,
    email: String,
    items: [
        {
            product: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Product' },
            variant: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ProductVariant' },
            quantity: Number,
            priceSnapshot: Number,
            _id: false,
        },
    ],
    cartTotal: { type: Number, default: 0 },
    remindersSent: [
        { channel: { type: String, enum: ['email', 'sms', 'whatsapp'] }, sentAt: Date, _id: false },
    ],
    recovered: { type: Boolean, default: false },
    recoveredOrder: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Order' },
    optedOut: { type: Boolean, default: false },
}, { timestamps: true });
exports.AbandonedCart = (0, mongoose_1.model)('AbandonedCart', abandonedCartSchema);
//# sourceMappingURL=AbandonedCart.js.map