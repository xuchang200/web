import request from './request'

// 获取公共账号策略（用于注册/找回密码/未登录页面）
export const getPublicAccountPolicy = () => {
  return request<{ success: boolean; data: {
    registration: { enabled: boolean }
    sso: { enabled: boolean }
    password: { minLength: number; maxLength: number; requireUppercase: boolean; requireLowercase: boolean; requireNumber: boolean; requireSymbol: boolean }
    accountDeletion: { enabled: boolean; coolingDays: number }
  } }>({ url: '/public/settings/account-policy', method: 'get' })
}