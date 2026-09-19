import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { User } from '../models/User';
import { issueOtp, verifyOtp } from '../services/otp.service';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { setAuthCookies, clearAuthCookies } from '../utils/cookies';
import { generateReferralCode } from '../utils/referralCode';
import { Cart } from '../models/Cart';
import { v4 as uuidv4 } from 'uuid';

async function issueSessionForUser(res: Response, userId: string, tokenVersion: number) {
  const accessToken = signAccessToken({ sub: userId, type: 'customer', tokenVersion });
  const refreshToken = signRefreshToken({ sub: userId, type: 'customer', tokenVersion, jti: uuidv4() });
  setAuthCookies(res, accessToken, refreshToken);
  return { accessToken, refreshToken };
}

export const requestOtp = catchAsync(async (req: Request, res: Response) => {
  const { mobile, purpose } = req.body as { mobile: string; purpose: 'register' | 'login' };

  if (purpose === 'register') {
    const existing = await User.findOne({ mobile });
    if (existing) throw ApiError.conflict('An account already exists for this mobile number. Please log in.');
  } else {
    const existing = await User.findOne({ mobile });
    if (!existing) throw ApiError.notFound('No account found for this mobile number. Please register first.');
  }

  const { devOtp } = await issueOtp(mobile, purpose);
  sendSuccess(res, { mobile, devOtp }, 'OTP sent successfully');
});

export const verifyRegister = catchAsync(async (req: Request, res: Response) => {
  const { mobile, code, name } = req.body as { mobile: string; code: string; name: string };

  const existing = await User.findOne({ mobile });
  if (existing) throw ApiError.conflict('An account already exists for this mobile number.');

  await verifyOtp(mobile, 'register', code);

  const referralCode = generateReferralCode(name);
  const user = await User.create({
    name,
    mobile,
    mobileVerified: true,
    referralCode,
    lastLoginAt: new Date(),
  });

  await Cart.create({ user: user._id, items: [] });

  const { accessToken } = await issueSessionForUser(res, user.id, user.tokenVersion);
  sendSuccess(
    res,
    { user: { id: user.id, name: user.name, mobile: user.mobile, referralCode: user.referralCode }, accessToken },
    'Registration successful',
    201
  );
});

export const verifyLogin = catchAsync(async (req: Request, res: Response) => {
  const { mobile, code } = req.body as { mobile: string; code: string };

  const user = await User.findOne({ mobile });
  if (!user) throw ApiError.notFound('No account found for this mobile number.');
  if (user.status === 'blocked') throw ApiError.forbidden('Your account has been blocked. Contact support.');

  await verifyOtp(mobile, 'login', code);

  user.mobileVerified = true;
  user.lastLoginAt = new Date();
  // validateModifiedOnly avoids re-validating untouched fields — a handful of legacy
  // accounts predate `name` being required and would otherwise fail login entirely
  // on a field this update never even touches.
  await user.save({ validateModifiedOnly: true });

  const { accessToken } = await issueSessionForUser(res, user.id, user.tokenVersion);
  sendSuccess(
    res,
    { user: { id: user.id, name: user.name, mobile: user.mobile, referralCode: user.referralCode }, accessToken },
    'Login successful'
  );
});

export const refreshCustomerToken = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw ApiError.unauthorized('Refresh token missing');

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  if (payload.type !== 'customer') throw ApiError.unauthorized('Invalid token type');

  const user = await User.findById(payload.sub);
  if (!user || user.tokenVersion !== payload.tokenVersion) {
    throw ApiError.unauthorized('Session expired, please log in again');
  }

  const { accessToken } = await issueSessionForUser(res, user.id, user.tokenVersion);
  sendSuccess(res, { accessToken }, 'Token refreshed');
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  if (req.userId) {
    await User.findByIdAndUpdate(req.userId, { $inc: { tokenVersion: 1 } });
  }
  clearAuthCookies(res);
  sendSuccess(res, null, 'Logged out successfully');
});

export const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = await User.findById(req.userId);
  if (!user) throw ApiError.notFound('User not found');
  sendSuccess(res, {
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
