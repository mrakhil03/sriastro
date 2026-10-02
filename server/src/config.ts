import 'dotenv/config';

const isProd = process.env.NODE_ENV === 'production';

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required environment variable: ${name}`);
  return v;
}

const jwtSecret = required('JWT_SECRET');
if (isProd && jwtSecret.length < 32) throw new Error('JWT_SECRET must be at least 32 characters in production');
required('DATABASE_URL');
const clientUrl = process.env.CLIENT_URL;
if (isProd && !clientUrl) throw new Error('CLIENT_URL is required in production');

export const config = {
  isProd,
  port: Number(process.env.PORT) || 4000,
  jwtSecret,
  clientUrls: (clientUrl || 'http://localhost:5173').split(',').map((s) => s.trim().replace(/\/$/, '')),
  timezone: process.env.APP_TIMEZONE || 'Asia/Kolkata',
  newRequestDays: 7,
};
