import { createLog } from './logService'

// 记录系统错误
export const logSystemError = async (error: Error, context?: any) => {
  try {
    await createLog({
      type: 'SYSTEM_ERROR',
      message: `系统错误: ${error.message}`,
      metadata: {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        context,
        timestamp: new Date().toISOString()
      }
    })
  } catch (logError) {
    console.error('Failed to log system error:', logError)
  }
}

// 记录系统警告
export const logSystemWarning = async (message: string, metadata?: any) => {
  try {
    await createLog({
      type: 'SYSTEM_WARNING',
      message: `系统警告: ${message}`,
      metadata: {
        warning: message,
        ...metadata,
        timestamp: new Date().toISOString()
      }
    })
  } catch (logError) {
    console.error('Failed to log system warning:', logError)
  }
}

// 记录维护模式开始
export const logMaintenanceStart = async (adminId?: string, reason?: string) => {
  try {
    await createLog({
      type: 'SYSTEM_MAINTENANCE_START',
      message: `系统维护模式开始${reason ? `: ${reason}` : ''}`,
      userId: adminId,
      metadata: {
        reason,
        startTime: new Date().toISOString(),
        initiatedBy: adminId ? 'admin' : 'system'
      }
    })
  } catch (logError) {
    console.error('Failed to log maintenance start:', logError)
  }
}

// 记录维护模式结束
export const logMaintenanceEnd = async (adminId?: string, duration?: number) => {
  try {
    await createLog({
      type: 'SYSTEM_MAINTENANCE_END',
      message: `系统维护模式结束${duration ? ` (持续 ${Math.round(duration / 1000)} 秒)` : ''}`,
      userId: adminId,
      metadata: {
        endTime: new Date().toISOString(),
        duration,
        terminatedBy: adminId ? 'admin' : 'system'
      }
    })
  } catch (logError) {
    console.error('Failed to log maintenance end:', logError)
  }
}
