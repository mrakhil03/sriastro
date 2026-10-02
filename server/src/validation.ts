import { z } from 'zod';

const isoToday = () => new Date().toISOString().slice(0, 10);

export const publicClientSchema = z.object({
  name: z.string({ required_error: 'Please enter your full name' }).trim().min(1, 'Please enter your full name').max(100, 'Name is too long'),
  dateOfBirth: z
    .string({ required_error: 'Please enter your date of birth' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Please enter a valid date of birth')
    .refine((v) => {
      const d = new Date(`${v}T00:00:00.000Z`);
      return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v && v >= '1900-01-01' && v <= isoToday();
    }, 'Please enter a valid date of birth'),
  birthTime: z.string({ required_error: 'Please enter your time of birth' }).regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Please enter a valid time of birth'),
  birthPlace: z.string({ required_error: 'Please enter your birth place' }).trim().min(1, 'Please enter your birth place').max(120, 'Place is too long'),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address').max(254),
  password: z.string().min(1, 'Please enter your password').max(200),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password').max(200),
  newPassword: z.string().min(8, 'New password must be at least 8 characters').max(72, 'New password is too long'),
});

export const amountSchema = z.object({
  amount: z.number({ invalid_type_error: 'Enter a valid amount' }).min(0, 'Amount cannot be negative').max(10_000_000, 'Amount is too large'),
});

export const predictionSchema = z.object({
  prediction: z.string().trim().max(10_000, 'Prediction must be 10,000 characters or fewer'),
});

export const idParam = z.object({ id: z.string().min(1).max(50) });

const page = z.coerce.number().int().min(1).default(1);
export const clientListQuery = z.object({
  search: z.string().trim().max(100).optional(),
  payment: z.enum(['ALL', 'PAID', 'NOT_PAID']).default('ALL'),
  reading: z.enum(['ALL', 'COMPLETED', 'NOT_READ']).default('ALL'),
  sort: z.enum(['newest', 'oldest', 'amount_desc', 'amount_asc']).default('newest'),
  recent: z.enum(['true', 'false']).optional(),
  page,
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export const pagedQuery = z.object({ page, pageSize: z.coerce.number().int().min(1).max(100).default(30) });
export const paymentsQuery = pagedQuery.extend({ status: z.enum(['ALL', 'PAID', 'NOT_PAID']).default('ALL') });
