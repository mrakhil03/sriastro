import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { prisma } from './db';
import { originGuard, requireAdmin } from './auth';
import { errorHandler } from './errors';
import { publicRouter } from './routes/public';
import { authRouter } from './routes/auth';
import { adminRouter } from './routes/admin';

const app = express();
app.set('trust proxy', 1); // behind Render/Railway proxy (needed for rate limiting + secure cookies)
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: config.clientUrls, credentials: true }));
app.use(express.json({ limit: '20kb' }));
app.use(cookieParser());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api', originGuard);
app.use('/api/public', publicRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', requireAdmin, adminRouter); // every admin route is protected

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));
app.use(errorHandler);

const server = app.listen(config.port, () => console.log(`SriAstro API listening on :${config.port}`));
const shutdown = () => server.close(async () => { await prisma.$disconnect(); process.exit(0); });
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
