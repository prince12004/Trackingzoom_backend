"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminMe = exports.adminLogout = exports.refreshAdminToken = exports.disableTwoFactor = exports.enableTwoFactor = exports.setupTwoFactor = exports.adminVerifyTwoFactor = exports.adminLogin = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const speakeasy_1 = __importDefault(require("speakeasy"));
const qrcode_1 = __importDefault(require("qrcode"));
const uuid_1 = require("uuid");
const catchAsync_1 = require("../utils/catchAsync");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const Admin_1 = require("../models/Admin");
const Role_1 = require("../models/Role");
const jwt_1 = require("../utils/jwt");
const cookies_1 = require("../utils/cookies");
const env_1 = require("../config/env");
async function issueAdminSession(res, adminId, tokenVersion) {
    const accessToken = (0, jwt_1.signAccessToken)({ sub: adminId, type: 'admin', tokenVersion });
    const refreshToken = (0, jwt_1.signRefreshToken)({ sub: adminId, type: 'admin', tokenVersion, jti: (0, uuid_1.v4)() });
    (0, cookies_1.setAuthCookies)(res, accessToken, refreshToken, 'admin');
    return { accessToken, refreshToken };
}
exports.adminLogin = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { email, password } = req.body;
    const admin = await Admin_1.Admin.findOne({ email: email.toLowerCase() }).select('+passwordHash +twoFactorSecret');
    if (!admin)
        throw ApiError_1.ApiError.unauthorized('Invalid email or password');
    if (admin.status === 'suspended')
        throw ApiError_1.ApiError.forbidden('This admin account has been suspended');
    const isValid = await bcryptjs_1.default.compare(password, admin.passwordHash);
    if (!isValid)
        throw ApiError_1.ApiError.unauthorized('Invalid email or password');
    if (admin.ipWhitelist && admin.ipWhitelist.length > 0) {
        const clientIp = req.ip || '';
        if (!admin.ipWhitelist.includes(clientIp)) {
            throw ApiError_1.ApiError.forbidden('Access denied from this IP address');
        }
    }
    if (admin.twoFactorEnabled) {
        return (0, ApiResponse_1.sendSuccess)(res, { requiresTwoFactor: true, adminId: admin.id }, 'Enter your 2FA code to continue');
    }
    admin.lastLoginAt = new Date();
    admin.lastLoginIp = req.ip;
    await admin.save();
    const role = await Role_1.Role.findById(admin.role);
    const { accessToken } = await issueAdminSession(res, admin.id, admin.tokenVersion);
    (0, ApiResponse_1.sendSuccess)(res, {
        admin: { id: admin.id, name: admin.name, email: admin.email, role: role?.slug },
        accessToken,
    });
});
exports.adminVerifyTwoFactor = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { adminId, code } = req.body;
    const admin = await Admin_1.Admin.findById(adminId).select('+twoFactorSecret');
    if (!admin || !admin.twoFactorEnabled || !admin.twoFactorSecret) {
        throw ApiError_1.ApiError.badRequest('Two-factor authentication is not enabled for this account');
    }
    const verified = speakeasy_1.default.totp.verify({
        secret: admin.twoFactorSecret,
        encoding: 'base32',
        token: code,
        window: 1,
    });
    if (!verified)
        throw ApiError_1.ApiError.badRequest('Invalid 2FA code');
    admin.lastLoginAt = new Date();
    admin.lastLoginIp = req.ip;
    await admin.save();
    const role = await Role_1.Role.findById(admin.role);
    const { accessToken } = await issueAdminSession(res, admin.id, admin.tokenVersion);
    (0, ApiResponse_1.sendSuccess)(res, {
        admin: { id: admin.id, name: admin.name, email: admin.email, role: role?.slug },
        accessToken,
    });
});
exports.setupTwoFactor = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const admin = await Admin_1.Admin.findById(req.adminId);
    if (!admin)
        throw ApiError_1.ApiError.notFound('Admin not found');
    const secret = speakeasy_1.default.generateSecret({
        name: `${env_1.env.totpIssuer} (${admin.email})`,
        issuer: env_1.env.totpIssuer,
    });
    admin.twoFactorTempSecret = secret.base32;
    await admin.save();
    const qrCodeDataUrl = await qrcode_1.default.toDataURL(secret.otpauth_url || '');
    (0, ApiResponse_1.sendSuccess)(res, { qrCodeDataUrl, secret: secret.base32 }, 'Scan this QR code with your authenticator app');
});
exports.enableTwoFactor = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { code } = req.body;
    const admin = await Admin_1.Admin.findById(req.adminId).select('+twoFactorTempSecret');
    if (!admin || !admin.twoFactorTempSecret) {
        throw ApiError_1.ApiError.badRequest('No pending 2FA setup found. Please start setup again.');
    }
    const verified = speakeasy_1.default.totp.verify({
        secret: admin.twoFactorTempSecret,
        encoding: 'base32',
        token: code,
        window: 1,
    });
    if (!verified)
        throw ApiError_1.ApiError.badRequest('Invalid 2FA code');
    admin.twoFactorSecret = admin.twoFactorTempSecret;
    admin.twoFactorTempSecret = undefined;
    admin.twoFactorEnabled = true;
    await admin.save();
    (0, ApiResponse_1.sendSuccess)(res, null, 'Two-factor authentication enabled successfully');
});
exports.disableTwoFactor = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const admin = await Admin_1.Admin.findById(req.adminId);
    if (!admin)
        throw ApiError_1.ApiError.notFound('Admin not found');
    admin.twoFactorEnabled = false;
    admin.twoFactorSecret = undefined;
    await admin.save();
    (0, ApiResponse_1.sendSuccess)(res, null, 'Two-factor authentication disabled');
});
exports.refreshAdminToken = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const token = req.cookies?.adminRefreshToken;
    if (!token)
        throw ApiError_1.ApiError.unauthorized('Refresh token missing');
    let payload;
    try {
        payload = (0, jwt_1.verifyRefreshToken)(token);
    }
    catch {
        throw ApiError_1.ApiError.unauthorized('Invalid or expired refresh token');
    }
    if (payload.type !== 'admin')
        throw ApiError_1.ApiError.unauthorized('Invalid token type');
    const admin = await Admin_1.Admin.findById(payload.sub);
    if (!admin || admin.tokenVersion !== payload.tokenVersion) {
        throw ApiError_1.ApiError.unauthorized('Session expired, please log in again');
    }
    const { accessToken } = await issueAdminSession(res, admin.id, admin.tokenVersion);
    (0, ApiResponse_1.sendSuccess)(res, { accessToken }, 'Token refreshed');
});
exports.adminLogout = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (req.adminId) {
        await Admin_1.Admin.findByIdAndUpdate(req.adminId, { $inc: { tokenVersion: 1 } });
    }
    (0, cookies_1.clearAuthCookies)(res, 'admin');
    (0, ApiResponse_1.sendSuccess)(res, null, 'Logged out successfully');
});
exports.getAdminMe = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const admin = await Admin_1.Admin.findById(req.adminId).populate('role');
    if (!admin)
        throw ApiError_1.ApiError.notFound('Admin not found');
    (0, ApiResponse_1.sendSuccess)(res, {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        twoFactorEnabled: admin.twoFactorEnabled,
        lastLoginAt: admin.lastLoginAt,
    });
});
//# sourceMappingURL=adminAuth.controller.js.map