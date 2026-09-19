"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.logout = exports.refreshCustomerToken = exports.verifyLogin = exports.verifyRegister = exports.requestOtp = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const User_1 = require("../models/User");
const otp_service_1 = require("../services/otp.service");
const jwt_1 = require("../utils/jwt");
const cookies_1 = require("../utils/cookies");
const referralCode_1 = require("../utils/referralCode");
const Cart_1 = require("../models/Cart");
const uuid_1 = require("uuid");
async function issueSessionForUser(res, userId, tokenVersion) {
    const accessToken = (0, jwt_1.signAccessToken)({ sub: userId, type: 'customer', tokenVersion });
    const refreshToken = (0, jwt_1.signRefreshToken)({ sub: userId, type: 'customer', tokenVersion, jti: (0, uuid_1.v4)() });
    (0, cookies_1.setAuthCookies)(res, accessToken, refreshToken);
    return { accessToken, refreshToken };
}
exports.requestOtp = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { mobile, purpose } = req.body;
    if (purpose === 'register') {
        const existing = await User_1.User.findOne({ mobile });
        if (existing)
            throw ApiError_1.ApiError.conflict('An account already exists for this mobile number. Please log in.');
    }
    else {
        const existing = await User_1.User.findOne({ mobile });
        if (!existing)
            throw ApiError_1.ApiError.notFound('No account found for this mobile number. Please register first.');
    }
    const { devOtp } = await (0, otp_service_1.issueOtp)(mobile, purpose);
    (0, ApiResponse_1.sendSuccess)(res, { mobile, devOtp }, 'OTP sent successfully');
});
exports.verifyRegister = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { mobile, code, name } = req.body;
    const existing = await User_1.User.findOne({ mobile });
    if (existing)
        throw ApiError_1.ApiError.conflict('An account already exists for this mobile number.');
    await (0, otp_service_1.verifyOtp)(mobile, 'register', code);
    const referralCode = (0, referralCode_1.generateReferralCode)(name);
    const user = await User_1.User.create({
        name,
        mobile,
        mobileVerified: true,
        referralCode,
        lastLoginAt: new Date(),
    });
    await Cart_1.Cart.create({ user: user._id, items: [] });
    const { accessToken } = await issueSessionForUser(res, user.id, user.tokenVersion);
    (0, ApiResponse_1.sendSuccess)(res, { user: { id: user.id, name: user.name, mobile: user.mobile, referralCode: user.referralCode }, accessToken }, 'Registration successful', 201);
});
exports.verifyLogin = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { mobile, code } = req.body;
    const user = await User_1.User.findOne({ mobile });
    if (!user)
        throw ApiError_1.ApiError.notFound('No account found for this mobile number.');
    if (user.status === 'blocked')
        throw ApiError_1.ApiError.forbidden('Your account has been blocked. Contact support.');
    await (0, otp_service_1.verifyOtp)(mobile, 'login', code);
    user.mobileVerified = true;
    user.lastLoginAt = new Date();
    await user.save();
    const { accessToken } = await issueSessionForUser(res, user.id, user.tokenVersion);
    (0, ApiResponse_1.sendSuccess)(res, { user: { id: user.id, name: user.name, mobile: user.mobile, referralCode: user.referralCode }, accessToken }, 'Login successful');
});
exports.refreshCustomerToken = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const token = req.cookies?.refreshToken;
    if (!token)
        throw ApiError_1.ApiError.unauthorized('Refresh token missing');
    let payload;
    try {
        payload = (0, jwt_1.verifyRefreshToken)(token);
    }
    catch {
        throw ApiError_1.ApiError.unauthorized('Invalid or expired refresh token');
    }
    if (payload.type !== 'customer')
        throw ApiError_1.ApiError.unauthorized('Invalid token type');
    const user = await User_1.User.findById(payload.sub);
    if (!user || user.tokenVersion !== payload.tokenVersion) {
        throw ApiError_1.ApiError.unauthorized('Session expired, please log in again');
    }
    const { accessToken } = await issueSessionForUser(res, user.id, user.tokenVersion);
    (0, ApiResponse_1.sendSuccess)(res, { accessToken }, 'Token refreshed');
});
exports.logout = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (req.userId) {
        await User_1.User.findByIdAndUpdate(req.userId, { $inc: { tokenVersion: 1 } });
    }
    (0, cookies_1.clearAuthCookies)(res);
    (0, ApiResponse_1.sendSuccess)(res, null, 'Logged out successfully');
});
exports.getMe = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const user = await User_1.User.findById(req.userId);
    if (!user)
        throw ApiError_1.ApiError.notFound('User not found');
    (0, ApiResponse_1.sendSuccess)(res, {
        id: user.id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        mobileVerified: user.mobileVerified,
        emailVerified: user.emailVerified,
        referralCode: user.referralCode,
        avatarUrl: user.avatarUrl,
        gender: user.gender,
        dob: user.dob,
        createdAt: user.createdAt,
    });
});
//# sourceMappingURL=auth.controller.js.map