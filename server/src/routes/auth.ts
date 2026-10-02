import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { cookieBase, cookieOptions, COOKIE_NAME, requireAdmin, resolveAdmin, signToken } from '../auth';
import { prisma } from '../db';
import { asyncHandler, HttpError } from '../errors';
import { changePasswordSchema, loginSchema } from '../validation';

export const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many sign-in attempts. Please wait a few minutes and try again.' },
});
const dummyHash = bcrypt.hashSync('not-a-real-password', 10); // equalises timing for unknown emails

authRouter.post('/login', loginLimiter, asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const admin = await prisma.admin.findUnique({ where: { email: email.toLowerCase() } });
  const ok = await bcrypt.compare(password, admin?.passwordHash ?? dummyHash);
  if (!admin || !ok) throw new HttpError(401, 'Incorrect email or password.');
  res.cookie(COOKIE_NAME, signToken(admin.id), cookieOptions);
  res.json({ admin: { email: admin.email } });
}));

authRouter.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, cookieBase);
  res.json({ ok: true });
});

// 200 with { admin: null } when signed out, so the public site never logs a failed request
authRouter.get('/me', asyncHandler(async (req, res) => {
  const admin = await resolveAdmin(req);
  res.json({ admin: admin ? { email: admin.email } : null });
}));

authRouter.post('/change-password', requireAdmin, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
  const admin = await prisma.admin.findUniqueOrThrow({ where: { id: req.admin!.id } });
  if (!(await bcrypt.compare(currentPassword, admin.passwordHash))) throw new HttpError(400, 'Current password is incorrect.');
  await prisma.admin.update({ where: { id: admin.id }, data: { passwordHash: await bcrypt.hash(newPassword, 12) } });
  res.json({ ok: true });
}));
