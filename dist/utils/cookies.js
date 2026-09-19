"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAuthCookies = setAuthCookies;
exports.clearAuthCookies = clearAuthCookies;
exports.getCookieNames = getCookieNames;
const env_1 = require("../config/env");
const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60 * 1000;
const REFRESH_PATH = {
    customer: '/api/v1/auth',
    admin: '/api/v1/admin/auth',
};
const COOKIE_NAMES = {
    customer: { access: 'accessToken', refresh: 'refreshToken' },
    admin: { access: 'adminAccessToken', refresh: 'adminRefreshToken' },
};
function setAuthCookies(res, accessToken, refreshToken, scope = 'customer') {
    const names = COOKIE_NAMES[scope];
    res.cookie(names.access, accessToken, {
        httpOnly: true,
        secure: env_1.env.isProd,
        sameSite: 'lax',
        maxAge: ACCESS_TOKEN_MAX_AGE,
        path: '/',
    });
    res.cookie(names.refresh, refreshToken, {
        httpOnly: true,
        secure: env_1.env.isProd,
        sameSite: 'lax',
        maxAge: REFRESH_TOKEN_MAX_AGE,
        path: REFRESH_PATH[scope],
    });
}
function clearAuthCookies(res, scope = 'customer') {
    const names = COOKIE_NAMES[scope];
    res.clearCookie(names.access, { path: '/' });
    res.clearCookie(names.refresh, { path: REFRESH_PATH[scope] });
}
function getCookieNames(scope) {
    return COOKIE_NAMES[scope];
}
//# sourceMappingURL=cookies.js.map