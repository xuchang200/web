import nodemailer from 'nodemailer'
import { getSettings } from '../services/settings/settingsService'
import { 
  generateVerificationCode, 
  checkEmailSendLimits, 
  incrementEmailSendCount, 
  storeVerificationCode,
  VerificationCodeType 
} from './verificationCodeService'
import { createLog } from './logService'

/**
 * 模板变量替换
 */
function replaceTemplateVariables(template: string, variables: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    result = result.replace(regex, value)
  }
  return result
}

/**
 * 创建SMTP传输器
 */
async function createTransporter() {
  const settings = await getSettings('email.smtp')
  
  if (!settings.enabled) {
    throw new Error('邮件服务未启用')
  }
  
  return nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.secure,
    auth: {
      user: settings.auth.user,
      pass: settings.auth.pass
    },
    // 超时设置
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 10000
  })
}

/**
 * 发送验证码邮件
 */
export async function sendVerificationEmail(
  email: string, 
  type: VerificationCodeType,
  extraVariables: Record<string, string> = {}
): Promise<string> {
  try {
    // 检查发送限制
    await checkEmailSendLimits(email, type)
    
    const settings = await getSettings('email.smtp')
    const siteSettings = await getSettings('site.basic')
    
    // 生成验证码
    const code = generateVerificationCode()
    
    // 获取对应类型的邮件配置
    const emailConfig = type === 'REGISTER' 
      ? settings.verification.register 
      : settings.verification.forgotPassword
    
    if (!emailConfig.enabled) {
      throw new Error(`${type === 'REGISTER' ? '注册' : '找回密码'}验证码邮件已禁用`)
    }
    
    // 准备模板变量
    const variables = {
      siteName: siteSettings.siteName || 'withU',
      code: code,
      expiryMinutes: emailConfig.expiryMinutes.toString(),
      email: email,
      ...extraVariables
    }
    
    // 替换模板变量
    const subject = replaceTemplateVariables(emailConfig.subject, variables)
    const htmlBody = replaceTemplateVariables(emailConfig.htmlTemplate, variables)
    const textBody = replaceTemplateVariables(emailConfig.textTemplate, variables)
    
    // 创建传输器并发送邮件
    const transporter = await createTransporter()
    
    const mailOptions = {
      from: `${settings.from.name} <${settings.from.address}>`,
      to: email,
      subject: subject,
      html: htmlBody,
      text: textBody
    }
    
    const info = await transporter.sendMail(mailOptions)
    
    // 存储验证码到Redis
    await storeVerificationCode(email, type, code, emailConfig.expiryMinutes)
    
    // 增加发送计数
    await incrementEmailSendCount(email, type)
    
    // 记录日志
    await createLog({
      type: 'SYSTEM_WARNING',
      message: `验证码邮件发送成功`,
      metadata: { 
        email, 
        type, 
        messageId: info.messageId,
        expiryMinutes: emailConfig.expiryMinutes
      }
    })
    
    return info.messageId || 'unknown'
    
  } catch (error: any) {
    // 记录发送失败日志
    await createLog({
      type: 'SYSTEM_ERROR',
      message: `验证码邮件发送失败: ${error.message}`,
      metadata: { email, type, error: error.message }
    })
    
    throw error
  }
}

/**
 * 发送注册验证码
 */
export async function sendRegisterVerificationEmail(email: string): Promise<string> {
  return sendVerificationEmail(email, 'REGISTER')
}

/**
 * 发送找回密码验证码
 */
export async function sendForgotPasswordVerificationEmail(email: string): Promise<string> {
  return sendVerificationEmail(email, 'FORGOT_PASSWORD')
}

/**
 * 发送通用通知邮件（不需要验证码）
 */
export async function sendNotificationEmail(
  to: string,
  subject: string,
  htmlContent: string,
  textContent?: string
): Promise<string> {
  try {
    const settings = await getSettings('email.smtp')
    
    if (!settings.enabled) {
      throw new Error('邮件服务未启用')
    }
    
    const transporter = await createTransporter()
    
    const mailOptions = {
      from: `${settings.from.name} <${settings.from.address}>`,
      to: to,
      subject: subject,
      html: htmlContent,
      text: textContent || htmlContent.replace(/<[^>]*>/g, '')
    }
    
    const info = await transporter.sendMail(mailOptions)
    
    await createLog({
      type: 'SYSTEM_WARNING',
      message: `通知邮件发送成功`,
      metadata: { 
        to, 
        subject,
        messageId: info.messageId
      }
    })
    
    return info.messageId || 'unknown'
    
  } catch (error: any) {
    await createLog({
      type: 'SYSTEM_ERROR',
      message: `通知邮件发送失败: ${error.message}`,
      metadata: { to, subject, error: error.message }
    })
    
    throw error
  }
}

/**
 * 测试SMTP连接
 */
export async function testSmtpConnection(): Promise<boolean> {
  try {
    const transporter = await createTransporter()
    await transporter.verify()
    return true
  } catch (error) {
    return false
  }
}