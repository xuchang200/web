import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createTestLogs() {
  try {
    console.log('开始创建测试日志数据...')

    // 创建一些测试日志
    const testLogs = [
      {
        type: 'USER_LOGIN',
        message: '用户登录成功',
        ip: '192.168.1.100'
      },
      {
        type: 'USER_LOGOUT',
        message: '用户退出登录',
        ip: '192.168.1.100'
      },
      {
        type: 'GAME_ACCESS',
        message: '用户访问游戏',
        ip: '192.168.1.101'
      },
      {
        type: 'ADMIN_SETTINGS_UPDATE',
        message: '管理员更新系统设置',
        ip: '192.168.1.1'
      },
      {
        type: 'SECURITY_UNAUTHORIZED_ACCESS',
        message: '检测到未授权访问',
        ip: '192.168.1.200'
      },
      {
        type: 'USER_LOGIN_FAILED',
        message: '用户登录失败',
        ip: '192.168.1.200'
      },
      {
        type: 'SYSTEM_ERROR',
        message: '系统错误',
        ip: '127.0.0.1'
      },
      {
        type: 'FILE_UPLOAD',
        message: '文件上传成功',
        ip: '192.168.1.100'
      }
    ]

    // 批量创建日志
    for (const log of testLogs) {
      await prisma.log.create({
        data: log
      })
    }

    console.log(`成功创建 ${testLogs.length} 条测试日志`)
    
    // 查询当前总日志数
    const totalCount = await prisma.log.count()
    console.log(`数据库中总共有 ${totalCount} 条日志`)
    
  } catch (error) {
    console.error('创建测试日志失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestLogs()
