// 系统设置类型定义（前端）
// 与后端规划保持一致；部分字段暂未在后端实现，UI 先占位。

export type SettingsGroupKey = 'site.basic' | 'account.policy' | 'security.risk' | 'game.policy' | 'email.smtp'

// 1. 基础与品牌
export interface SiteBasicSettings {
  siteName: string
  siteDescription: string
  logoUrl: string | null
  faviconUrl: string | null
  copyright: string
  announcement: {
    enabled: boolean
    content: string
    startAt: string | null
    endAt: string | null
  }
  maintenance: {
    enabled: boolean
    message: string
    whitelistIPs: string[]
  }
}

// 2. 用户与账号策略（精简后与后端 account.policy 对齐）
export interface AccountPolicySettings {
  registration: { enabled: boolean }
  sso: { enabled: boolean }
  password: {
    minLength: number
    maxLength: number
    requireUppercase: boolean
    requireLowercase: boolean
    requireNumber: boolean
    requireSymbol: boolean
    disallowReuse: number
  }
  accountDeletion: { enabled: boolean; coolingDays: number }
}

// 3. 安全与风控
export interface SecurityRiskSettings {
  cors: { allowedOrigins: string[] }
  ip: { blacklist: string[]; whitelist: string[] }
  rateLimit: { enabled: boolean; perIpPerMinute: number; perUserPerMinute: number }
  adminConfirm: { dangerousActions: string[] }
  audit: { recordIp: boolean; recordUserAgent: boolean; maskSensitive: boolean }
  maintenanceMirrorRedirect: string | null
}

// 4. 游戏与内容策略
export interface GamePolicySettings {
  publishFlow: 'DIRECT' | 'REVIEW'
  cover: { maxSizeMB: number; allowedMime: string[]; aspectRatio: string | null }
  package: { maxSizeMB: number; requiredEntry: string }
  playCount: { minDurationSeconds: number; testModeByAdmin: boolean }
  listDefaultSort: 'PLAY_COUNT' | 'ACTIVATION_COUNT' | 'NEWEST'
  activation: { allowRevoke: boolean }
  review: { autoApproveAfterDays: number; requireReviewForUpdate: boolean }
  content: { allowAdultContent: boolean; requireContentRating: boolean; maxTagsPerGame: number }
}

// 5. 邮件与SMTP设置
export interface EmailSmtpSettings {
  enabled: boolean
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
  from: {
    name: string
    address: string
  }
  verification: {
    register: {
      enabled: boolean
      expiryMinutes: number
      subject: string
      htmlTemplate: string
      textTemplate: string
    }
    forgotPassword: {
      enabled: boolean
      expiryMinutes: number
      subject: string
      htmlTemplate: string
      textTemplate: string
    }
  }
  limits: {
    perEmailPerHour: number
    perEmailPerDay: number
    globalPerMinute: number
  }
}

export interface SettingsPayloadMap {
  'site.basic': SiteBasicSettings
  'account.policy': AccountPolicySettings
  'security.risk': SecurityRiskSettings
  'game.policy': GamePolicySettings
  'email.smtp': EmailSmtpSettings
}

// 默认值（前端兜底用；真实默认以后端返回为准）
export const DEFAULT_SITE_BASIC: SiteBasicSettings = {
  siteName: 'LOVEisLOVE',
  siteDescription: '一个专注于文字冒险游戏的个人平台',
  logoUrl: null,
  faviconUrl: null,
  copyright: '© 2025 LOVEisLOVE',
  announcement: { enabled: false, content: '', startAt: null, endAt: null },
  maintenance: { enabled: false, message: '系统维护中，请稍后访问', whitelistIPs: [] }
}

export const DEFAULT_ACCOUNT_POLICY: AccountPolicySettings = {
  registration: { enabled: true },
  sso: { enabled: true },
  password: {
    minLength: 8,
    maxLength: 64,
    requireUppercase: false,
    requireLowercase: true,
    requireNumber: true,
    requireSymbol: false,
    disallowReuse: 3
  },
  accountDeletion: { enabled: false, coolingDays: 7 }
}

export const DEFAULT_SECURITY_RISK: SecurityRiskSettings = {
  cors: { allowedOrigins: ['*'] },
  ip: { blacklist: [], whitelist: [] },
  rateLimit: { enabled: false, perIpPerMinute: 120, perUserPerMinute: 240 },
  adminConfirm: { dangerousActions: ['DELETE_GAME', 'CLEAR_LOG'] },
  audit: { recordIp: true, recordUserAgent: true, maskSensitive: true },
  maintenanceMirrorRedirect: null
}

export const DEFAULT_GAME_POLICY: GamePolicySettings = {
  publishFlow: 'DIRECT',
  cover: { maxSizeMB: 5, allowedMime: ['image/jpeg', 'image/png', 'image/webp'], aspectRatio: '16:9' },
  package: { maxSizeMB: 100, requiredEntry: 'index.html' },
  playCount: { minDurationSeconds: 30, testModeByAdmin: true },
  listDefaultSort: 'PLAY_COUNT',
  activation: { allowRevoke: true },
  review: { autoApproveAfterDays: 7, requireReviewForUpdate: false },
  content: { allowAdultContent: false, requireContentRating: true, maxTagsPerGame: 10 }
}

export const DEFAULT_EMAIL_SMTP: EmailSmtpSettings = {
  enabled: false,
  host: '',
  port: 587,
  secure: false,
  auth: {
    user: '',
    pass: ''
  },
  from: {
    name: 'withU',
    address: ''
  },
  verification: {
    register: {
      enabled: true,
      expiryMinutes: 10,
      subject: '【{{siteName}}】邮箱验证',
      htmlTemplate: `<div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
  <h2 style="color: #333;">邮箱验证</h2>
  <p>您好，</p>
  <p>感谢您注册 {{siteName}}！请使用以下验证码完成邮箱验证：</p>
  <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
    <span style="font-size: 24px; font-weight: bold; color: #007bff; letter-spacing: 4px;">{{code}}</span>
  </div>
  <p>验证码将在 {{expiryMinutes}} 分钟后失效，请尽快验证。</p>
  <p>如果您没有注册过账号，请忽略此邮件。</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
  <p style="color: #666; font-size: 12px;">此邮件由系统自动发送，请勿回复。</p>
</div>`,
      textTemplate: '您好，感谢您注册 {{siteName}}！您的验证码是：{{code}}，将在 {{expiryMinutes}} 分钟后失效。如果您没有注册过账号，请忽略此邮件。'
    },
    forgotPassword: {
      enabled: true,
      expiryMinutes: 30,
      subject: '【{{siteName}}】密码重置',
      htmlTemplate: `<div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
  <h2 style="color: #333;">密码重置</h2>
  <p>您好，</p>
  <p>您请求重置 {{siteName}} 账户的密码。请使用以下验证码：</p>
  <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
    <span style="font-size: 24px; font-weight: bold; color: #dc3545; letter-spacing: 4px;">{{code}}</span>
  </div>
  <p>验证码将在 {{expiryMinutes}} 分钟后失效，请尽快使用。</p>
  <p style="color: #dc3545;"><strong>如果您没有请求重置密码，请立即联系管理员！</strong></p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
  <p style="color: #666; font-size: 12px;">此邮件由系统自动发送，请勿回复。</p>
</div>`,
      textTemplate: '您好，您请求重置 {{siteName}} 账户的密码。您的验证码是：{{code}}，将在 {{expiryMinutes}} 分钟后失效。如果您没有请求重置密码，请立即联系管理员！'
    }
  },
  limits: {
    perEmailPerHour: 5,
    perEmailPerDay: 10,
    globalPerMinute: 50
  }
}
