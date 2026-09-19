"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireCustomerAuth = requireCustomerAuth;
exports.optionalCustomerAuth = optionalCustomerAuth;
exports.requireAdminAuth = requireAdminAuth;
exports.requirePermission = requirePermission;
const jwt_1 = require("../utils/jwt");
const ApiError_1 = require("../utils/ApiError");
const User_1 = require("../models/User");
const Admin_1 = require("../models/Admin");
const Role_1 = require("../models/Role");
function extractToken(req, scope) {
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
        return header.substring(7);
    }
    const cookieName = scope === 'admin' ? 'adminAccessToken' : 'accessToken';
    if (req.cookies?.[cookieName]) {
        return req.cookies[cookieName];
    }
    return null;
}
async function requireCustomerAuth(req, _res, next) {
    try {
        const token = extractToken(req, 'customer');
        if (!token)
            throw ApiError_1.ApiError.unauthorized('Authentication required');
        const payload = (0, jwt_1.verifyAccessToken)(token);
        if (payload.type !== 'customer')
            throw ApiError_1.ApiError.unauthorized('Invalid token type');
        const user = await User_1.User.findById(payload.sub);
        if (!user)
            throw ApiError_1.ApiError.unauthorized('User not found');
        if (user.status === 'blocked')
            throw ApiError_1.ApiError.forbidden('Account is blocked');
        if (user.tokenVersion !== payload.tokenVersion)
            throw ApiError_1.ApiError.unauthorized('Session expired, please log in again');
        req.userId = user.id;
        next();
    }
    catch (err) {
        next(err instanceof ApiError_1.ApiError ? err : ApiError_1.ApiError.unauthorized('Invalid or expired token'));
    }
}
async function optionalCustomerAuth(req, _res, next) {
    try {
        const token = extractToken(req, 'customer');
        if (!token)
            return next();
        const payload = (0, jwt_1.verifyAccessToken)(token);
        if (payload.type !== 'customer')
            return next();
        const user = await User_1.User.findById(payload.sub);
        if (user && user.status === 'active' && user.tokenVersion === payload.tokenVersion) {
            req.userId = user.id;
        }
        next();
    }
    catch {
        next();
    }
}
async function requireAdminAuth(req, _res, next) {
    try {
        const token = extractToken(req, 'admin');
        if (!token)
            throw ApiError_1.ApiError.unauthorized('Authentication required');
        const payload = (0, jwt_1.verifyAccessToken)(token);
        if (payload.type !== 'admin')
            throw ApiError_1.ApiError.unauthorized('Invalid token type');
        const admin = await Admin_1.Admin.findById(payload.sub);
        if (!admin)
            throw ApiError_1.ApiError.unauthorized('Admin not found');
        if (admin.status === 'suspended')
            throw ApiError_1.ApiError.forbidden('Account suspended');
        if (admin.tokenVersion !== payload.tokenVersion)
            throw ApiError_1.ApiError.unauthorized('Session expired, please log in again');
        const role = await Role_1.Role.findById(admin.role);
        req.adminId = admin.id;
        req.adminPermissions = role?.permissions || [];
        req.adminRoleSlug = role?.slug;
        next();
    }
    catch (err) {
        next(err instanceof ApiError_1.ApiError ? err : ApiError_1.ApiError.unauthorized('Invalid or expired token'));
    }
}
function requirePermission(...permissions) {
    return (req, _res, next) => {
        if (req.adminRoleSlug === 'super_admin')
            return next();
        const has = permissions.some((p) => req.adminPermissions?.includes(p));
        if (!has)
            return next(ApiError_1.ApiError.forbidden('You do not have permission to perform this action'));
        next();
    };
}
//# sourceMappingURL=auth.js.map