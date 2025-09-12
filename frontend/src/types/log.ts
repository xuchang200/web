export interface Log {
  id: string
  message: string
  createdAt: string
  type: LogType
  userId?: string
  gameId?: string
  activationCodeId?: string
  targetUserId?: string
  ip?: string
  userAgent?: string
  metadata?: Record<string, unknown> | null
  user?: {
    id: string
    username: string
    email: string
  }
  game?: {
    id: string
    name: string
  }
  activationCode?: {
    id: string
    code: string
  }
  targetUser?: {
    id: string
    username: string
    email: string
  }
}

export const LogType = {
  // 用户相关操作
  USER_REGISTER: 'USER_REGISTER',
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGIN_FAILED: 'USER_LOGIN_FAILED',
  USER_LOGOUT: 'USER_LOGOUT',
  USER_PASSWORD_CHANGE: 'USER_PASSWORD_CHANGE',
  USER_PROFILE_UPDATE: 'USER_PROFILE_UPDATE',
  USER_ACCOUNT_DELETE_REQUEST: 'USER_ACCOUNT_DELETE_REQUEST',
  USER_ACCOUNT_DELETE_CANCEL: 'USER_ACCOUNT_DELETE_CANCEL',
  USER_ACCOUNT_DELETED: 'USER_ACCOUNT_DELETED',
  
  // 游戏相关操作
  GAME_ACTIVATION: 'GAME_ACTIVATION',
  GAME_ACTIVATION_FAILED: 'GAME_ACTIVATION_FAILED',
  GAME_PLAY_VALID: 'GAME_PLAY_VALID',
  
  // 激活码相关操作
  CODE_ACTIVATION_SUCCESS: 'CODE_ACTIVATION_SUCCESS',
  CODE_ACTIVATION_FAILED: 'CODE_ACTIVATION_FAILED',
  CODE_ALREADY_USED: 'CODE_ALREADY_USED',
  CODE_NOT_FOUND: 'CODE_NOT_FOUND',
  CODE_EXPIRED: 'CODE_EXPIRED',
  
  // 文件操作
  FILE_UPLOAD: 'FILE_UPLOAD',
  FILE_UPLOAD_FAILED: 'FILE_UPLOAD_FAILED',
  FILE_DELETE: 'FILE_DELETE',
  
  // 管理员操作
  ADMIN_USER_CREATE: 'ADMIN_USER_CREATE',
  ADMIN_USER_UPDATE: 'ADMIN_USER_UPDATE',
  ADMIN_USER_DELETE: 'ADMIN_USER_DELETE',
  ADMIN_GAME_CREATE: 'ADMIN_GAME_CREATE',
  ADMIN_GAME_UPDATE: 'ADMIN_GAME_UPDATE',
  ADMIN_GAME_DELETE: 'ADMIN_GAME_DELETE',
  ADMIN_CODE_CREATE: 'ADMIN_CODE_CREATE',
  ADMIN_CODE_UPDATE: 'ADMIN_CODE_UPDATE',
  ADMIN_CODE_DELETE: 'ADMIN_CODE_DELETE',
  ADMIN_SETTINGS_UPDATE: 'ADMIN_SETTINGS_UPDATE',
  ADMIN_LOGIN: 'ADMIN_LOGIN',
  ADMIN_LOGOUT: 'ADMIN_LOGOUT',
  
  // 系统操作
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  SYSTEM_WARNING: 'SYSTEM_WARNING',
  SYSTEM_MAINTENANCE_START: 'SYSTEM_MAINTENANCE_START',
  SYSTEM_MAINTENANCE_END: 'SYSTEM_MAINTENANCE_END',
  
  // 安全相关操作
  SECURITY_UNAUTHORIZED_ACCESS: 'SECURITY_UNAUTHORIZED_ACCESS',
  SECURITY_RATE_LIMIT_EXCEEDED: 'SECURITY_RATE_LIMIT_EXCEEDED',
  SECURITY_SUSPICIOUS_ACTIVITY: 'SECURITY_SUSPICIOUS_ACTIVITY',
  SECURITY_IP_BLOCKED: 'SECURITY_IP_BLOCKED'
} as const

export type LogType = typeof LogType[keyof typeof LogType]

export interface LogQuery {
  page?: number
  pageSize?: number
  type?: LogType
  userId?: string
  gameId?: string
  startDate?: string
  endDate?: string
  search?: string
}

export interface LogResponse {
  data: Log[]
  total: number
  page: number
  pageSize: number
}