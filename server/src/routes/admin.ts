import { Router } from 'express';
import { Client, Prisma } from '@prisma/client';
import { config } from '../config';
import { prisma } from '../db';
import { asyncHandler, HttpError } from '../errors';
import { amountSchema, clientListQuery, idParam, pagedQuery, paymentsQuery, predictionSchema } from '../validation';

export const adminRouter = Router();

const num = (d: Prisma.Decimal | null | undefined) => Number(d ?? 0);
const serialize = (c: Client) => ({ ...c, amount: num(c.amount) });
const DEFAULT_DESCRIPTION = 'Birth Chart Reading';

/** Start of "today" in the configured timezone, as a UTC Date. */
function startOfToday(tz: string): Date {
  const now = new Date();
  const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(now); // YYYY-MM-DD
  const guess = new Date(`${ymd}T00:00:00.000Z`);
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(guess).map((x) => [x.type, x.value]),
  );
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return new Date(guess.getTime() - (asUtc - guess.getTime()));
}

async function moneyStats() {
  const [total, today, count, pending] = await Promise.all([
    prisma.transaction.aggregate({ _sum: { amount: true } }),
    prisma.transaction.aggregate({ _sum: { amount: true }, where: { createdAt: { gte: startOfToday(config.timezone) } } }),
    prisma.transaction.count(),
    prisma.client.aggregate({ _sum: { amount: true }, where: { paymentStatus: 'NOT_PAID' } }),
  ]);
  return {
    totalCollection: num(total._sum.amount),
    todayCollection: num(today._sum.amount),
    totalTransactions: count,
    pendingCollection: num(pending._sum.amount),
  };
}

// ---------- Dashboard ----------
adminRouter.get('/dashboard', asyncHandler(async (_req, res) => {
  const since = new Date(Date.now() - config.newRequestDays * 86_400_000);
  const [totalClients, newRequests, completedReadings, pendingReadings, money, recent] = await Promise.all([
    prisma.client.count(),
    prisma.client.count({ where: { createdAt: { gte: since } } }),
    prisma.client.count({ where: { readingStatus: 'COMPLETED' } }),
    prisma.client.count({ where: { readingStatus: 'NOT_READ' } }),
    moneyStats(),
    prisma.client.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
  ]);
  res.json({
    totalClients, newRequests, completedReadings, pendingReadings,
    totalCollection: money.totalCollection, pendingCollection: money.pendingCollection,
    recent: recent.map(serialize),
  });
}));

// ---------- Clients ----------
const sortMap: Record<string, Prisma.ClientOrderByWithRelationInput> = {
  newest: { createdAt: 'desc' }, oldest: { createdAt: 'asc' },
  amount_desc: { amount: 'desc' }, amount_asc: { amount: 'asc' },
};

adminRouter.get('/clients', asyncHandler(async (req, res) => {
  const q = clientListQuery.parse(req.query);
  const where: Prisma.ClientWhereInput = {
    ...(q.search ? { OR: [
      { name: { contains: q.search, mode: 'insensitive' } },
      { birthPlace: { contains: q.search, mode: 'insensitive' } },
    ] } : {}),
    ...(q.payment !== 'ALL' ? { paymentStatus: q.payment } : {}),
    ...(q.reading !== 'ALL' ? { readingStatus: q.reading } : {}),
    ...(q.recent === 'true' ? { createdAt: { gte: new Date(Date.now() - config.newRequestDays * 86_400_000) } } : {}),
  };
  const [total, items] = await prisma.$transaction([
    prisma.client.count({ where }),
    prisma.client.findMany({
      where, orderBy: [sortMap[q.sort], { id: 'asc' }],
      skip: (q.page - 1) * q.pageSize, take: q.pageSize,
    }),
  ]);
  res.json({ items: items.map(serialize), total, page: q.page, pageSize: q.pageSize });
}));

adminRouter.get('/clients/:id', asyncHandler(async (req, res) => {
  const { id } = idParam.parse(req.params);
  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) throw new HttpError(404, 'Client not found.');
  res.json({ client: serialize(client) });
}));

adminRouter.patch('/clients/:id/prediction', asyncHandler(async (req, res) => {
  const { id } = idParam.parse(req.params);
  const { prediction } = predictionSchema.parse(req.body);
  const client = await prisma.client.update({ where: { id }, data: { prediction } });
  res.json({ client: serialize(client) });
}));

adminRouter.patch('/clients/:id/amount', asyncHandler(async (req, res) => {
  const { id } = idParam.parse(req.params);
  const { amount } = amountSchema.parse(req.body);
  const rounded = Math.round(amount * 100) / 100;
  const r = await prisma.client.updateMany({ where: { id, paymentStatus: 'NOT_PAID' }, data: { amount: rounded } });
  if (r.count === 0) {
    const exists = await prisma.client.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new HttpError(404, 'Client not found.');
    throw new HttpError(409, 'The amount cannot be changed after payment is marked as paid.');
  }
  res.json({ client: serialize(await prisma.client.findUniqueOrThrow({ where: { id } })) });
}));

// Mark paid: one atomic DB transaction; the guarded updateMany makes duplicates impossible even under races.
adminRouter.patch('/clients/:id/pay', asyncHandler(async (req, res) => {
  const { id } = idParam.parse(req.params);
  const result = await prisma.$transaction(async (tx) => {
    const client = await tx.client.findUnique({ where: { id } });
    if (!client) throw new HttpError(404, 'Client not found.');
    if (client.paymentStatus === 'PAID') return { client, alreadyPaid: true };
    if (num(client.amount) <= 0) throw new HttpError(400, 'Set an amount before marking as paid.');
    const updated = await tx.client.updateMany({ where: { id, paymentStatus: 'NOT_PAID' }, data: { paymentStatus: 'PAID' } });
    if (updated.count === 0) return { client: await tx.client.findUniqueOrThrow({ where: { id } }), alreadyPaid: true };
    await tx.transaction.create({ data: { clientId: id, amount: client.amount, description: DEFAULT_DESCRIPTION } });
    return { client: await tx.client.findUniqueOrThrow({ where: { id } }), alreadyPaid: false };
  });
  res.json({ client: serialize(result.client), alreadyPaid: result.alreadyPaid });
}));

adminRouter.patch('/clients/:id/complete', asyncHandler(async (req, res) => {
  const { id } = idParam.parse(req.params);
  const exists = await prisma.client.findUnique({ where: { id }, select: { id: true } });
  if (!exists) throw new HttpError(404, 'Client not found.');
  const client = await prisma.client.update({ where: { id }, data: { readingStatus: 'COMPLETED' } });
  res.json({ client: serialize(client) });
}));

adminRouter.delete('/clients/:id', asyncHandler(async (req, res) => {
  const { id } = idParam.parse(req.params);
  const r = await prisma.client.deleteMany({ where: { id } }); // transactions removed by ON DELETE CASCADE
  if (r.count === 0) throw new HttpError(404, 'Client not found.');
  res.json({ ok: true });
}));

// ---------- Transactions ----------
adminRouter.get('/transactions', asyncHandler(async (req, res) => {
  const { page, pageSize } = pagedQuery.parse(req.query);
  const [summary, total, rows] = await Promise.all([
    moneyStats(),
    prisma.transaction.count(),
    prisma.transaction.findMany({
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], skip: (page - 1) * pageSize, take: pageSize,
      include: { client: { select: { name: true } } },
    }),
  ]);
  res.json({
    summary,
    items: rows.map((t) => ({
      id: t.id, clientId: t.clientId, clientName: t.client.name,
      amount: num(t.amount), description: t.description ?? DEFAULT_DESCRIPTION, createdAt: t.createdAt,
    })),
    total, page, pageSize,
  });
}));

// ---------- Payments ----------
adminRouter.get('/payments', asyncHandler(async (req, res) => {
  const { status, page, pageSize } = paymentsQuery.parse(req.query);
  const where: Prisma.ClientWhereInput = status === 'ALL' ? {} : { paymentStatus: status };
  const [collected, paidCustomers, pendingCustomers, pendingAmount, total, rows] = await Promise.all([
    prisma.transaction.aggregate({ _sum: { amount: true } }),
    prisma.client.count({ where: { paymentStatus: 'PAID' } }),
    prisma.client.count({ where: { paymentStatus: 'NOT_PAID' } }),
    prisma.client.aggregate({ _sum: { amount: true }, where: { paymentStatus: 'NOT_PAID' } }),
    prisma.client.count({ where }),
    prisma.client.findMany({
      where, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], skip: (page - 1) * pageSize, take: pageSize,
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true } } },
    }),
  ]);
  res.json({
    summary: { totalCollected: num(collected._sum.amount), paidCustomers, pendingCustomers, pendingAmount: num(pendingAmount._sum.amount) },
    items: rows.map((c) => ({
      id: c.id, name: c.name, amount: num(c.amount), paymentStatus: c.paymentStatus,
      createdAt: c.createdAt, paidAt: c.transactions[0]?.createdAt ?? null,
    })),
    total, page, pageSize,
  });
}));

// ---------- Readings ----------
adminRouter.get('/readings', asyncHandler(async (_req, res) => {
  const [pendingCount, completedCount, pending, completed] = await Promise.all([
    prisma.client.count({ where: { readingStatus: 'NOT_READ' } }),
    prisma.client.count({ where: { readingStatus: 'COMPLETED' } }),
    prisma.client.findMany({ where: { readingStatus: 'NOT_READ' }, orderBy: { createdAt: 'asc' }, take: 100 }),
    prisma.client.findMany({ where: { readingStatus: 'COMPLETED' }, orderBy: { updatedAt: 'desc' }, take: 100 }),
  ]);
  res.json({ pendingCount, completedCount, pending: pending.map(serialize), completed: completed.map(serialize) });
}));
