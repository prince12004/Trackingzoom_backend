import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export type UserType = 'customer' | 'admin' | 'dealer';

export interface AccessTokenPayload {
  sub: string;
  type: UserType;
  role?: string;
  tokenVersion: number;
}

export interface RefreshTokenPayload {
  sub: string;
  type: UserType;
  tokenVersion: number;
  jti: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn,
  } as SignOptions);
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
  } as SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.jwt.accessSecret) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.jwt.refreshSecret) as RefreshTokenPayload;
}
