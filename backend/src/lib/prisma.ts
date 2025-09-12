import { PrismaClient } from '@prisma/client'

// 单例 Prisma 客户端 - 避免内存泄露
declare global {
  var __prisma: PrismaClient | undefined
}

const prisma = globalThis.__prisma ?? new PrismaClient({
  log: ['error', 'warn'], // 只记录错误和警告，减少日志量
})

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}

// 优雅关闭处理
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})

process.on('SIGINT', async () => {
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await prisma.$disconnect()
  process.exit(0)
})

export default prisma