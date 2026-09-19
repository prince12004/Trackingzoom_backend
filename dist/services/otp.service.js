"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.issueOtp = issueOtp;
exports.verifyOtp = verifyOtp;
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const OtpToken_1 = require("../models/OtpToken");
const sms_service_1 = require("./sms.service");
const env_1 = require("../config/env");
const ApiError_1 = require("../utils/ApiError");
function generateNumericOtp(length = 6) {
    const max = 10 ** length;
    const num = crypto_1.default.randomInt(0, max);
    return num.toString().padStart(length, '0');
}
async function issueOtp(mobile, purpose) {
    const recent = await OtpToken_1.OtpToken.findOne({ mobile, purpose }).sort({ createdAt: -1 });
    if (recent) {
        const secondsSinceLast = (Date.now() - recent.lastSentAt.getTime()) / 1000;
        if (secondsSinceLast < env_1.env.otp.resendCooldownSeconds) {
            throw ApiError_1.ApiError.tooMany(`Please wait ${Math.ceil(env_1.env.otp.resendCooldownSeconds - secondsSinceLast)}s before requesting another OTP.`);
        }
    }
    const code = generateNumericOtp(6);
    const codeHash = await bcryptjs_1.default.hash(code, 10);
    const expiresAt = new Date(Date.now() + env_1.env.otp.expiresMinutes * 60 * 1000);
    await OtpToken_1.OtpToken.create({
        mobile,
        purpose,
        codeHash,
        expiresAt,
        attempts: 0,
        consumed: false,
        lastSentAt: new Date(),
    });
    await (0, sms_service_1.sendSms)({
        mobile,
        otp: code,
        message: `Your TrackingZoom GPS verification code is ${code}. Valid for ${env_1.env.otp.expiresMinutes} minutes. Do not share this code.`,
    });
    // No real SMS provider configured (SMS_PROVIDER=console, local/dev fallback) — the code
    // is already being logged to the server console by sendSms, so returning it here too is
    // no additional exposure, and lets the frontend show/autofill it for easier testing.
    return env_1.env.sms.provider === 'console' ? { devOtp: code } : {};
}
async function verifyOtp(mobile, purpose, code) {
    const token = await OtpToken_1.OtpToken.findOne({ mobile, purpose, consumed: false }).sort({ createdAt: -1 });
    if (!token) {
        throw ApiError_1.ApiError.badRequest('No active OTP found. Please request a new one.');
    }
    if (token.expiresAt.getTime() < Date.now()) {
        throw ApiError_1.ApiError.badRequest('OTP has expired. Please request a new one.');
    }
    if (token.attempts >= env_1.env.otp.maxAttempts) {
        throw ApiError_1.ApiError.tooMany('Maximum verification attempts exceeded. Please request a new OTP.');
    }
    const isValid = await bcryptjs_1.default.compare(code, token.codeHash);
    if (!isValid) {
        token.attempts += 1;
        await token.save();
        throw ApiError_1.ApiError.badRequest('Invalid OTP.');
    }
    token.consumed = true;
    await token.save();
}
//# sourceMappingURL=otp.service.js.map