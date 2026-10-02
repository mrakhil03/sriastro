import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { prisma } from '../db';
import { asyncHandler } from '../errors';
import { publicClientSchema } from '../validation';

export const publicRouter = Router();

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many submissions. Please try again later.' },
});

publicRouter.post('/clients', limiter, asyncHandler(async (req, res) => {
  const d = publicClientSchema.parse(req.body);
  await prisma.client.create({
    data: {
      name: d.name,
      dateOfBirth: new Date(`${d.dateOfBirth}T00:00:00.000Z`),
      birthTime: d.birthTime,
      birthPlace: d.birthPlace,
      amount: 0, paymentStatus: 'NOT_PAID', readingStatus: 'NOT_READ',
    },
  });
  res.status(201).json({ ok: true }); // never return stored data to the public
}));
