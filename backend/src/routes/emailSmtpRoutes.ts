import { Router } from 'express'
import { getEmailSmtpSettings, updateEmailSmtpSettings, testEmailSmtpConnection, sendTestEmail } from '../controllers/emailSmtpController'
import { authenticateToken, requireAdmin } from '../middlewares/authMiddleware'

const router = Router()

// 所有邮件SMTP路由都需要管理员权限
router.use(authenticateToken, requireAdmin)

// 获取SMTP设置
router.get('/', getEmailSmtpSettings)

// 更新SMTP设置
router.patch('/', updateEmailSmtpSettings)

// 测试SMTP连接
router.post('/test-connection', testEmailSmtpConnection)

// 发送测试邮件
router.post('/test-send', sendTestEmail)

export default router