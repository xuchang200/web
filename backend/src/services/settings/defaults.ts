export const DEFAULT_SITE_BASIC = {
  siteName: 'withU',
  siteDescription: '一个专注于文字冒险游戏的个人平台',
  copyright: '© 2025 withU',
  logoUrl: '',
  faviconUrl: '',
  announcement: {
    enabled: false,
    content: '',
    startAt: null as string | null,
    endAt: null as string | null
  },
  maintenance: {
    enabled: false,
    message: '系统维护中，请稍后访问',
    whitelistIPs: [] as string[]
  }
}

export type SiteBasicSettings = typeof DEFAULT_SITE_BASIC

export function mergeWithDefaultSiteBasic(partial: any): SiteBasicSettings {
  return {
    ...DEFAULT_SITE_BASIC,
    ...(partial || {}),
    announcement: {
      ...DEFAULT_SITE_BASIC.announcement,
      ...(partial?.announcement || {})
    },
    maintenance: {
      ...DEFAULT_SITE_BASIC.maintenance,
      ...(partial?.maintenance || {})
    }
  }
}

// 账号/用户策略默认值
export const DEFAULT_ACCOUNT_POLICY = {
  registration: {
    enabled: true // 是否允许新用户注册
  },
  sso: {
    enabled: true // 是否启用单点登录（强制单会话）
  },
  password: {
    minLength: 8,
    maxLength: 64,
    requireUppercase: false,
    requireLowercase: true,
    requireNumber: true,
    requireSymbol: false,
  disallowReuse: 3, // 不允许与最近 N 条历史相同
  historyKeep: 10 // 保留最近多少条历史（>= disallowReuse）
  },
  accountDeletion: {
    enabled: true,
    coolingDays: 7 // 冷静期天数，到期后物理删除
  }
}

export type AccountPolicySettings = typeof DEFAULT_ACCOUNT_POLICY

export function mergeWithDefaultAccountPolicy(partial: any): AccountPolicySettings {
  return {
    ...DEFAULT_ACCOUNT_POLICY,
    ...(partial || {}),
    registration: { ...DEFAULT_ACCOUNT_POLICY.registration, ...(partial?.registration || {}) },
    sso: { ...DEFAULT_ACCOUNT_POLICY.sso, ...(partial?.sso || {}) },
    password: { ...DEFAULT_ACCOUNT_POLICY.password, ...(partial?.password || {}) },
    accountDeletion: { ...DEFAULT_ACCOUNT_POLICY.accountDeletion, ...(partial?.accountDeletion || {}) }
  }
}

// 安全与风控（security.risk）默认值
export const DEFAULT_SECURITY_RISK = {
  cors: {
    allowedOrigins: ['*'] as string[]
  },
  ip: {
    blacklist: [] as string[],
    whitelist: [] as string[]
  },
  rateLimit: {
    enabled: false,
    perIpPerMinute: 120,
    perUserPerMinute: 240
  },
  adminConfirm: {
    dangerousActions: ['DELETE_GAME', 'CLEAR_LOG'] as string[]
  },
  audit: {
    recordIp: true,
    recordUserAgent: true,
    maskSensitive: true
  },
  maintenanceMirrorRedirect: null as string | null
}

export type SecurityRiskSettings = typeof DEFAULT_SECURITY_RISK

export function mergeWithDefaultSecurityRisk(partial: any): SecurityRiskSettings {
  return {
    ...DEFAULT_SECURITY_RISK,
    ...(partial || {}),
    cors: { ...DEFAULT_SECURITY_RISK.cors, ...(partial?.cors || {}) },
    ip: { ...DEFAULT_SECURITY_RISK.ip, ...(partial?.ip || {}) },
    rateLimit: { ...DEFAULT_SECURITY_RISK.rateLimit, ...(partial?.rateLimit || {}) },
    adminConfirm: { ...DEFAULT_SECURITY_RISK.adminConfirm, ...(partial?.adminConfirm || {}) },
    audit: { ...DEFAULT_SECURITY_RISK.audit, ...(partial?.audit || {}) }
  }
}

// 游戏与内容策略（game.policy）默认值
export const DEFAULT_GAME_POLICY = {
  publishFlow: 'DIRECT' as 'DIRECT' | 'REVIEW', // 发布流程：直接发布或需要审核
  cover: {
    maxSizeMB: 5, // 封面最大大小（MB）
    allowedMime: ['image/jpeg', 'image/png', 'image/webp'] as string[], // 允许的MIME类型
    aspectRatio: '16:9' as string | null // 推荐宽高比
  },
  package: {
    maxSizeMB: 100, // 游戏包最大大小（MB）
    requiredEntry: 'index.html' // 必需的入口文件名
  },
  playCount: {
    minDurationSeconds: 30, // 有效播放的最小时长（秒）
    testModeByAdmin: true // 管理员测试时不计入播放次数
  },
  listDefaultSort: 'PLAY_COUNT' as 'PLAY_COUNT' | 'ACTIVATION_COUNT' | 'NEWEST', // 列表默认排序方式
  activation: {
    allowRevoke: true // 是否允许撤销激活
  },
  review: {
    autoApproveAfterDays: 7, // 自动批准的天数（如果无人审核）
    requireReviewForUpdate: false // 游戏更新是否需要重新审核
  },
  content: {
    allowAdultContent: false, // 是否允许成人内容
    requireContentRating: true, // 是否要求内容分级
    maxTagsPerGame: 10 // 每个游戏最多标签数
  }
}

export type GamePolicySettings = typeof DEFAULT_GAME_POLICY

export function mergeWithDefaultGamePolicy(partial: any): GamePolicySettings {
  return {
    ...DEFAULT_GAME_POLICY,
    ...(partial || {}),
    cover: { ...DEFAULT_GAME_POLICY.cover, ...(partial?.cover || {}) },
    package: { ...DEFAULT_GAME_POLICY.package, ...(partial?.package || {}) },
    playCount: { ...DEFAULT_GAME_POLICY.playCount, ...(partial?.playCount || {}) },
    activation: { ...DEFAULT_GAME_POLICY.activation, ...(partial?.activation || {}) },
    review: { ...DEFAULT_GAME_POLICY.review, ...(partial?.review || {}) },
    content: { ...DEFAULT_GAME_POLICY.content, ...(partial?.content || {}) }
  }
}

// SMTP 和邮件设置默认值
export const DEFAULT_EMAIL_SMTP = {
  enabled: false,
  host: '',
  port: 587,
  secure: false, // true for 465, false for other ports
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
      expiryMinutes: 10, // 注册验证码有效期（分钟）
      subject: '【{{siteName}}】邮箱验证',
      htmlTemplate: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
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
        </div>
      `,
      textTemplate: '您好，感谢您注册 {{siteName}}！您的验证码是：{{code}}，将在 {{expiryMinutes}} 分钟后失效。如果您没有注册过账号，请忽略此邮件。'
    },
    forgotPassword: {
      enabled: true,
      expiryMinutes: 30, // 找回密码验证码有效期（分钟）
      subject: '【{{siteName}}】密码重置',
      htmlTemplate: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
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
        </div>
      `,
      textTemplate: '您好，您请求重置 {{siteName}} 账户的密码。您的验证码是：{{code}}，将在 {{expiryMinutes}} 分钟后失效。如果您没有请求重置密码，请立即联系管理员！'
    }
  },
  limits: {
    perEmailPerHour: 5, // 每个邮箱每小时最多发送次数
    perEmailPerDay: 10,  // 每个邮箱每天最多发送次数
    globalPerMinute: 50  // 全局每分钟最多发送次数
  }
}

export type EmailSmtpSettings = typeof DEFAULT_EMAIL_SMTP

export function mergeWithDefaultEmailSmtp(partial: any): EmailSmtpSettings {
  return {
    ...DEFAULT_EMAIL_SMTP,
    ...(partial || {}),
    auth: { ...DEFAULT_EMAIL_SMTP.auth, ...(partial?.auth || {}) },
    from: { ...DEFAULT_EMAIL_SMTP.from, ...(partial?.from || {}) },
    verification: {
      register: { ...DEFAULT_EMAIL_SMTP.verification.register, ...(partial?.verification?.register || {}) },
      forgotPassword: { ...DEFAULT_EMAIL_SMTP.verification.forgotPassword, ...(partial?.verification?.forgotPassword || {}) }
    },
    limits: { ...DEFAULT_EMAIL_SMTP.limits, ...(partial?.limits || {}) }
  }
}
