import { Request, Response } from 'express'
import { PrismaClient, LogType } from '@prisma/client'
import { ApiResponse } from '../types/common'

const prisma = new PrismaClient()

interface LogStats {
  userOperations: number
  gameOperations: number
  adminOperations: number
  securityEvents: number
  systemOperations: number
  totalLogs: number
  todayLogs: number
  weeklyLogs: number
  monthlyLogs: number
}

interface LogTypeStats {
  type: string
  count: number
  percentage: number
}

interface DailyStats {
  date: string
  count: number
}

// 获取日志统计概览
export const getLogStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // 用户操作类型（根据实际schema）
    const userOperationTypes: LogType[] = [
      LogType.USER_REGISTER, LogType.USER_LOGIN, LogType.USER_LOGOUT, LogType.USER_PASSWORD_CHANGE,
      LogType.USER_PROFILE_UPDATE, LogType.USER_ACCOUNT_DELETE_REQUEST, 
      LogType.USER_ACCOUNT_DELETE_CANCEL, LogType.USER_ACCOUNT_DELETED
    ]

    // 游戏操作类型（根据实际schema）
    const gameOperationTypes: LogType[] = [
      LogType.GAME_ACTIVATION, LogType.GAME_PLAY_VALID
    ]

    // 管理操作类型（根据实际schema）
    const adminOperationTypes: LogType[] = [
      LogType.ADMIN_USER_CREATE, LogType.ADMIN_USER_UPDATE, LogType.ADMIN_USER_DELETE,
      LogType.ADMIN_GAME_CREATE, LogType.ADMIN_GAME_UPDATE, LogType.ADMIN_GAME_DELETE,
      LogType.ADMIN_CODE_CREATE, LogType.ADMIN_CODE_UPDATE, LogType.ADMIN_CODE_DELETE,
      LogType.ADMIN_SETTINGS_UPDATE, LogType.ADMIN_LOGIN, LogType.ADMIN_LOGOUT
    ]

    // 安全事件类型（根据实际schema）
    const securityEventTypes: LogType[] = [
      LogType.USER_LOGIN_FAILED, LogType.SECURITY_UNAUTHORIZED_ACCESS, 
      LogType.SECURITY_RATE_LIMIT_EXCEEDED, LogType.SECURITY_SUSPICIOUS_ACTIVITY, 
      LogType.SECURITY_IP_BLOCKED
    ]

    // 系统操作类型（根据实际schema）
    const systemOperationTypes: LogType[] = [
      LogType.SYSTEM_ERROR, LogType.SYSTEM_WARNING, LogType.SYSTEM_MAINTENANCE_START,
      LogType.SYSTEM_MAINTENANCE_END, LogType.FILE_UPLOAD, LogType.FILE_UPLOAD_FAILED,
      LogType.FILE_DELETE, LogType.CODE_ACTIVATION_SUCCESS, LogType.CODE_ACTIVATION_FAILED,
      LogType.CODE_ALREADY_USED, LogType.CODE_NOT_FOUND, LogType.CODE_EXPIRED,
      LogType.GAME_ACTIVATION_FAILED
    ]

    // 并行查询所有统计数据
    const [
      userOperations,
      gameOperations,
      adminOperations,
      securityEvents,
      systemOperations,
      totalLogs,
      todayLogs,
      weeklyLogs,
      monthlyLogs
    ] = await Promise.all([
      // 用户操作统计
      prisma.log.count({
        where: { type: { in: userOperationTypes } }
      }),
      // 游戏操作统计
      prisma.log.count({
        where: { type: { in: gameOperationTypes } }
      }),
      // 管理操作统计
      prisma.log.count({
        where: { type: { in: adminOperationTypes } }
      }),
      // 安全事件统计
      prisma.log.count({
        where: { type: { in: securityEventTypes } }
      }),
      // 系统操作统计
      prisma.log.count({
        where: { type: { in: systemOperationTypes } }
      }),
      // 总日志数
      prisma.log.count(),
      // 今日日志数
      prisma.log.count({
        where: { createdAt: { gte: todayStart } }
      }),
      // 本周日志数
      prisma.log.count({
        where: { createdAt: { gte: weekStart } }
      }),
      // 本月日志数
      prisma.log.count({
        where: { createdAt: { gte: monthStart } }
      })
    ])

    const stats: LogStats = {
      userOperations,
      gameOperations,
      adminOperations,
      securityEvents,
      systemOperations,
      totalLogs,
      todayLogs,
      weeklyLogs,
      monthlyLogs
    }

    const response: ApiResponse<LogStats> = {
      success: true,
      data: stats,
      message: '统计数据获取成功'
    }

    res.json(response)
  } catch (error) {
    console.error('Get log stats error:', error)
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: '获取统计数据失败'
    }
    res.status(500).json(response)
  }
}

// 获取日志类型分布统计
export const getLogTypeStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { days = 30 } = req.query
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - Number(days))

    // 查询指定时间范围内的日志类型统计
    const typeStats = await prisma.log.groupBy({
      by: ['type'],
      _count: {
        type: true
      },
      where: {
        createdAt: { gte: startDate }
      },
      orderBy: {
        _count: {
          type: 'desc'
        }
      }
    })

    // 计算总数和百分比
    const totalCount = typeStats.reduce((sum: number, item: any) => sum + item._count.type, 0)
    
    const statsWithPercentage: LogTypeStats[] = typeStats.map((item: any) => ({
      type: item.type,
      count: item._count.type,
      percentage: totalCount > 0 ? Math.round((item._count.type / totalCount) * 100) : 0
    }))

    const response: ApiResponse<LogTypeStats[]> = {
      success: true,
      data: statsWithPercentage,
      message: '日志类型统计获取成功'
    }

    res.json(response)
  } catch (error) {
    console.error('Get log type stats error:', error)
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: '获取日志类型统计失败'
    }
    res.status(500).json(response)
  }
}

// 获取每日日志统计
export const getDailyLogStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { days = 7 } = req.query
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - Number(days))

    // 查询指定时间范围内每日的日志数量
    const dailyStats = await prisma.log.groupBy({
      by: ['createdAt'],
      _count: {
        id: true
      },
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    // 按日期分组统计
    const statsMap = new Map<string, number>()
    dailyStats.forEach((item: any) => {
      const date = item.createdAt.toISOString().split('T')[0]
      statsMap.set(date, (statsMap.get(date) || 0) + item._count.id)
    })

    // 生成完整的日期序列（包括没有日志的日期）
    const result: DailyStats[] = []
    for (let i = Number(days) - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(endDate.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      result.push({
        date: dateStr,
        count: statsMap.get(dateStr) || 0
      })
    }

    const response: ApiResponse<DailyStats[]> = {
      success: true,
      data: result,
      message: '每日统计数据获取成功'
    }

    res.json(response)
  } catch (error) {
    console.error('Get daily log stats error:', error)
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: '获取每日统计数据失败'
    }
    res.status(500).json(response)
  }
}

// 获取热门操作统计
export const getPopularOperations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 10, days = 7 } = req.query
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - Number(days))

    const operations = await prisma.log.groupBy({
      by: ['type'],
      _count: {
        type: true
      },
      where: {
        createdAt: { gte: startDate }
      },
      orderBy: {
        _count: {
          type: 'desc'
        }
      },
      take: Number(limit)
    })

    const result = operations.map((op: any) => ({
      type: op.type,
      count: op._count.type
    }))

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      message: '热门操作统计获取成功'
    }

    res.json(response)
  } catch (error) {
    console.error('Get popular operations error:', error)
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: '获取热门操作统计失败'
    }
    res.status(500).json(response)
  }
}
