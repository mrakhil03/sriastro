import { CookieOptions, NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from './config';
import { prisma } from './db';
import { asyncHandler, HttpError } from './errors';

declare module 'express-serve-static-core' {
  interface Request { admin?: { id: string; email: string } }
}

export const COOKIE_NAME = 'sriastro_token';
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Cross-site (Vercel -> Render) needs SameSite=None; Secure. Local dev uses Lax.
export const cookieBase: CookieOptions = {
  httpOnly: true,
  secure: config.isProd,
  sameSite: config.isProd ? 'none' : 'lax',
  path: '/',
};
export const cookieOptions: CookieOptions = { ...cookieBase, maxAge: WEEK_MS };

export const signToken = (adminId: string) => jwt.sign({ sub: adminId }, config.jwtSecret, { expiresIn: '7d' });

/** Returns the signed-in admin for this request, or null (bad/missing/expired token, or admin deleted). */
export async function resolveAdmin(req: Request): Promise<{ id: string; email: string } | null> {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;
  let adminId: string;
  try {
    adminId = String((jwt.verify(token, config.jwtSecret) as jwt.JwtPayload).sub);
  } catch {
    return null;
  }
  return prisma.admin.findUnique({ where: { id: adminId }, select: { id: true, email: true } });
}

export const requireAdmin = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const admin = await resolveAdmin(req);
  if (!admin) throw new HttpError(401, 'Please sign in to continue.');
  req.admin = admin;
  next();
});

// Basic CSRF defence for cookie auth: browsers send Origin on cross-origin writes.
export function originGuard(req: Request, _res: Response, next: NextFunction) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.get('origin');
  if (origin && !config.clientUrls.includes(origin.replace(/\/$/, ''))) return next(new HttpError(403, 'Request not allowed.'));
  next();
}
