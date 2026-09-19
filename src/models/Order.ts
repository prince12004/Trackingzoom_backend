import { Schema, model, Document, Types } from 'mongoose';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'return_requested'
  | 'returned'
  | 'refunded';

export type PaymentStatus =
  | 'pending'
  | 'pending_verification'
  | 'initiated'
  | 'processing'
  | 'success'
  | 'failed'
  | 'refunded'
  | 'partially_refunded';

interface IOrderItem {
  product: Types.ObjectId;
  variant?: Types.ObjectId;
  name: string;
  sku: string;
  image?: string;
  quantity: number;
  price: number;
  regularPrice: number;
  gstPercentage: number;
  taxAmount: number;
  lineTotal: number;
  requiresInstallation: boolean;
  requiresSubscription: boolean;
}

interface IAddressSnapshot {
  name: string;
  mobile: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

interface IStatusHistoryEntry {
  status: OrderStatus;
  note?: string;
  changedBy?: Types.ObjectId;
  changedAt: Date;
}

export interface IOrder extends Document {
  orderNumber: string;
  user: Types.ObjectId;
  items: IOrderItem[];
  shippingAddress: IAddressSnapshot;
  billingAddress: IAddressSnapshot;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingCharge: number;
  codCharge: number;
  totalAmount: number;
  coupon?: Types.ObjectId;
  couponCode?: string;
  paymentMethod: 'online' | 'cod' | 'qr_manual';
  paymentScreenshotUrl?: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  statusHistory: IStatusHistoryEntry[];
  courier?: string;
  trackingNumber?: string;
  shipmentPickupDate?: Date;
  invoiceNumber?: string;
  invoiceUrl?: string;
  ewayBillNumber?: string;
  adminNotes?: string;
  cancelReason?: string;
  taxSnapshotNote: string;
  placedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const addressSnapshotSchema = new Schema<IAddressSnapshot>(
  {
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
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        variant: { type: Schema.Types.ObjectId, ref: 'ProductVariant' },
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
    coupon: { type: Schema.Types.ObjectId, ref: 'Coupon' },
    couponCode: String,
    paymentMethod: { type: String, enum: ['online', 'cod', 'qr_manual'], required: true },
    paymentScreenshotUrl: String,
    paymentStatus: {
      type: String,
      enum: ['pending', 'pending_verification', 'initiated', 'processing', 'success', 'failed', 'refunded', 'partially_refunded'],
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
        changedBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
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
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ user: 1, createdAt: -1 });

export const Order = model<IOrder>('Order', orderSchema);
