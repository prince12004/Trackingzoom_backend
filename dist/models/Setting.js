"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Setting = void 0;
exports.getSettings = getSettings;
const mongoose_1 = require("mongoose");
const settingSchema = new mongoose_1.Schema({
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
}, { timestamps: true });
exports.Setting = (0, mongoose_1.model)('Setting', settingSchema);
async function getSettings() {
    let settings = await exports.Setting.findOne();
    if (!settings) {
        settings = await exports.Setting.create({});
    }
    return settings;
}
//# sourceMappingURL=Setting.js.map