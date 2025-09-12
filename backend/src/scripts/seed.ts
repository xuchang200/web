import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

// 单一幂等种子脚本
const prisma = new PrismaClient();

async function seed() {
  console.log('[seed] Start');
  const adminPwd = await bcrypt.hash('admin123', 10);
  const userPwd = await bcrypt.hash('user123', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', email: 'admin@example.com', password: adminPwd, role: UserRole.ADMIN }
  });
  const user = await prisma.user.upsert({
    where: { username: 'testuser' },
    update: {},
    create: { username: 'testuser', email: 'user@example.com', password: userPwd, role: UserRole.USER }
  });
  console.log('[seed] Users ok ->', { admin: admin.username, user: user.username });
  console.log('[seed] Done');
}

seed().catch(e => {
  console.error('[seed][error]', e);
  process.exit(1);
}).finally(() => prisma.$disconnect());