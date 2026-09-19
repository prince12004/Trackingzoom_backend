import { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';
import { User } from '../models/User';
import { Admin } from '../models/Admin';
import { Role } from '../models/Role';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
      adminId?: string;
      adminPermissions?: string[];
      adminRoleSlug?: string;
    }
  }
}

function extractToken(req: Request, scope: 'customer' | 'admin'): string | null {
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

export async function requireCustomerAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = extractToken(req, 'customer');
    if (!token) throw ApiError.unauthorized('Authentication required');

    const payload = verifyAccessToken(token);
    if (payload.type !== 'customer') throw ApiError.unauthorized('Invalid token type');

    const user = await User.findById(payload.sub);
    if (!user) throw ApiError.unauthorized('User not found');
    if (user.status === 'blocked') throw ApiError.forbidden('Account is blocked');
    if (user.tokenVersion !== payload.tokenVersion) throw ApiError.unauthorized('Session expired, please log in again');

    req.userId = user.id;
    next();
  } catch (err) {
    next(err instanceof ApiError ? err : ApiError.unauthorized('Invalid or expired token'));
  }
}

export async function optionalCustomerAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = extractToken(req, 'customer');
    if (!token) return next();
    const payload = verifyAccessToken(token);
    if (payload.type !== 'customer') return next();
    const user = await User.findById(payload.sub);
    if (user && user.status === 'active' && user.tokenVersion === payload.tokenVersion) {
      req.userId = user.id;
    }
    next();
  } catch {
    next();
  }
}

export async function requireAdminAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = extractToken(req, 'admin');
    if (!token) throw ApiError.unauthorized('Authentication required');

    const payload = verifyAccessToken(token);
    if (payload.type !== 'admin') throw ApiError.unauthorized('Invalid token type');

    const admin = await Admin.findById(payload.sub);
    if (!admin) throw ApiError.unauthorized('Admin not found');
    if (admin.status === 'suspended') throw ApiError.forbidden('Account suspended');
    if (admin.tokenVersion !== payload.tokenVersion) throw ApiError.unauthorized('Session expired, please log in again');

    const role = await Role.findById(admin.role);
    req.adminId = admin.id;
    req.adminPermissions = role?.permissions || [];
    req.adminRoleSlug = role?.slug;
    next();
  } catch (err) {
    next(err instanceof ApiError ? err : ApiError.unauthorized('Invalid or expired token'));
  }
}

export function requirePermission(...permissions: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (req.adminRoleSlug === 'super_admin') return next();
    const has = permissions.some((p) => req.adminPermissions?.includes(p));
    if (!has) return next(ApiError.forbidden('You do not have permission to perform this action'));
    next();
  };
}
