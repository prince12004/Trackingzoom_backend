import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { OtpToken, OtpPurpose } from '../models/OtpToken';
import { sendSms } from './sms.service';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

function generateNumericOtp(length = 6): string {
  const max = 10 ** length;
  const num = crypto.randomInt(0, max);
  return num.toString().padStart(length, '0');
}

export async function issueOtp(mobile: string, purpose: OtpPurpose): Promise<{ devOtp?: string }> {
  const recent = await OtpToken.findOne({ mobile, purpose }).sort({ createdAt: -1 });
  if (recent) {
    const secondsSinceLast = (Date.now() - recent.lastSentAt.getTime()) / 1000;
    if (secondsSinceLast < env.otp.resendCooldownSeconds) {
      throw ApiError.tooMany(
        `Please wait ${Math.ceil(env.otp.resendCooldownSeconds - secondsSinceLast)}s before requesting another OTP.`
      );
    }
  }

  const code = generateNumericOtp(6);
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + env.otp.expiresMinutes * 60 * 1000);

  await OtpToken.create({
    mobile,
    purpose,
    codeHash,
    expiresAt,
    attempts: 0,
    consumed: false,
    lastSentAt: new Date(),
  });

  await sendSms({
    mobile,
    otp: code,
    message: `Your TrackingZoom GPS verification code is ${code}. Valid for ${env.otp.expiresMinutes} minutes. Do not share this code.`,
  });

  // No real SMS provider configured (SMS_PROVIDER=console, local/dev fallback) — the code
  // is already being logged to the server console by sendSms, so returning it here too is
  // no additional exposure, and lets the frontend show/autofill it for easier testing.
  return env.sms.provider === 'console' ? { devOtp: code } : {};
}

export async function verifyOtp(mobile: string, purpose: OtpPurpose, code: string): Promise<void> {
  const token = await OtpToken.findOne({ mobile, purpose, consumed: false }).sort({ createdAt: -1 });

  if (!token) {
    throw ApiError.badRequest('No active OTP found. Please request a new one.');
  }

  if (token.expiresAt.getTime() < Date.now()) {
    throw ApiError.badRequest('OTP has expired. Please request a new one.');
  }

  if (token.attempts >= env.otp.maxAttempts) {
    throw ApiError.tooMany('Maximum verification attempts exceeded. Please request a new OTP.');
  }

  const isValid = await bcrypt.compare(code, token.codeHash);

  if (!isValid) {
    token.attempts += 1;
    await token.save();
    throw ApiError.badRequest('Invalid OTP.');
  }

  token.consumed = true;
  await token.save();
}
