"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Order = void 0;
const mongoose_1 = require("mongoose");
const addressSnapshotSchema = new mongoose_1.Schema({
    name: String,
    mobile: String,
    email: String,
    addressLine1: String,
    addressLine2: String,
    landmark: String,
    city: String,
    state: String,
    pincode: String,
    country: String,
}, { _id: false });
const orderSchema = new mongoose_1.Schema({
    orderNumber: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: [
        {
            product: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Product', required: true },
            variant: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ProductVariant' },
            name: String,
            sku: String,
            image: String,
            quantity: { type: Number, required: true, min: 1 },
            price: { type: Number, required: true },
            regularPrice: Number,
            gstPercentage: Number,
            taxAmount: Number,
            lineTotal: Number,
            requiresInstallation: { type: Boolean, default: false },
            requiresSubscription: { type: Boolean, default: false },
            _id: false,
        },
    ],
    shippingAddress: { type: addressSnapshotSchema, required: true },
    billingAddress: { type: addressSnapshotSchema, required: true },
    subtotal: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    shippingCharge: { type: Number, default: 0 },
    codCharge: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    coupon: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Coupon' },
    couponCode: String,
    paymentMethod: { type: String, enum: ['online', 'cod'], required: true },
    paymentStatus: {
        type: String,
        enum: ['pending', 'initiated', 'processing', 'success', 'failed', 'refunded', 'partially_refunded'],
        default: 'pending',
        index: true,
    },
    orderStatus: {
        type: String,
        enum: [
            'pending',
            'confirmed',
            'processing',
            'packed',
            'shipped',
            'out_for_delivery',
            'delivered',
            'cancelled',
            'return_requested',
            'returned',
            'refunded',
        ],
        default: 'pending',
        index: true,
    },
    statusHistory: [
        {
            status: String,
            note: String,
            changedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Admin' },
            changedAt: { type: Date, default: Date.now },
            _id: false,
        },
    ],
    courier: String,
    trackingNumber: String,
    shipmentPickupDate: Date,
    invoiceNumber: String,
    invoiceUrl: String,
    ewayBillNumber: String,
    adminNotes: String,
    cancelReason: String,
    taxSnapshotNote: { type: String, default: 'Tax calculated at time of order; historical orders are not affected by later tax changes.' },
    placedAt: { type: Date, default: Date.now },
}, { timestamps: true });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ user: 1, createdAt: -1 });
exports.Order = (0, mongoose_1.model)('Order', orderSchema);
//# sourceMappingURL=Order.js.map