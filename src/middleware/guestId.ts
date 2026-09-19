import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';

const GUEST_ID_MAX_AGE = 90 * 24 * 60 * 60 * 1000;

export function ensureGuestId(req: Request, res: Response, next: NextFunction) {
  let guestId = req.cookies?.guestId;
  if (!guestId) {
    guestId = uuidv4();
    res.cookie('guestId', guestId, {
      httpOnly: true,
      secure: env.isProd,
      sameSite: 'lax',
      maxAge: GUEST_ID_MAX_AGE,
      path: '/',
    });
  }
  req.guestId = guestId;
  next();
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      guestId?: string;
    }
  }
}
