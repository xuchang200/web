import { Request, Response } from 'express'
import { getSettings, updateSettings } from '../services/settings/settingsService'
import nodemailer from 'nodemailer'

export async function getEmailSmtpSettings(req: Request, res: Response) {
  try {
    const data = await getSettings('email.smtp')
    // 敏感信息处理：不返回SMTP密码
    const safeData = {
      ...data,
      auth: {
        ...data.auth,
        pass: data.auth.pass ? '********' : ''
      }
    }
    res.json({ success: true, data: safeData })
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message || '获取SMTP设置失败' })
  }
}

export async function updateEmailSmtpSettings(req: Request, res: Response) {
  try {
    // 如果密码字段是 ******** 则保持原有密码不变
    if (req.body.auth?.pass === '********') {
      const currentSettings = await getSettings('email.smtp')
      req.body.auth.pass = currentSettings.auth.pass
    }
    
    const updated = await updateSettings('email.smtp', req.body, req.user?.id)
    
    // 返回时隐藏密码
    const safeData = {
      ...updated,
      auth: {
        ...updated.auth,
        pass: updated.auth.pass ? '********' : ''
      }
    }
    
    res.json({ success: true, message: '更新成功', data: safeData })
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message || '更新失败' })
  }
}

export async function testEmailSmtpConnection(req: Request, res: Response) {
  try {
    const settings = await getSettings('email.smtp')
    
    // 调试信息：输出当前设置
    console.log('当前SMTP设置:', JSON.stringify(settings, null, 2))
    
    if (!settings.enabled) {
      return res.status(400).json({ success: false, message: 'SMTP服务未启用，请先在页面上开启SMTP服务' })
    }
    
    // 检查必要的配置是否存在
    if (!settings.host || !settings.auth.user || !settings.auth.pass) {
      return res.status(400).json({ 
        success: false, 
        message: 'SMTP配置不完整，请检查主机地址、用户名和密码是否已正确填写' 
      })
    }
    
    // 自动调整secure设置：465端口通常需要secure=true，587端口通常需要secure=false
    let actualSecure = settings.secure;
    if (settings.port === 465 && !settings.secure) {
      actualSecure = true;
      console.log('警告：端口465通常需要启用SSL，已自动调整secure为true');
    } else if (settings.port === 587 && settings.secure) {
      actualSecure = false;
      console.log('警告：端口587通常需要禁用SSL，已自动调整secure为false');
    }
    
    // 创建测试连接
    const transporter = nodemailer.createTransport({
      host: settings.host,
      port: settings.port,
      secure: actualSecure,
      auth: {
        user: settings.auth.user,
        pass: settings.auth.pass
      },
      // 增加连接超时时间
      connectionTimeout: 10000, // 10秒
      greetingTimeout: 5000,    // 5秒
      socketTimeout: 10000      // 10秒
    })
    
    // 验证连接
    await transporter.verify()
    
    res.json({ success: true, message: 'SMTP连接测试成功' })
  } catch (e: any) {
    res.status(400).json({ 
      success: false, 
      message: `SMTP连接测试失败: ${e.message}` 
    })
  }
}

export async function sendTestEmail(req: Request, res: Response) {
  try {
    const { to } = req.body
    
    if (!to || !to.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return res.status(400).json({ success: false, message: '请提供有效的测试邮箱地址' })
    }
    
    const settings = await getSettings('email.smtp')
    
    if (!settings.enabled) {
      return res.status(400).json({ success: false, message: 'SMTP服务未启用' })
    }
    
    const transporter = nodemailer.createTransport({
      host: settings.host,
      port: settings.port,
      secure: settings.secure,
      auth: {
        user: settings.auth.user,
        pass: settings.auth.pass
      }
    })
    
    const mailOptions = {
      from: `${settings.from.name} <${settings.from.address}>`,
      to: to,
      subject: '【测试邮件】SMTP配置测试',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2 style="color: #333;">SMTP配置测试</h2>
          <p>这是一封测试邮件，用于验证SMTP配置是否正确。</p>
          <p>如果您收到这封邮件，说明SMTP服务配置成功！</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            发送时间: ${new Date().toLocaleString('zh-CN')}<br>
            发送系统: ${settings.from.name}
          </p>
        </div>
      `,
      text: `这是一封测试邮件，用于验证SMTP配置是否正确。如果您收到这封邮件，说明SMTP服务配置成功！发送时间: ${new Date().toLocaleString('zh-CN')}`
    }
    
    const info = await transporter.sendMail(mailOptions)
    
    res.json({ 
      success: true, 
      message: `测试邮件发送成功，邮件ID: ${info.messageId}` 
    })
  } catch (e: any) {
    res.status(400).json({ 
      success: false, 
      message: `测试邮件发送失败: ${e.message}` 
    })
  }
}