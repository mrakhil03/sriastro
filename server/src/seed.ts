/** Creates the admin account without overwriting an existing password. */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD before creating the admin account.');
  }
  if (password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error('ADMIN_PASSWORD must be at least 12 characters and no more than 72 UTF-8 bytes.');
  }

  // update: {} -> re-running never overwrites a password the admin has since changed
  await prisma.admin.upsert({
    where: { email }, update: {},
    create: { email, passwordHash: await bcrypt.hash(password, 12) },
  });
  console.log(`✓ Admin ready: ${email}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
