import { Response } from 'express';
import { env } from '../config/env';

const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

export type CookieScope = 'customer' | 'admin';

const REFRESH_PATH: Record<CookieScope, string> = {
  customer: '/api/v1/auth',
  admin: '/api/v1/admin/auth',
};

const COOKIE_NAMES: Record<CookieScope, { access: string; refresh: string }> = {
  customer: { access: 'accessToken', refresh: 'refreshToken' },
  admin: { access: 'adminAccessToken', refresh: 'adminRefreshToken' },
};

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string, scope: CookieScope = 'customer') {
  const names = COOKIE_NAMES[scope];
  res.cookie(names.access, accessToken, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: 'lax',
    maxAge: ACCESS_TOKEN_MAX_AGE,
    path: '/',
  });
  res.cookie(names.refresh, refreshToken, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: 'lax',
    maxAge: REFRESH_TOKEN_MAX_AGE,
    path: REFRESH_PATH[scope],
  });
}

export function clearAuthCookies(res: Response, scope: CookieScope = 'customer') {
  const names = COOKIE_NAMES[scope];
  res.clearCookie(names.access, { path: '/' });
  res.clearCookie(names.refresh, { path: REFRESH_PATH[scope] });
}

export function getCookieNames(scope: CookieScope) {
  return COOKIE_NAMES[scope];
}
