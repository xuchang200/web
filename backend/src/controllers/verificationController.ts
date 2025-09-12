import { Request, Response } from 'express'
import { sendRegisterVerificationEmail, sendForgotPasswordVerificationEmail } from '../services/emailService'
import { verifyVerificationCode, hasValidVerificationCode, getVerificationCodeTTL, consumeVerificationCode } from '../services/verificationCodeService'
import { PrismaClient } from '@prisma/client'
import { createLog } from '../services/logService'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

/**
 * 发送注册验证码
 */
export async function sendRegisterCode(req: Request, res: Response) {
  try {
    const { email } = req.body
    
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return res.status(400).json({ success: false, message: '请提供有效的邮箱地址' })
    }
    
    // 检查邮箱是否已注册
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existingUser) {
      return res.status(400).json({ success: false, message: '该邮箱已注册' })
    }
    
    // 检查是否有未过期的验证码
    if (await hasValidVerificationCode(email, 'REGISTER')) {
      const ttl = await getVerificationCodeTTL(email, 'REGISTER')
      return res.status(400).json({ 
        success: false, 
        message: `验证码已发送，请等待 ${ttl} 秒后重试` 
      })
    }
    
    // 发送验证码
    const messageId = await sendRegisterVerificationEmail(email)
    
    res.json({ 
      success: true, 
      message: '验证码已发送到您的邮箱，请查收',
      data: { messageId }
    })
  } catch (error: any) {
    res.status(400).json({ 
      success: false, 
      message: error.message || '发送验证码失败' 
    })
  }
}

/**
 * 发送找回密码验证码
 */
export async function sendForgotPasswordCode(req: Request, res: Response) {
  try {
    const { email } = req.body
    
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return res.status(400).json({ success: false, message: '请提供有效的邮箱地址' })
    }
    
    // 检查邮箱是否存在
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    
    if (!existingUser) {
      // 为了安全，不暴露邮箱是否存在
      return res.json({ 
        success: true, 
        message: '如果该邮箱已注册，验证码将发送到您的邮箱'
      })
    }
    
    // 检查是否有未过期的验证码
    if (await hasValidVerificationCode(email, 'FORGOT_PASSWORD')) {
      const ttl = await getVerificationCodeTTL(email, 'FORGOT_PASSWORD')
      return res.status(400).json({ 
        success: false, 
        message: `验证码已发送，请等待 ${ttl} 秒后重试` 
      })
    }
    
    // 发送验证码
    const messageId = await sendForgotPasswordVerificationEmail(email)
    
    res.json({ 
      success: true, 
      message: '验证码已发送到您的邮箱，请查收',
      data: { messageId }
    })
  } catch (error: any) {
    res.status(400).json({ 
      success: false, 
      message: error.message || '发送验证码失败' 
    })
  }
}

/**
 * 验证验证码（注册用）
 */
export async function verifyRegisterCode(req: Request, res: Response) {
  try {
    const { email, code } = req.body
    
    if (!email || !code) {
      return res.status(400).json({ success: false, message: '邮箱和验证码不能为空' })
    }
    
    const isValid = await verifyVerificationCode(email, 'REGISTER', code)
    
    if (isValid) {
      res.json({ success: true, message: '验证码验证成功' })
    } else {
      res.status(400).json({ success: false, message: '验证码无效或已过期' })
    }
  } catch (error: any) {
    res.status(400).json({ 
      success: false, 
      message: error.message || '验证失败' 
    })
  }
}

/**
 * 验证验证码（找回密码用）
 */
export async function verifyForgotPasswordCode(req: Request, res: Response) {
  try {
    const { email, code } = req.body
    
    if (!email || !code) {
      return res.status(400).json({ success: false, message: '邮箱和验证码不能为空' })
    }
    
    const isValid = await verifyVerificationCode(email, 'FORGOT_PASSWORD', code)
    
    if (isValid) {
      res.json({ success: true, message: '验证码验证成功' })
    } else {
      res.status(400).json({ success: false, message: '验证码无效或已过期' })
    }
  } catch (error: any) {
    res.status(400).json({ 
      success: false, 
      message: error.message || '验证失败' 
    })
  }
}

/**
 * 重置密码（基于验证码）
 */
export async function resetPassword(req: Request, res: Response) {
  try {
    const { email, code, newPassword } = req.body
    
    if (!email || !code || !newPassword) {
      return res.status(400).json({ success: false, message: '邮箱、验证码和新密码不能为空' })
    }
    
    // 验证验证码
    const isValid = await verifyVerificationCode(email, 'FORGOT_PASSWORD', code)
    
    if (!isValid) {
      return res.status(400).json({ success: false, message: '验证码无效或已过期' })
    }
    
    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email }
    })
    
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' })
    }
    
    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    
    // 更新密码
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    })
    
    // 记录密码历史（可选）
    try {
      await prisma.passwordHistory.create({
        data: {
          userId: user.id,
          password: hashedPassword
        }
      })
    } catch (e) {
      // 忽略密码历史记录失败
    }
    
    // 消费验证码
    try {
      await consumeVerificationCode(email, 'FORGOT_PASSWORD')
    } catch (e) {
      // 忽略验证码消费失败
    }
    
    // 记录日志
    await createLog({
      type: 'USER_PASSWORD_CHANGE',
      message: `用户 ${user.username} 通过邮箱验证码重置密码`,
      userId: user.id,
      metadata: { 
        email,
        resetMethod: 'EMAIL_VERIFICATION'
      }
    })
    
    res.json({ 
      success: true, 
      message: '密码重置成功，请使用新密码登录' 
    })
  } catch (error: any) {
    res.status(400).json({ 
      success: false, 
      message: error.message || '密码重置失败' 
    })
  }
}