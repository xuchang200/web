import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('开始创建种子数据...');

  // 创建管理员用户
  const hashedAdminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@example.com',
      password: hashedAdminPassword,
      role: UserRole.ADMIN
    },
  });

  console.log('✅ 管理员用户创建成功:', {
    id: admin.id,
    username: admin.username,
    email: admin.email,
    role: admin.role
  });

  // 创建普通用户
  const hashedUserPassword = await bcrypt.hash('user123', 10);
  const user = await prisma.user.upsert({
    where: { username: 'testuser' },
    update: {},
    create: {
      username: 'testuser',
      email: 'user@example.com',
      password: hashedUserPassword,
      role: UserRole.USER
    },
  });

  console.log('✅ 普通用户创建成功:', {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role
  });

  console.log('🎉 种子数据创建完成！');
  console.log('---');
  console.log('测试账号信息:');
  console.log('管理员 - 用户名: admin, 密码: admin123');
  console.log('普通用户 - 用户名: testuser, 密码: user123');
}

main()
  .catch((e) => {
    console.error('❌ 种子数据创建失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });