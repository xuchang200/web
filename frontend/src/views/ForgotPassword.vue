<template>
  <div class="forgot-password-container">
    <div class="forgot-password-box">
      <!-- 网站标题 - 新字体，无反射 -->
      <h1 class="title">
        <span class="title-text">{{ siteInfo.siteName }}</span>
      </h1>
      
      <!-- 忘记密码表单 -->
      <form class="forgot-password-form" @submit.prevent="handleForgotPassword">
        <div class="form-group">
          <input
            type="email"
            id="email"
            v-model="forgotPasswordForm.email"
            placeholder="请输入注册邮箱"
            class="form-input"
          >
        </div>
        
        <div class="form-group form-group-flex">
          <input
            type="text"
            id="verificationCode"
            v-model="forgotPasswordForm.verificationCode"
            placeholder="请输入验证码"
            class="form-input verification-code-input"
          >
          <button
            type="button"
            class="verification-code-btn"
            @click="getVerificationCode"
            :disabled="isCoolingDown"
          >
            {{ isCoolingDown ? `${countdown}s` : '获取验证码' }}
          </button>
        </div>
        
        <div class="form-group">
          <input
            type="password"
            id="newPassword"
            v-model="forgotPasswordForm.newPassword"
            placeholder="请输入新密码"
            class="form-input"
          >
        </div>
        
        <div class="form-group">
          <input
            type="password"
            id="confirmPassword"
            v-model="forgotPasswordForm.confirmPassword"
            placeholder="请再次输入新密码"
            class="form-input"
          >
        </div>
        
        <button type="submit" class="submit-btn">
          <span>重置密码</span>
        </button>
      </form>
      
    </div>
    
    <SiteFooter />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { sendForgotPasswordVerificationCode, resetPassword } from '@/api/verification'
import { msg, Text } from '@/utils/message'

const router = useRouter()

// 忘记密码表单数据
const forgotPasswordForm = ref({
  email: '',
  verificationCode: '',
  newPassword: '',
  confirmPassword: ''
})

// 验证码冷却状态
const isCoolingDown = ref(false)
const countdown = ref(60)

// 获取验证码
const getVerificationCode = async () => {
  if (isCoolingDown.value) return
  
  if (!forgotPasswordForm.value.email) { msg.validation(Text.emailRequired, 'fp-email-required'); return }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotPasswordForm.value.email)) { msg.validation(Text.emailInvalid, 'fp-email-invalid'); return }
  
  try {
    // 发送验证码
  const response = await sendForgotPasswordVerificationCode(forgotPasswordForm.value.email)
  msg.success(response.message || Text.sendCodeSuccess, 'fp-send-code-success')
    
    // 开始冷却倒计时
    isCoolingDown.value = true
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
        isCoolingDown.value = false
        countdown.value = 60
      }
    }, 1000)
  } catch (error: any) {
    msg.error(error.message || Text.sendCodeFail, 'fp-send-code-fail')
    console.error('发送验证码失败:', error)
  }
}

// 重置密码处理函数
const handleForgotPassword = async () => {
  // 表单验证
  if (!forgotPasswordForm.value.email) { msg.validation(Text.emailRequired, 'fp-email-required'); return }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotPasswordForm.value.email)) { msg.validation(Text.emailInvalid, 'fp-email-invalid'); return }
  if (!forgotPasswordForm.value.verificationCode) { msg.validation(Text.codeRequired, 'fp-code-required'); return }
  if (!forgotPasswordForm.value.newPassword) { msg.validation(Text.newPasswordRequired, 'fp-new-password-required'); return }
  if (forgotPasswordForm.value.newPassword.length < 6) { msg.validation('密码长度至少6位', 'fp-password-short'); return }
  if (forgotPasswordForm.value.newPassword !== forgotPasswordForm.value.confirmPassword) { msg.validation(Text.passwordNotMatch, 'fp-password-mismatch'); return }
  
  try {
    // 重置密码
    const response = await resetPassword(
      forgotPasswordForm.value.email,
      forgotPasswordForm.value.verificationCode,
      forgotPasswordForm.value.newPassword
    )
    
    msg.success(response.message || Text.passwordResetSuccess, 'fp-reset-success')
    router.push('/login')
  } catch (error: any) {
    msg.error(error.message || Text.resetFail, 'fp-reset-fail')
    console.error('密码重置失败:', error)
  }
}
import { useSiteInfoStore } from '@/store/siteInfo'
import SiteFooter from '@/components/SiteFooter.vue'
const siteInfo = useSiteInfoStore()
</script>

<style scoped lang="scss">
@font-face {
    font-family: "ZSFT-dd";
    src: url("https://fontsapi.zeoseven.com/dd/main.woff2") format("woff2"),
        url("https://fontsapi-storage.zeoseven.com/dd/main.woff2") format("woff2");
    font-display: swap;
}

.forgot-password-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: url('@/assets/images/login-background.jpg') no-repeat center center;
  background-size: cover;
  padding: 20px;
  box-sizing: border-box;
  overflow: hidden;
}

.forgot-password-box {
  position: relative;
  background: white;
  border-radius: 30px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  border: 4px solid #A56A5A; // 粉棕色边框，加粗
  box-shadow: 0 20px 50px rgba(100, 50, 40, 0.3);
}

// 网站标题 - 新字体
.title {
  position: relative;
  margin: 0 0 40px 0;
  text-align: center;
  
  .title-text {
    font-family: 'ZSFT-dd', cursive;
    font-size: 3rem;
    font-weight: 700;
    color: #ff4081;
    text-shadow: 
      2px 2px 0px #ff80ab,
      4px 4px 8px rgba(255, 64, 129, 0.3);
  }
}

// 表单样式
.forgot-password-form {
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 20px;
  text-align: left;
  
  label {
    display: block;
    margin-bottom: 8px;
    color: #666;
    font-weight: 600;
    font-size: 0.9rem;
  }
}

.form-input {
  width: 100%;
  padding: 15px 18px;
  border: 2px solid #ddd;
  border-radius: 25px;
  box-sizing: border-box;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: #fafafa;
  
  &:focus {
    outline: none;
    border-color: #ff80ab;
    background: white;
    box-shadow: 0 0 15px rgba(255, 128, 171, 0.2);
  }
  
  &::placeholder {
    color: #bbb;
    font-style: italic;
  }
}

.form-group-flex {
  display: flex;
  gap: 10px;
}

.verification-code-input {
  flex-grow: 1;
}

.verification-code-btn {
  padding: 0 20px;
  border: 2px solid #ddd;
  border-radius: 25px;
  background: #f0f0f0;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  
  &:hover {
    background: #e0e0e0;
    border-color: #ccc;
  }
  
  &:disabled {
    cursor: not-allowed;
    background: #f5f5f5;
    color: #aaa;
  }
}

// 提交按钮
.submit-btn {
  position: relative;
  width: 100%;
  padding: 15px;
  border: none;
  border-radius: 25px;
  background: linear-gradient(135deg, #ff4081 0%, #ff80ab 100%);
  color: white;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 4px solid #e91e63;
  overflow: hidden;
  
  span {
    position: relative;
    z-index: 2;
  }
  
  &:hover {
    background: linear-gradient(135deg, #f50057 0%, #ff4081 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(255, 64, 129, 0.4);
  }
  
  &:active {
    transform: translateY(1px);
    border-bottom-width: 2px;
  }
}

// 引导链接
.guide-links {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.guide-link {
  background: none;
  border: none;
  padding: 12px 0;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  span:first-child {
    color: #888;
    font-size: 0.9rem;
  }
  
  .link-text {
    color: #ff4081;
    font-weight: 600;
    font-size: 0.9rem;
  }
  
  &:hover {
    background: rgba(255, 128, 171, 0.1);
    
    .link-text {
      color: #f50057;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .forgot-password-container {
    padding: 15px;
  }
  
  .forgot-password-box {
    padding: 30px 25px;
    max-width: 350px;
  }
  
  .title .title-text {
    font-size: 2.5rem;
  }
  
  .form-input {
    padding: 12px 15px;
  }
  
  .submit-btn {
    padding: 12px;
    font-size: 1rem;
  }
  
  .verification-input {
    flex-direction: column;
    gap: 15px;
    
    .verification-code-input {
      width: 100%;
    }
    
    .send-code-btn {
      width: 100%;
      min-width: unset;
    }
  }
}

@media (max-width: 480px) {
  .forgot-password-box {
    padding: 25px 20px;
    border-radius: 25px;
  }
  
  .title .title-text {
    font-size: 2.2rem;
  }
  
  .guide-links {
    gap: 12px;
  }
  
  .guide-link {
    padding: 10px 0;
    font-size: 0.85rem;
    
    span:first-child,
    .link-text {
      font-size: 0.85rem;
    }
  }
}

// 平板横屏适配
@media (max-width: 1024px) and (max-height: 768px) {
  .forgot-password-container {
    padding: 15px;
  }
  
  .forgot-password-box {
    max-width: 380px;
    padding: 35px;
  }
  
  .title {
    margin-bottom: 30px;
    
    .title-text {
      font-size: 2.8rem;
    }
  }
}
</style>