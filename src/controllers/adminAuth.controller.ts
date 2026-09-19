import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { Admin } from '../models/Admin';
import { Role } from '../models/Role';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { setAuthCookies, clearAuthCookies } from '../utils/cookies';
import { env } from '../config/env';

async function issueAdminSession(res: Response, adminId: string, tokenVersion: number) {
  const accessToken = signAccessToken({ sub: adminId, type: 'admin', tokenVersion });
  const refreshToken = signRefreshToken({ sub: adminId, type: 'admin', tokenVersion, jti: uuidv4() });
  setAuthCookies(res, accessToken, refreshToken, 'admin');
  return { accessToken, refreshToken };
}

export const adminLogin = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };

  const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+passwordHash +twoFactorSecret');
  if (!admin) throw ApiError.unauthorized('Invalid email or password');
  if (admin.status === 'suspended') throw ApiError.forbidden('This admin account has been suspended');

  const isValid = await bcrypt.compare(password, admin.passwordHash);
  if (!isValid) throw ApiError.unauthorized('Invalid email or password');

  if (admin.ipWhitelist && admin.ipWhitelist.length > 0) {
    const clientIp = req.ip || '';
    if (!admin.ipWhitelist.includes(clientIp)) {
      throw ApiError.forbidden('Access denied from this IP address');
    }
  }

  if (admin.twoFactorEnabled) {
    return sendSuccess(res, { requiresTwoFactor: true, adminId: admin.id }, 'Enter your 2FA code to continue');
  }

  admin.lastLoginAt = new Date();
  admin.lastLoginIp = req.ip;
  await admin.save();

  const role = await Role.findById(admin.role);
  const { accessToken } = await issueAdminSession(res, admin.id, admin.tokenVersion);
  sendSuccess(res, {
    admin: { id: admin.id, name: admin.name, email: admin.email, role: role?.slug },
    accessToken,
  });
});

export const adminVerifyTwoFactor = catchAsync(async (req: Request, res: Response) => {
  const { adminId, code } = req.body as { adminId: string; code: string };

  const admin = await Admin.findById(adminId).select('+twoFactorSecret');
  if (!admin || !admin.twoFactorEnabled || !admin.twoFactorSecret) {
    throw ApiError.badRequest('Two-factor authentication is not enabled for this account');
  }

  const verified = speakeasy.totp.verify({
    secret: admin.twoFactorSecret,
    encoding: 'base32',
    token: code,
    window: 1,
  });

  if (!verified) throw ApiError.badRequest('Invalid 2FA code');

  admin.lastLoginAt = new Date();
  admin.lastLoginIp = req.ip;
  await admin.save();

  const role = await Role.findById(admin.role);
  const { accessToken } = await issueAdminSession(res, admin.id, admin.tokenVersion);
  sendSuccess(res, {
    admin: { id: admin.id, name: admin.name, email: admin.email, role: role?.slug },
    accessToken,
  });
});

export const setupTwoFactor = catchAsync(async (req: Request, res: Response) => {
  const admin = await Admin.findById(req.adminId);
  if (!admin) throw ApiError.notFound('Admin not found');

  const secret = speakeasy.generateSecret({
    name: `${env.totpIssuer} (${admin.email})`,
    issuer: env.totpIssuer,
  });

  admin.twoFactorTempSecret = secret.base32;
  await admin.save();

  const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url || '');
  sendSuccess(res, { qrCodeDataUrl, secret: secret.base32 }, 'Scan this QR code with your authenticator app');
});

export const enableTwoFactor = catchAsync(async (req: Request, res: Response) => {
  const { code } = req.body as { code: string };
  const admin = await Admin.findById(req.adminId).select('+twoFactorTempSecret');
  if (!admin || !admin.twoFactorTempSecret) {
    throw ApiError.badRequest('No pending 2FA setup found. Please start setup again.');
  }

  const verified = speakeasy.totp.verify({
    secret: admin.twoFactorTempSecret,
    encoding: 'base32',
    token: code,
    window: 1,
  });

  if (!verified) throw ApiError.badRequest('Invalid 2FA code');

  admin.twoFactorSecret = admin.twoFactorTempSecret;
  admin.twoFactorTempSecret = undefined;
  admin.twoFactorEnabled = true;
  await admin.save();

  sendSuccess(res, null, 'Two-factor authentication enabled successfully');
});

export const disableTwoFactor = catchAsync(async (req: Request, res: Response) => {
  const admin = await Admin.findById(req.adminId);
  if (!admin) throw ApiError.notFound('Admin not found');
  admin.twoFactorEnabled = false;
  admin.twoFactorSecret = undefined;
  await admin.save();
  sendSuccess(res, null, 'Two-factor authentication disabled');
});

export const refreshAdminToken = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies?.adminRefreshToken;
  if (!token) throw ApiError.unauthorized('Refresh token missing');

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }
  if (payload.type !== 'admin') throw ApiError.unauthorized('Invalid token type');

  const admin = await Admin.findById(payload.sub);
  if (!admin || admin.tokenVersion !== payload.tokenVersion) {
    throw ApiError.unauthorized('Session expired, please log in again');
  }

  const { accessToken } = await issueAdminSession(res, admin.id, admin.tokenVersion);
  sendSuccess(res, { accessToken }, 'Token refreshed');
});

export const adminLogout = catchAsync(async (req: Request, res: Response) => {
  if (req.adminId) {
    await Admin.findByIdAndUpdate(req.adminId, { $inc: { tokenVersion: 1 } });
  }
  clearAuthCookies(res, 'admin');
  sendSuccess(res, null, 'Logged out successfully');
});

export const getAdminMe = catchAsync(async (req: Request, res: Response) => {
  const admin = await Admin.findById(req.adminId).populate('role');
  if (!admin) throw ApiError.notFound('Admin not found');
  sendSuccess(res, {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    twoFactorEnabled: admin.twoFactorEnabled,
    lastLoginAt: admin.lastLoginAt,
  });
});
