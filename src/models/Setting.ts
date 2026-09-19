import { Schema, model, Document } from 'mongoose';

export interface ISetting extends Document {
  general: {
    companyName: string;
    logo?: string;
    favicon?: string;
    contactNumber?: string;
    email?: string;
    address?: string;
    businessHours?: string;
  };
  business: {
    gstNumber?: string;
    currency: string;
    invoicePrefix: string;
    invoiceFinancialYearReset: boolean;
  };
  payment: {
    codEnabled: boolean;
    codMinOrderAmount: number;
    codMaxOrderAmount: number;
    codCharge: number;
    onlinePaymentEnabled: boolean;
    qrPaymentEnabled: boolean;
    qrCodeImage?: string;
    upiId?: string;
  };
  shipping: {
    freeShippingThreshold: number;
    defaultShippingCharge: number;
    estimatedDeliveryDaysMin: number;
    estimatedDeliveryDaysMax: number;
    nonServiceablePincodes: string[];
    nonCodPincodes: string[];
  };
  seo: {
    globalTitle?: string;
    globalDescription?: string;
    ogImage?: string;
  };
  social: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
    linkedin?: string;
    whatsapp?: string;
  };
  apps: {
    androidUrl?: string;
    iosUrl?: string;
  };
  analytics: {
    ga4MeasurementId?: string;
    metaPixelId?: string;
    googleAdsConversionId?: string;
  };
  security: {
    adminTwoFactorRequired: boolean;
    adminIpWhitelistEnabled: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const settingSchema = new Schema<ISetting>(
  {
    general: {
      companyName: { type: String, default: 'TrackingZoom GPS' },
      logo: String,
      favicon: String,
      contactNumber: String,
      email: String,
      address: String,
      businessHours: String,
    },
    business: {
      gstNumber: String,
      currency: { type: String, default: 'INR' },
      invoicePrefix: { type: String, default: 'TZ' },
      invoiceFinancialYearReset: { type: Boolean, default: true },
    },
    payment: {
      codEnabled: { type: Boolean, default: true },
      codMinOrderAmount: { type: Number, default: 0 },
      codMaxOrderAmount: { type: Number, default: 50000 },
      codCharge: { type: Number, default: 0 },
      onlinePaymentEnabled: { type: Boolean, default: true },
      qrPaymentEnabled: { type: Boolean, default: true },
      qrCodeImage: String,
      upiId: String,
    },
    shipping: {
      freeShippingThreshold: { type: Number, default: 999 },
      defaultShippingCharge: { type: Number, default: 79 },
      estimatedDeliveryDaysMin: { type: Number, default: 3 },
      estimatedDeliveryDaysMax: { type: Number, default: 7 },
      nonServiceablePincodes: [{ type: String }],
      nonCodPincodes: [{ type: String }],
    },
    seo: {
      globalTitle: String,
      globalDescription: String,
      ogImage: String,
    },
    social: {
      facebook: String,
      instagram: String,
      youtube: String,
      linkedin: String,
      whatsapp: String,
    },
    apps: {
      androidUrl: String,
      iosUrl: String,
    },
    analytics: {
      ga4MeasurementId: String,
      metaPixelId: String,
      googleAdsConversionId: String,
    },
    security: {
      adminTwoFactorRequired: { type: Boolean, default: true },
      adminIpWhitelistEnabled: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

export const Setting = model<ISetting>('Setting', settingSchema);

export async function getSettings() {
  let settings = await Setting.findOne();
  if (!settings) {
    settings = await Setting.create({});
  }
  return settings;
}
