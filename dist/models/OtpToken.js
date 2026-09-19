"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpToken = void 0;
const mongoose_1 = require("mongoose");
const otpTokenSchema = new mongoose_1.Schema({
    mobile: { type: String, required: true, index: true },
    purpose: {
        type: String,
        enum: ['register', 'login', 'cod_verification', 'password_reset'],
        required: true,
    },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    consumed: { type: Boolean, default: false },
    lastSentAt: { type: Date, default: Date.now },
}, { timestamps: { createdAt: true, updatedAt: false } });
otpTokenSchema.index({ mobile: 1, purpose: 1, createdAt: -1 });
otpTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
exports.OtpToken = (0, mongoose_1.model)('OtpToken', otpTokenSchema);
//# sourceMappingURL=OtpToken.js.map