import request from './request'

// 网站设置接口（精简后）
export interface SiteSettings {
  siteName: string
  siteDescription: string
  adminEmail: string
  allowRegistration: boolean
}

// 获取网站设置
export const getSiteSettings = () => {
  return request<SiteSettings>({ url: '/admin/settings/site', method: 'GET' })
}

// 更新网站设置
export const updateSiteSettings = (settings: SiteSettings) => {
  return request({ url: '/admin/settings/site', method: 'PUT', data: settings })
}

// 获取公共账号策略（无需管理员权限）
export const getPublicAccountPolicy = () => {
  return request<{ success: boolean; data: any }>({ url: '/public/settings/account-policy', method: 'GET' })
}

// 新的多组系统设置 API （后端实现后可切换使用）
export const getSettingsGroup = <T=any>(groupKey: string) => {
  return request<{ success: boolean; data: T }>({ url: `/admin/settings/${groupKey}`, method: 'GET' })
}

export const patchSettingsGroup = <T=any>(groupKey: string, patch: Partial<T>) => {
  return request<{ success: boolean; message: string }>({ url: `/admin/settings/${groupKey}`, method: 'PATCH', data: patch })
}

export const putSettingsGroup = <T=any>(groupKey: string, value: T) => {
  return request<{ success: boolean; message: string }>({ url: `/admin/settings/${groupKey}`, method: 'PUT', data: value })
}

export const batchGetSettings = (groups: string[]) => {
  return request<{ success: boolean; data: Record<string, any> }>({ url: `/admin/settings`, method: 'GET', params: { groups: groups.join(',') } })
}

export const resetSettingsGroup = (groupKey: string) => {
  return request<{ success: boolean; message: string }>({ url: `/admin/settings/${groupKey}/reset`, method: 'POST' })
}

// 邮件SMTP设置相关API
export const getEmailSmtpSettings = () => {
  return request<{ success: boolean; data: any }>({ url: '/admin/email-smtp', method: 'GET' })
}

export const updateEmailSmtpSettings = (settings: any) => {
  return request<{ success: boolean; message: string; data: any }>({ url: '/admin/email-smtp', method: 'PATCH', data: settings })
}

export const testSmtpConnection = () => {
  // SMTP连接测试需要更长的超时时间
  return request<{ success: boolean; message: string }>({ 
    url: '/admin/email-smtp/test-connection', 
    method: 'POST',
    timeout: 15000 // 15秒超时
  })
}

export const sendTestEmail = (to: string) => {
  return request<{ success: boolean; message: string }>({ url: '/admin/email-smtp/test-send', method: 'POST', data: { to } })
}

