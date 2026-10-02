import { NextFunction, Request, RequestHandler, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => { fn(req, res, next).catch(next); };

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    const fields = err.flatten().fieldErrors;
    const first = Object.values(fields).flat()[0] ?? 'Please check the details and try again.';
    return res.status(400).json({ error: first, fields });
  }
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025')
    return res.status(404).json({ error: 'Record not found.' });
  if (err instanceof Prisma.PrismaClientInitializationError)
    return res.status(503).json({ error: 'The database is temporarily unavailable. Please try again shortly.' });
  if ((err as { type?: string })?.type === 'entity.parse.failed')
    return res.status(400).json({ error: 'Invalid request.' });
  console.error(err); // full details stay in server logs only
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
}
