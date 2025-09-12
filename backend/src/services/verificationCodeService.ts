import redis, { REDIS_KEYS } from '../config/redis'
import { getSettings } from '../services/settings/settingsService'
import { createLog } from '../services/logService'

export type VerificationCodeType = 'REGISTER' | 'FORGOT_PASSWORD'

export interface VerificationCodeData {
  code: string
  email: string
  type: VerificationCodeType
  createdAt: number
  expiresAt: number
}

/**
 * 生成6位数字验证码
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * 检查邮件发送频率限制
 */
export async function checkEmailSendLimits(email: string, type: VerificationCodeType): Promise<void> {
  const settings = await getSettings('email.smtp')
  
  if (!settings.enabled) {
    throw new Error('邮件服务未启用')
  }
  
  const now = Date.now()
  const currentHour = Math.floor(now / (1000 * 60 * 60))
  const currentDay = Math.floor(now / (1000 * 60 * 60 * 24))
  const currentMinute = Math.floor(now / (1000 * 60))
  
  // 检查每邮箱每小时限制
  const hourKey = `${REDIS_KEYS.EMAIL_SEND_LIMIT(email, type)}:hour:${currentHour}`
  const hourCount = await redis.get(hourKey)
  if (hourCount && parseInt(hourCount) >= settings.limits.perEmailPerHour) {
    throw new Error(`每小时最多发送${settings.limits.perEmailPerHour}封邮件，请稍后再试`)
  }
  
  // 检查每邮箱每天限制
  const dayKey = `${REDIS_KEYS.EMAIL_SEND_LIMIT(email, type)}:day:${currentDay}`
  const dayCount = await redis.get(dayKey)
  if (dayCount && parseInt(dayCount) >= settings.limits.perEmailPerDay) {
    throw new Error(`每天最多发送${settings.limits.perEmailPerDay}封邮件，请明天再试`)
  }
  
  // 检查全局每分钟限制
  const globalKey = REDIS_KEYS.EMAIL_GLOBAL_LIMIT(currentMinute.toString())
  const globalCount = await redis.get(globalKey)
  if (globalCount && parseInt(globalCount) >= settings.limits.globalPerMinute) {
    throw new Error('系统繁忙，请稍后再试')
  }
}

/**
 * 增加邮件发送计数
 */
export async function incrementEmailSendCount(email: string, type: VerificationCodeType): Promise<void> {
  const now = Date.now()
  const currentHour = Math.floor(now / (1000 * 60 * 60))
  const currentDay = Math.floor(now / (1000 * 60 * 60 * 24))
  const currentMinute = Math.floor(now / (1000 * 60))
  
  // 增加每邮箱每小时计数
  const hourKey = `${REDIS_KEYS.EMAIL_SEND_LIMIT(email, type)}:hour:${currentHour}`
  await redis.incr(hourKey)
  await redis.expire(hourKey, 3600) // 1小时过期
  
  // 增加每邮箱每天计数
  const dayKey = `${REDIS_KEYS.EMAIL_SEND_LIMIT(email, type)}:day:${currentDay}`
  await redis.incr(dayKey)
  await redis.expire(dayKey, 86400) // 1天过期
  
  // 增加全局每分钟计数
  const globalKey = REDIS_KEYS.EMAIL_GLOBAL_LIMIT(currentMinute.toString())
  await redis.incr(globalKey)
  await redis.expire(globalKey, 60) // 1分钟过期
}

/**
 * 存储验证码到Redis
 */
export async function storeVerificationCode(
  email: string, 
  type: VerificationCodeType, 
  code: string,
  expiryMinutes: number
): Promise<void> {
  const now = Date.now()
  const expiresAt = now + (expiryMinutes * 60 * 1000)
  
  const data: VerificationCodeData = {
    code,
    email,
    type,
    createdAt: now,
    expiresAt
  }
  
  const key = REDIS_KEYS.EMAIL_VERIFICATION_CODE(email, type)
  await redis.setEx(key, expiryMinutes * 60, JSON.stringify(data))
  
  await createLog({
    type: 'SYSTEM_WARNING',
    message: `验证码已生成`,
    metadata: { 
      email, 
      type, 
      expiryMinutes,
      // 不记录验证码内容到日志中
    }
  })
}

/**
 * 验证验证码
 */
export async function verifyVerificationCode(
  email: string, 
  type: VerificationCodeType, 
  inputCode: string
): Promise<boolean> {
  const key = REDIS_KEYS.EMAIL_VERIFICATION_CODE(email, type)
  const dataStr = await redis.get(key)
  
  if (!dataStr) {
    await createLog({
      type: 'SECURITY_SUSPICIOUS_ACTIVITY',
      message: `尝试使用不存在或已过期的验证码`,
      metadata: { email, type }
    })
    return false
  }
  
  try {
    const data: VerificationCodeData = JSON.parse(dataStr)
    const now = Date.now()
    
    // 检查是否过期
    if (now > data.expiresAt) {
      await redis.del(key) // 清除过期验证码
      await createLog({
        type: 'SECURITY_SUSPICIOUS_ACTIVITY',
        message: `尝试使用已过期的验证码`,
        metadata: { email, type }
      })
      return false
    }
    
    // 验证码匹配
    if (data.code === inputCode) {
      await redis.del(key) // 验证成功后立即删除验证码
      await createLog({
        type: 'USER_LOGIN',
        message: `验证码验证成功并已消费`,
        metadata: { email, type }
      })
      return true
    } else {
      await createLog({
        type: 'SECURITY_SUSPICIOUS_ACTIVITY',
        message: `验证码验证失败`,
        metadata: { email, type }
      })
      return false
    }
  } catch (e) {
    await createLog({
      type: 'SECURITY_SUSPICIOUS_ACTIVITY',
      message: `验证码数据解析失败`,
      metadata: { email, type }
    })
    return false
  }
}

/**
 * 验证验证码但不删除（用于预验证）
 */
export async function checkVerificationCodeOnly(
  email: string, 
  type: VerificationCodeType, 
  inputCode: string
): Promise<boolean> {
  const key = REDIS_KEYS.EMAIL_VERIFICATION_CODE(email, type)
  const dataStr = await redis.get(key)
  
  if (!dataStr) {
    await createLog({
      type: 'SECURITY_SUSPICIOUS_ACTIVITY',
      message: `尝试使用不存在或已过期的验证码`,
      metadata: { email, type }
    })
    return false
  }
  
  try {
    const data: VerificationCodeData = JSON.parse(dataStr)
    const now = Date.now()
    
    // 检查是否过期
    if (now > data.expiresAt) {
      await redis.del(key) // 清除过期验证码
      await createLog({
        type: 'SECURITY_SUSPICIOUS_ACTIVITY',
        message: `尝试使用已过期的验证码`,
        metadata: { email, type }
      })
      return false
    }
    
    // 验证码匹配（但不删除）
    if (data.code === inputCode) {
      await createLog({
        type: 'USER_LOGIN',
        message: `验证码预验证成功`,
        metadata: { email, type }
      })
      return true
    } else {
      await createLog({
        type: 'SECURITY_SUSPICIOUS_ACTIVITY',
        message: `验证码预验证失败`,
        metadata: { email, type }
      })
      return false
    }
  } catch (e) {
    await createLog({
      type: 'SECURITY_SUSPICIOUS_ACTIVITY',
      message: `验证码数据解析失败`,
      metadata: { email, type }
    })
    return false
  }
}

/**
 * 删除验证码（在成功使用后调用）
 */
export async function consumeVerificationCode(
  email: string, 
  type: VerificationCodeType
): Promise<void> {
  const key = REDIS_KEYS.EMAIL_VERIFICATION_CODE(email, type)
  await redis.del(key)
  
  await createLog({
    type: 'USER_LOGIN',
    message: `验证码已被消费`,
    metadata: { email, type }
  })
}

/**
 * 清除指定邮箱和类型的验证码
 */
export async function clearVerificationCode(email: string, type: VerificationCodeType): Promise<void> {
  const key = REDIS_KEYS.EMAIL_VERIFICATION_CODE(email, type)
  await redis.del(key)
}

/**
 * 获取验证码剩余时间（秒）
 */
export async function getVerificationCodeTTL(email: string, type: VerificationCodeType): Promise<number> {
  const key = REDIS_KEYS.EMAIL_VERIFICATION_CODE(email, type)
  return await redis.ttl(key)
}

/**
 * 检查是否存在有效验证码
 */
export async function hasValidVerificationCode(email: string, type: VerificationCodeType): Promise<boolean> {
  const ttl = await getVerificationCodeTTL(email, type)
  return ttl > 0
}