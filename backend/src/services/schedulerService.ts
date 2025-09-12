import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 定时清理：账号冷静期结束的用户物理删除
async function deleteExpiredAccounts() {
  const now = new Date();
  const expired = await prisma.user.findMany({
    where: ({ deletionEffectiveAt: { lte: now } } as any),
    select: { id: true, username: true }
  });
  if (expired.length === 0) return;
  const ids = expired.map(u => u.id);
  await prisma.$transaction(async (tx) => {
    // 删除用户相关 log 的外键自动置空（schema 中设置了 onDelete: SetNull）
    await tx.user.deleteMany({ where: { id: { in: ids } } });
  });
  console.log(`[${now.toISOString()}] 已删除到期账号 ${expired.map(e => e.username).join(', ')}`);
}

export const startCleanupScheduler = () => {
  const interval = setInterval(async () => {
    try {
      await deleteExpiredAccounts();
    } catch (e) {
      console.error('账号清理任务失败:', e);
    }
  }, 60 * 60 * 1000); // 每小时执行

  console.log('账号清理任务已启动（每小时执行一次）');

  return () => clearInterval(interval);
}
