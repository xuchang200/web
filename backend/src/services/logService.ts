import { LogType } from '@prisma/client'
import { ClientContextInfo } from '../utils/requestContext'
import prisma from '../lib/prisma'

export interface CreateLogInput {
  type: string
  message: string
  userId?: string | null
  gameId?: string | null
  activationCodeId?: string | null
  targetUserId?: string | null
  metadata?: any | null
  context?: ClientContextInfo
}

export async function createLog(input: CreateLogInput) {
  const { context, ...data } = input
  const safeType: LogType = ((): LogType => {
    switch ((data.type || '').toString()) {
      // 用户相关操作
      case 'USER_REGISTER':
        return LogType.USER_REGISTER
      case 'USER_LOGIN':
        return LogType.USER_LOGIN
      case 'USER_LOGIN_FAILED':
        return LogType.USER_LOGIN_FAILED
      case 'USER_LOGOUT':
        return LogType.USER_LOGOUT
      case 'USER_PASSWORD_CHANGE':
        return LogType.USER_PASSWORD_CHANGE
      case 'USER_PROFILE_UPDATE':
        return LogType.USER_PROFILE_UPDATE
      case 'USER_ACCOUNT_DELETE_REQUEST':
        return LogType.USER_ACCOUNT_DELETE_REQUEST
      case 'USER_ACCOUNT_DELETE_CANCEL':
        return LogType.USER_ACCOUNT_DELETE_CANCEL
      case 'USER_ACCOUNT_DELETED':
        return LogType.USER_ACCOUNT_DELETED
      
      // 游戏相关操作
      case 'GAME_ACTIVATION':
        return LogType.GAME_ACTIVATION
      case 'GAME_ACTIVATION_FAILED':
        return LogType.GAME_ACTIVATION_FAILED
      case 'GAME_PLAY_VALID':
        return LogType.GAME_PLAY_VALID
      
      // 激活码相关操作
      case 'CODE_ACTIVATION_SUCCESS':
        return LogType.CODE_ACTIVATION_SUCCESS
      case 'CODE_ACTIVATION_FAILED':
        return LogType.CODE_ACTIVATION_FAILED
      case 'CODE_ALREADY_USED':
        return LogType.CODE_ALREADY_USED
      case 'CODE_NOT_FOUND':
        return LogType.CODE_NOT_FOUND
      case 'CODE_EXPIRED':
        return LogType.CODE_EXPIRED
      
      // 文件操作
      case 'FILE_UPLOAD':
        return LogType.FILE_UPLOAD
      case 'FILE_UPLOAD_FAILED':
        return LogType.FILE_UPLOAD_FAILED
      case 'FILE_DELETE':
        return LogType.FILE_DELETE
      
      // 管理员操作
      case 'ADMIN_USER_CREATE':
        return LogType.ADMIN_USER_CREATE
      case 'ADMIN_USER_UPDATE':
        return LogType.ADMIN_USER_UPDATE
      case 'ADMIN_USER_DELETE':
        return LogType.ADMIN_USER_DELETE
      case 'ADMIN_GAME_CREATE':
        return LogType.ADMIN_GAME_CREATE
      case 'ADMIN_GAME_UPDATE':
        return LogType.ADMIN_GAME_UPDATE
      case 'ADMIN_GAME_DELETE':
        return LogType.ADMIN_GAME_DELETE
      case 'ADMIN_CODE_CREATE':
        return LogType.ADMIN_CODE_CREATE
      case 'ADMIN_CODE_UPDATE':
        return LogType.ADMIN_CODE_UPDATE
      case 'ADMIN_CODE_DELETE':
        return LogType.ADMIN_CODE_DELETE
      case 'ADMIN_SETTINGS_UPDATE':
        return LogType.ADMIN_SETTINGS_UPDATE
      case 'ADMIN_LOGIN':
        return LogType.ADMIN_LOGIN
      case 'ADMIN_LOGOUT':
        return LogType.ADMIN_LOGOUT
      
      // 系统操作
      case 'SYSTEM_ERROR':
        return LogType.SYSTEM_ERROR
      case 'SYSTEM_WARNING':
        return LogType.SYSTEM_WARNING
      case 'SYSTEM_MAINTENANCE_START':
        return LogType.SYSTEM_MAINTENANCE_START
      case 'SYSTEM_MAINTENANCE_END':
        return LogType.SYSTEM_MAINTENANCE_END
      
      // 安全相关操作
      case 'SECURITY_UNAUTHORIZED_ACCESS':
        return LogType.SECURITY_UNAUTHORIZED_ACCESS
      case 'SECURITY_RATE_LIMIT_EXCEEDED':
        return LogType.SECURITY_RATE_LIMIT_EXCEEDED
      case 'SECURITY_SUSPICIOUS_ACTIVITY':
        return LogType.SECURITY_SUSPICIOUS_ACTIVITY
      case 'SECURITY_IP_BLOCKED':
        return LogType.SECURITY_IP_BLOCKED
      
      default:
        return LogType.USER_REGISTER // 默认值
    }
  })()
  return prisma.log.create({
    data: {
      type: safeType,
      message: data.message,
      userId: data.userId || undefined,
      gameId: data.gameId || undefined,
      activationCodeId: data.activationCodeId || undefined,
      targetUserId: data.targetUserId || undefined,
      ip: context?.ip,
      userAgent: context?.userAgent,
      metadata: data.metadata || undefined,
    },
  })
}

export interface QueryLogsParams {
  page?: number
  pageSize?: number
  type?: string
  userId?: string
  gameId?: string
  targetUserId?: string
  startDate?: string
  endDate?: string
  search?: string
}

export async function queryLogs(params: QueryLogsParams) {
  const {
    page = 1,
    pageSize = 20,
    type,
    userId,
    gameId,
    targetUserId,
    startDate,
    endDate,
    search
  } = params

  const normalizePage = Number.isFinite(page) && page! > 0 ? page! : 1
  const normalizePageSize = Number.isFinite(pageSize) && pageSize! > 0 ? Math.min(pageSize!, 200) : 20

  const where: any = {}
  if (type) where.type = type as any
  if (userId) where.userId = userId
  if (gameId) where.gameId = gameId
  if (targetUserId) where.targetUserId = targetUserId
  const parseDate = (s?: string) => {
    if (!s) return undefined
    const isoLike = s.replace(' ', 'T')
    const d = new Date(isoLike)
    return isNaN(d.getTime()) ? undefined : d
  }
  const gte = parseDate(startDate)
  const lte = parseDate(endDate)
  if (gte || lte) {
    where.createdAt = {}
    if (gte) where.createdAt.gte = gte
    if (lte) where.createdAt.lte = lte
  }
  if (search && search.trim()) {
    const s = search.trim()
    where.OR = [
      { message: { contains: s } },
      { user: { is: { username: { contains: s } } } },
      { user: { is: { email: { contains: s } } } },
      { targetUser: { is: { username: { contains: s } } } },
      { targetUser: { is: { email: { contains: s } } } },
      { game: { is: { name: { contains: s } } } },
      { activationCode: { is: { code: { contains: s } } } },
    ]
  }

  const skip = (normalizePage - 1) * normalizePageSize
  const [items, total] = await Promise.all([
    prisma.log.findMany({
      where,
      include: {
        user: { select: { id: true, username: true, email: true } },
        targetUser: { select: { id: true, username: true, email: true } },
        game: { select: { id: true, name: true } },
        activationCode: { select: { id: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: normalizePageSize,
    }),
    prisma.log.count({ where })
  ])

  return { items, total, page: normalizePage, pageSize: normalizePageSize }
}

export async function getLogById(id: string) {
  return prisma.log.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, username: true, email: true } },
      targetUser: { select: { id: true, username: true, email: true } },
      game: { select: { id: true, name: true } },
      activationCode: { select: { id: true, code: true } },
    },
  })
}

export async function deleteLog(id: string) {
  return prisma.log.delete({ where: { id } })
}

export async function deleteLogs(ids: string[]) {
  return prisma.log.deleteMany({ where: { id: { in: ids } } })
}

export async function clearLogs() {
  return prisma.log.deleteMany({})
}

// 新增的日志记录函数，用于记录管理员操作
export interface LogActionInput {
  userId?: number | null
  username?: string | null
  action: string
  resource?: string | null
  details?: any | null
  ipAddress?: string | null
  userAgent?: string | null
}

export async function logAction(input: LogActionInput) {
  try {
    // 将action映射到LogType枚举
    const logType = mapActionToLogType(input.action)
    
    // 构建日志消息
    const message = buildLogMessage(input)
    
    // 构建metadata
    const metadata = {
      action: input.action,
      resource: input.resource,
      details: input.details,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent
    }
    
    return await createLog({
      type: logType,
      message,
      userId: input.userId?.toString() || null,
      metadata
    })
  } catch (error) {
    console.error('记录操作日志失败:', error)
    throw error
  }
}

function mapActionToLogType(action: string): string {
  const actionMap: Record<string, string> = {
    'UPDATE_SITE_BASIC': 'ADMIN_SETTINGS_UPDATE',
    'UPDATE_ACCOUNT_POLICY': 'ADMIN_SETTINGS_UPDATE',
    'UPDATE_SECURITY_RISK': 'ADMIN_SETTINGS_UPDATE',
    'UPDATE_GAME_POLICY': 'ADMIN_SETTINGS_UPDATE',
    'RESET_SITE_BASIC': 'ADMIN_SETTINGS_UPDATE',
    'RESET_ACCOUNT_POLICY': 'ADMIN_SETTINGS_UPDATE',
    'RESET_SECURITY_RISK': 'ADMIN_SETTINGS_UPDATE',
    'RESET_GAME_POLICY': 'ADMIN_SETTINGS_UPDATE'
  }
  
  return actionMap[action] || 'ADMIN_SETTINGS_UPDATE'
}

function buildLogMessage(input: LogActionInput): string {
  const user = input.username || `用户${input.userId || '未知'}`
  const resource = input.resource || '系统设置'
  
  const actionMap: Record<string, string> = {
    'UPDATE_SITE_BASIC': '更新了基础站点设置',
    'UPDATE_ACCOUNT_POLICY': '更新了账号策略设置',
    'UPDATE_SECURITY_RISK': '更新了安全风控设置',
    'UPDATE_GAME_POLICY': '更新了游戏策略设置',
    'RESET_SITE_BASIC': '重置了基础站点设置',
    'RESET_ACCOUNT_POLICY': '重置了账号策略设置',
    'RESET_SECURITY_RISK': '重置了安全风控设置',
    'RESET_GAME_POLICY': '重置了游戏策略设置'
  }
  
  const actionDesc = actionMap[input.action] || `执行了${input.action}操作`
  
  return `管理员 ${user} ${actionDesc}`
}

// 新增：专用的日志记录工具函数

/**
 * 记录用户登录日志
 */
export async function logUserLogin(userId: string, username: string, success: boolean, context?: ClientContextInfo, errorReason?: string) {
  try {
    const type = success ? 'USER_LOGIN' : 'USER_LOGIN_FAILED'
    const message = success 
      ? `用户 ${username} 登录成功`
      : `用户 ${username} 登录失败${errorReason ? `: ${errorReason}` : ''}`
    
    await createLog({
      type,
      message,
      userId: success ? userId : undefined,
      context,
      metadata: {
        username,
        success,
        errorReason: success ? undefined : errorReason,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('记录登录日志失败:', error)
  }
}

/**
 * 记录用户登出日志
 */
export async function logUserLogout(userId: string, username: string, context?: ClientContextInfo) {
  try {
    await createLog({
      type: 'USER_LOGOUT',
      message: `用户 ${username} 登出`,
      userId,
      context,
      metadata: {
        username,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('记录登出日志失败:', error)
  }
}

/**
 * 记录游戏激活日志
 */
export async function logGameActivation(
  userId: string, 
  username: string, 
  gameId: string, 
  gameName: string, 
  activationCodeId: string,
  success: boolean, 
  context?: ClientContextInfo, 
  errorReason?: string
) {
  try {
    const type = success ? 'GAME_ACTIVATION' : 'GAME_ACTIVATION_FAILED'
    const message = success 
      ? `用户 ${username} 成功激活游戏 "${gameName}"`
      : `用户 ${username} 激活游戏 "${gameName}" 失败${errorReason ? `: ${errorReason}` : ''}`
    
    await createLog({
      type,
      message,
      userId: success ? userId : undefined,
      gameId: success ? gameId : undefined,
      activationCodeId: success ? activationCodeId : undefined,
      context,
      metadata: {
        username,
        gameName,
        success,
        errorReason: success ? undefined : errorReason,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('记录游戏激活日志失败:', error)
  }
}

/**
 * 记录激活码使用日志
 */
export async function logCodeActivation(
  userId: string,
  username: string,
  code: string,
  gameId: string,
  gameName: string,
  activationCodeId: string,
  status: 'SUCCESS' | 'ALREADY_USED' | 'NOT_FOUND' | 'EXPIRED',
  context?: ClientContextInfo
) {
  try {
    const typeMap = {
      'SUCCESS': 'CODE_ACTIVATION_SUCCESS',
      'ALREADY_USED': 'CODE_ALREADY_USED',
      'NOT_FOUND': 'CODE_NOT_FOUND',
      'EXPIRED': 'CODE_EXPIRED'
    }
    
    const messageMap = {
      'SUCCESS': `用户 ${username} 成功使用激活码 ${code} 激活游戏 "${gameName}"`,
      'ALREADY_USED': `用户 ${username} 尝试使用已被使用的激活码 ${code}`,
      'NOT_FOUND': `用户 ${username} 尝试使用不存在的激活码 ${code}`,
      'EXPIRED': `用户 ${username} 尝试使用已过期的激活码 ${code}`
    }
    
    await createLog({
      type: typeMap[status],
      message: messageMap[status],
      userId: status === 'SUCCESS' ? userId : undefined,
      gameId: status === 'SUCCESS' ? gameId : undefined,
      activationCodeId: status === 'SUCCESS' ? activationCodeId : undefined,
      context,
      metadata: {
        username,
        code,
        gameName,
        status,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('记录激活码使用日志失败:', error)
  }
}

/**
 * 记录游戏访问日志 - 已废弃，现在只记录有效游玩
 * @deprecated 使用 logValidGamePlay 替代
 */
export async function logGameAccess(
  userId: string, 
  username: string, 
  gameId: string, 
  gameName: string, 
  action: 'VALID_PLAY',
  context?: ClientContextInfo
) {
  // 只支持有效游玩记录
  if (action === 'VALID_PLAY') {
    await logValidGamePlay(userId, username, gameId, gameName, 60, context)
  }
}

/**
 * 记录有效游戏游玩日志（游玩时长超过1分钟）
 */
export async function logValidGamePlay(
  userId: string, 
  username: string, 
  gameId: string, 
  gameName: string, 
  playDuration: number,
  context?: ClientContextInfo
) {
  try {
    await createLog({
      type: 'GAME_PLAY_VALID',
      message: `用户 ${username} 有效游玩游戏 "${gameName}"（游玩时长: ${Math.floor(playDuration / 60)}分${playDuration % 60}秒）`,
      userId,
      gameId,
      context,
      metadata: {
        username,
        gameName,
        playDuration,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('记录游戏游玩日志失败:', error)
  }
}

/**
 * 记录文件操作日志
 */
export async function logFileOperation(
  userId: string,
  username: string,
  operation: 'UPLOAD' | 'DELETE',
  fileName: string,
  fileType: 'GAME' | 'COVER' | 'OTHER',
  success: boolean,
  context?: ClientContextInfo,
  errorReason?: string,
  fileSize?: number
) {
  try {
    const typeMap = {
      'UPLOAD': success ? 'FILE_UPLOAD' : 'FILE_UPLOAD_FAILED',
      'DELETE': 'FILE_DELETE'
    }
    
    const messageMap = {
      'UPLOAD': success 
        ? `用户 ${username} 成功上传文件 "${fileName}"`
        : `用户 ${username} 上传文件 "${fileName}" 失败${errorReason ? `: ${errorReason}` : ''}`,
      'DELETE': `用户 ${username} 删除文件 "${fileName}"`
    }
    
    await createLog({
      type: typeMap[operation],
      message: messageMap[operation],
      userId: success ? userId : undefined,
      context,
      metadata: {
        username,
        fileName,
        fileType,
        operation,
        success,
        errorReason: success ? undefined : errorReason,
        fileSize,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('记录文件操作日志失败:', error)
  }
}

/**
 * 记录系统错误日志
 */
export async function logSystemError(
  error: Error,
  userId?: string,
  context?: ClientContextInfo,
  additionalInfo?: any
) {
  try {
    await createLog({
      type: 'SYSTEM_ERROR',
      message: `系统错误: ${error.message}`,
      userId,
      context,
      metadata: {
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
        additionalInfo,
        timestamp: new Date().toISOString()
      }
    })
  } catch (logError) {
    console.error('记录系统错误日志失败:', logError)
  }
}

/**
 * 记录安全相关日志
 */
export async function logSecurityEvent(
  eventType: 'UNAUTHORIZED_ACCESS' | 'RATE_LIMIT_EXCEEDED' | 'SUSPICIOUS_ACTIVITY' | 'IP_BLOCKED',
  message: string,
  context?: ClientContextInfo,
  userId?: string,
  additionalInfo?: any
) {
  try {
    const typeMap = {
      'UNAUTHORIZED_ACCESS': 'SECURITY_UNAUTHORIZED_ACCESS',
      'RATE_LIMIT_EXCEEDED': 'SECURITY_RATE_LIMIT_EXCEEDED',
      'SUSPICIOUS_ACTIVITY': 'SECURITY_SUSPICIOUS_ACTIVITY',
      'IP_BLOCKED': 'SECURITY_IP_BLOCKED'
    }
    
    await createLog({
      type: typeMap[eventType],
      message,
      userId,
      context,
      metadata: {
        eventType,
        additionalInfo,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('记录安全事件日志失败:', error)
  }
}

