import { PrismaClient } from '@prisma/client'
import { mergeWithDefaultSiteBasic, DEFAULT_SITE_BASIC, SiteBasicSettings, DEFAULT_ACCOUNT_POLICY, mergeWithDefaultAccountPolicy, AccountPolicySettings, DEFAULT_SECURITY_RISK, mergeWithDefaultSecurityRisk, SecurityRiskSettings, DEFAULT_GAME_POLICY, mergeWithDefaultGamePolicy, GamePolicySettings, DEFAULT_EMAIL_SMTP, mergeWithDefaultEmailSmtp, EmailSmtpSettings } from './defaults'
import { createLog } from '../logService'

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true
  if (typeof a !== typeof b) return false
  if (a && b && typeof a === 'object') {
    if (Array.isArray(a) !== Array.isArray(b)) return false
    if (Array.isArray(a)) {
      if (a.length !== b.length) return false
      for (let i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false
      return true
    }
    const keys = Object.keys(a)
    if (keys.length !== Object.keys(b).length) return false
    for (const k of keys) if (!deepEqual(a[k], b[k])) return false
    return true
  }
  return false
}

export type SettingsGroupKey = 'site.basic' | 'account.policy' | 'security.risk' | 'game.policy' | 'email.smtp'

const defaultMap: Record<SettingsGroupKey, any> = {
  'site.basic': DEFAULT_SITE_BASIC,
  'account.policy': DEFAULT_ACCOUNT_POLICY,
  'security.risk': DEFAULT_SECURITY_RISK,
  'game.policy': DEFAULT_GAME_POLICY,
  'email.smtp': DEFAULT_EMAIL_SMTP
}

const prisma = new PrismaClient()

const memoryCache = new Map<string, any>()

function applyDefault(key: SettingsGroupKey, value: any) {
  if (key === 'site.basic') return mergeWithDefaultSiteBasic(value)
  if (key === 'account.policy') return mergeWithDefaultAccountPolicy(value)
  if (key === 'security.risk') return mergeWithDefaultSecurityRisk(value)
  if (key === 'game.policy') return mergeWithDefaultGamePolicy(value)
  if (key === 'email.smtp') return mergeWithDefaultEmailSmtp(value)
  return value
}

export async function getSettings<T=any>(key: SettingsGroupKey): Promise<T> {
  if (memoryCache.has(key)) return memoryCache.get(key)
  const row = await prisma.systemSettings.findUnique({ where: { key } })
  const val = row ? applyDefault(key, row.value) : defaultMap[key]
  memoryCache.set(key, val)
  return val as T
}

function validateSiteBasic(value: any): SiteBasicSettings {
  const v = mergeWithDefaultSiteBasic(value)
  if (!v.siteName || typeof v.siteName !== 'string' || v.siteName.length > 60) throw new Error('站点名称不合法')
  if (!v.siteDescription || typeof v.siteDescription !== 'string' || v.siteDescription.length > 300) throw new Error('站点描述不合法')
  if (!v.announcement || typeof v.announcement !== 'object') throw new Error('公告结构错误')
  if (typeof v.announcement.content !== 'string') throw new Error('公告内容不合法')
  if (!v.maintenance || typeof v.maintenance !== 'object') throw new Error('维护结构错误')
  if (typeof v.maintenance.message !== 'string' || v.maintenance.message.length > 300) throw new Error('维护提示不合法')
  return v
}

function validateAccountPolicy(value: any): AccountPolicySettings {
  const v = mergeWithDefaultAccountPolicy(value)
  // 基础校验
  if (v.password.minLength < 4 || v.password.minLength > 64) throw new Error('密码最小长度不合法')
  if (v.password.maxLength < v.password.minLength || v.password.maxLength > 128) throw new Error('密码最大长度不合法')
  if (v.accountDeletion.coolingDays < 0 || v.accountDeletion.coolingDays > 90) throw new Error('冷静期天数超出范围')
  return v
}

function validateSecurityRisk(value: any): SecurityRiskSettings {
  const v = mergeWithDefaultSecurityRisk(value)
  // 允许 * 以及 http(s):// 前缀域名（简单校验）
  if (!Array.isArray(v.cors.allowedOrigins)) throw new Error('CORS 白名单必须为数组')
  if (v.cors.allowedOrigins.some(o => typeof o !== 'string' || o.length === 0)) throw new Error('CORS 白名单包含非法项')
  if (!Array.isArray(v.ip.blacklist) || !Array.isArray(v.ip.whitelist)) throw new Error('IP 列表必须为数组')
  if (typeof v.rateLimit.perIpPerMinute !== 'number' || v.rateLimit.perIpPerMinute <= 0) throw new Error('perIpPerMinute 非法')
  if (typeof v.rateLimit.perUserPerMinute !== 'number' || v.rateLimit.perUserPerMinute <= 0) throw new Error('perUserPerMinute 非法')
  return v
}

function validateGamePolicy(value: any): GamePolicySettings {
  const v = mergeWithDefaultGamePolicy(value)
  if (!['DIRECT', 'REVIEW'].includes(v.publishFlow)) throw new Error('发布流程类型不合法')
  if (typeof v.cover.maxSizeMB !== 'number' || v.cover.maxSizeMB < 1 || v.cover.maxSizeMB > 20) throw new Error('封面大小限制不合法')
  if (!Array.isArray(v.cover.allowedMime) || v.cover.allowedMime.length === 0) throw new Error('允许的MIME类型必须为非空数组')
  if (typeof v.package.maxSizeMB !== 'number' || v.package.maxSizeMB < 10 || v.package.maxSizeMB > 1000) throw new Error('游戏包大小限制不合法')
  if (!v.package.requiredEntry || typeof v.package.requiredEntry !== 'string') throw new Error('入口文件名不能为空')
  if (typeof v.playCount.minDurationSeconds !== 'number' || v.playCount.minDurationSeconds < 5 || v.playCount.minDurationSeconds > 3600) throw new Error('有效播放时长不合法')
  if (!['PLAY_COUNT', 'ACTIVATION_COUNT', 'NEWEST'].includes(v.listDefaultSort)) throw new Error('默认排序方式不合法')
  if (typeof v.review.autoApproveAfterDays !== 'number' || v.review.autoApproveAfterDays < 1 || v.review.autoApproveAfterDays > 30) throw new Error('自动审核天数不合法')
  if (typeof v.content.maxTagsPerGame !== 'number' || v.content.maxTagsPerGame < 1 || v.content.maxTagsPerGame > 50) throw new Error('最大标签数不合法')
  return v
}

function validateEmailSmtp(value: any): EmailSmtpSettings {
  const v = mergeWithDefaultEmailSmtp(value)
  
  // 基础SMTP设置验证
  if (v.enabled) {
    if (!v.host || typeof v.host !== 'string' || v.host.length === 0) throw new Error('SMTP服务器地址不能为空')
    if (typeof v.port !== 'number' || v.port < 1 || v.port > 65535) throw new Error('SMTP端口不合法')
    if (!v.auth.user || typeof v.auth.user !== 'string' || v.auth.user.length === 0) throw new Error('SMTP用户名不能为空')
    if (!v.auth.pass || typeof v.auth.pass !== 'string' || v.auth.pass.length === 0) throw new Error('SMTP密码不能为空')
    if (!v.from.address || typeof v.from.address !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.from.address)) throw new Error('发件人邮箱格式不正确')
    if (!v.from.name || typeof v.from.name !== 'string' || v.from.name.length === 0) throw new Error('发件人名称不能为空')
  }
  
  // 验证码有效期验证
  if (typeof v.verification.register.expiryMinutes !== 'number' || v.verification.register.expiryMinutes < 1 || v.verification.register.expiryMinutes > 60) {
    throw new Error('注册验证码有效期需在1-60分钟之间')
  }
  if (typeof v.verification.forgotPassword.expiryMinutes !== 'number' || v.verification.forgotPassword.expiryMinutes < 1 || v.verification.forgotPassword.expiryMinutes > 120) {
    throw new Error('找回密码验证码有效期需在1-120分钟之间')
  }
  
  // 邮件主题验证
  if (!v.verification.register.subject || typeof v.verification.register.subject !== 'string' || v.verification.register.subject.length > 200) {
    throw new Error('注册邮件主题不合法')
  }
  if (!v.verification.forgotPassword.subject || typeof v.verification.forgotPassword.subject !== 'string' || v.verification.forgotPassword.subject.length > 200) {
    throw new Error('找回密码邮件主题不合法')
  }
  
  // 邮件模板验证
  if (!v.verification.register.htmlTemplate || typeof v.verification.register.htmlTemplate !== 'string') {
    throw new Error('注册邮件HTML模板不能为空')
  }
  if (!v.verification.forgotPassword.htmlTemplate || typeof v.verification.forgotPassword.htmlTemplate !== 'string') {
    throw new Error('找回密码邮件HTML模板不能为空')
  }
  
  // 发送限制验证
  if (typeof v.limits.perEmailPerHour !== 'number' || v.limits.perEmailPerHour < 1 || v.limits.perEmailPerHour > 100) {
    throw new Error('每邮箱每小时发送限制不合法（1-100）')
  }
  if (typeof v.limits.perEmailPerDay !== 'number' || v.limits.perEmailPerDay < 1 || v.limits.perEmailPerDay > 500) {
    throw new Error('每邮箱每天发送限制不合法（1-500）')
  }
  if (typeof v.limits.globalPerMinute !== 'number' || v.limits.globalPerMinute < 1 || v.limits.globalPerMinute > 1000) {
    throw new Error('全局每分钟发送限制不合法（1-1000）')
  }
  
  return v
}

function calcDiff(before: any, after: any, pathPrefix = ''): Record<string, { before: any; after: any }> {
  const diff: Record<string, { before: any; after: any }> = {}
  const keys = new Set<string>([...Object.keys(before || {}), ...Object.keys(after || {})])
  for (const k of keys) {
    const path = pathPrefix ? `${pathPrefix}.${k}` : k
    const b = before?.[k]
    const a = after?.[k]
    if (typeof b === 'object' && b && typeof a === 'object' && a && !Array.isArray(b) && !Array.isArray(a)) {
      const nested = calcDiff(b, a, path)
      Object.assign(diff, nested)
    } else if (!deepEqual(b, a)) {
      diff[path] = { before: b, after: a }
    }
  }
  return diff
}

export async function updateSettings(key: SettingsGroupKey, data: any, operatorId?: string) {
  let parsed: any
  if (key === 'site.basic') parsed = validateSiteBasic(data)
  else if (key === 'account.policy') parsed = validateAccountPolicy(data)
  else if (key === 'security.risk') parsed = validateSecurityRisk(data)
  else if (key === 'game.policy') parsed = validateGamePolicy(data)
  else if (key === 'email.smtp') parsed = validateEmailSmtp(data)

  const existingRow = await prisma.systemSettings.findUnique({ where: { key } })
  const beforeVal = existingRow ? applyDefault(key, existingRow.value) : defaultMap[key]

  await prisma.systemSettings.upsert({
    where: { key },
    update: { value: parsed },
    create: { key, value: parsed }
  })
  memoryCache.set(key, parsed)

  const diff = calcDiff(beforeVal, parsed)
  const changedCount = Object.keys(diff).length
  if (changedCount > 0) {
    await createLog({
      type: 'ADMIN_SETTINGS_UPDATE',
      message: `管理员更新了设置: ${key} (${changedCount} 个字段已更改)`,
      userId: operatorId,
      metadata: { key, diff }
    })

    // 特殊处理：维护模式切换日志
    if (key === 'site.basic' && diff['maintenance.enabled']) {
      const { logMaintenanceStart, logMaintenanceEnd } = await import('../systemLogService')
      const wasEnabled = diff['maintenance.enabled'].before
      const isEnabled = diff['maintenance.enabled'].after
      
      if (!wasEnabled && isEnabled) {
        // 维护模式开启
        await logMaintenanceStart(operatorId, parsed.maintenance?.message)
      } else if (wasEnabled && !isEnabled) {
        // 维护模式关闭
        await logMaintenanceEnd(operatorId)
      }
    }
  }
  return parsed
}
