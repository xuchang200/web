import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * 清理已过冷静期的账号（物理删除）
 * 建议通过 cron 每日执行一次：
 *   crontab -e
 *   0 2 * * * cd /path/to/your/project && node dist/scripts/process-account-deletion.js
 *   （每日凌晨2点执行）
 */
async function main() {
  const now = new Date()
  const users = await prisma.user.findMany({
    where: {
      deletionEffectiveAt: { lte: now }
    },
    select: { id: true, username: true }
  })
  if (!users.length) {
    console.log('No accounts ready for deletion.')
    return
  }
  console.log('Deleting accounts:', users.map(u => u.id))
  for (const u of users) {
    await prisma.user.delete({ where: { id: u.id } })
  }
  console.log('Done.')
}

main().finally(() => prisma.$disconnect())
