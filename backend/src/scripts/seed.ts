import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('开始创建测试用户...');

  // 创建管理员用户
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'ADMIN'
    }
  });

  // 创建普通用户
  const userPassword = await bcrypt.hash('user123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'testuser@example.com' },
    update: {},
    create: {
      username: 'testuser',
      email: 'testuser@example.com',
      password: userPassword,
      role: 'USER'
    }
  });

  console.log('测试用户创建完成:');
  console.log('管理员账号: admin / admin123 (或使用邮箱: admin@example.com)');
  console.log('普通用户账号: testuser / user123 (或使用邮箱: testuser@example.com)');
}

main()
  .then(() => {
    console.log('数据种子执行完成');
  })
  .catch((e) => {
    console.error('数据种子执行失败:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });