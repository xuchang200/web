import { Router } from 'express'
import { 
  sendRegisterCode, 
  sendForgotPasswordCode, 
  verifyRegisterCode, 
  verifyForgotPasswordCode,
  resetPassword
} from '../controllers/verificationController'

const router = Router()

// 发送注册验证码
router.post('/send-register-code', sendRegisterCode)

// 发送找回密码验证码
router.post('/send-forgot-password-code', sendForgotPasswordCode)

// 验证注册验证码
router.post('/verify-register-code', verifyRegisterCode)

// 验证找回密码验证码
router.post('/verify-forgot-password-code', verifyForgotPasswordCode)

// 重置密码
router.post('/reset-password', resetPassword)

export default router