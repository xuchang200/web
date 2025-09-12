import request from './request'

// 发送注册验证码
export const sendRegisterVerificationCode = (email: string) => {
  return request<{ success: boolean; message: string; data?: { messageId: string } }>({
    url: '/verification/send-register-code',
    method: 'POST',
    data: { email }
  })
}

// 发送找回密码验证码
export const sendForgotPasswordVerificationCode = (email: string) => {
  return request<{ success: boolean; message: string; data?: { messageId: string } }>({
    url: '/verification/send-forgot-password-code',
    method: 'POST',
    data: { email }
  })
}

// 验证注册验证码
export const verifyRegisterCode = (email: string, code: string) => {
  return request<{ success: boolean; message: string }>({
    url: '/verification/verify-register-code',
    method: 'POST',
    data: { email, code }
  })
}

// 验证找回密码验证码
export const verifyForgotPasswordCode = (email: string, code: string) => {
  return request<{ success: boolean; message: string }>({
    url: '/verification/verify-forgot-password-code',
    method: 'POST',
    data: { email, code }
  })
}

// 重置密码
export const resetPassword = (email: string, code: string, newPassword: string) => {
  return request<{ success: boolean; message: string }>({
    url: '/verification/reset-password',
    method: 'POST',
    data: { email, code, newPassword }
  })
}