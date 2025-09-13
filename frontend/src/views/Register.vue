<template>
  <div class="login-container">
    <div class="login-box">
      <!-- 网站标题 - 新字体，无反射 -->
      <h1 class="title">
        <span class="title-text">{{ siteInfo.siteName }}</span>
      </h1>
      <p class="site-description">{{ siteInfo.site?.siteDescription || '一个温馨的小站，与你分享美好时光' }}</p>
      
      <!-- 注册表单 -->
      <form class="login-form" @submit.prevent="handleRegister">
        <div class="form-group">
          <input
            type="text"
            id="username"
            v-model="registerForm.username"
            placeholder="请输入用户名"
            class="form-input"
          >
        </div>
        
        <div class="form-group">
          <input
            type="email"
            id="email"
            v-model="registerForm.email"
            placeholder="请输入邮箱"
            class="form-input"
          >
        </div>

        <div class="form-group form-group-flex">
          <input
            type="text"
            id="verificationCode"
            v-model="registerForm.verificationCode"
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
            id="password"
            v-model="registerForm.password"
            placeholder="请输入密码"
            class="form-input"
          >
          <p class="pwd-hint" v-if="passwordPolicyDesc">{{ passwordPolicyDesc }}</p>
        </div>
        
        <button type="submit" class="login-btn">
          <span>注册</span>
        </button>
      </form>
      
      <!-- 引导选项 -->
      <div class="guide-links">
        <button class="guide-link" @click="$router.push('/login')">
          <span>已有账号？</span>
          <span class="link-text">立即登录 →</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getPublicAccountPolicy } from '@/api/public'
import { sendRegisterVerificationCode } from '@/api/verification'
import { register } from '@/api/auth'
import { msg, Text } from '@/utils/message'

const router = useRouter()

// 注册表单数据
const registerForm = ref({
  username: '',
  email: '',
  verificationCode: '',
  password: ''
})

// 密码策略（从后端获取 account.policy）
const accountPolicy = ref<{ password: { minLength: number; maxLength: number; requireUppercase: boolean; requireLowercase: boolean; requireNumber: boolean; requireSymbol: boolean } }>({
  password: { minLength: 8, maxLength: 64, requireUppercase: false, requireLowercase: true, requireNumber: true, requireSymbol: false }
})

const passwordPolicyDesc = computed(() => {
  const p = accountPolicy.value.password
  const parts: string[] = [`长度 ${p.minLength}-${p.maxLength}`]
  if (p.requireLowercase) parts.push('小写')
  if (p.requireUppercase) parts.push('大写')
  if (p.requireNumber) parts.push('数字')
  if (p.requireSymbol) parts.push('符号')
  return '密码需包含：' + parts.join('、')
})

async function loadPolicy() {
  try {
    const res: any = await getPublicAccountPolicy()
    if (res?.data?.password) {
      accountPolicy.value.password = { ...accountPolicy.value.password, ...res.data.password }
    }
  } catch {}
}

// 验证码冷却状态
const isCoolingDown = ref(false)
const countdown = ref(60)

// 获取验证码
const getVerificationCode = async () => {
  if (isCoolingDown.value) return
  
  if (!registerForm.value.email) {
    msg.validation(Text.emailRequired, 'register-email-required')
    return
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerForm.value.email)) {
    msg.validation(Text.emailInvalid, 'register-email-invalid')
    return
  }
  
  try {
    // 发送验证码
  const response = await sendRegisterVerificationCode(registerForm.value.email)
  msg.success(response.message || Text.sendCodeSuccess, 'register-send-code-success')
    
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
    msg.error(error.message || Text.sendCodeFail, 'register-send-code-fail')
    console.error('发送验证码失败:', error)
  }
}

// 注册处理函数
const handleRegister = async () => {
  // 表单验证
  if (!registerForm.value.username) {
    msg.validation(Text.usernameRequired, 'register-username-required'); return
  }
  if (!registerForm.value.email) { msg.validation(Text.emailRequired, 'register-email-required'); return }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerForm.value.email)) { msg.validation(Text.emailInvalid, 'register-email-invalid'); return }
  if (!registerForm.value.verificationCode) { msg.validation(Text.codeRequired, 'register-code-required'); return }
  if (!registerForm.value.password) { msg.validation(Text.passwordRequired, 'register-password-required'); return }
  const p = accountPolicy.value.password
  const pw = registerForm.value.password
  if (pw.length < p.minLength) { msg.validation(Text.passwordTooShort(p.minLength), 'register-password-short'); return }
  if (pw.length > p.maxLength) { msg.validation(Text.passwordTooLong(p.maxLength), 'register-password-long'); return }
  if (p.requireLowercase && !/[a-z]/.test(pw)) { msg.validation(Text.passwordNeedLower, 'register-password-lower'); return }
  if (p.requireUppercase && !/[A-Z]/.test(pw)) { msg.validation(Text.passwordNeedUpper, 'register-password-upper'); return }
  if (p.requireNumber && !/\d/.test(pw)) { msg.validation(Text.passwordNeedNumber, 'register-password-number'); return }
  if (p.requireSymbol && !/[~!@#$%^&*()_+\-={}\[\]:";'<>?,./]/.test(pw)) { msg.validation(Text.passwordNeedSymbol, 'register-password-symbol'); return }
  
  try {
    // 直接进行注册，后端会自动验证验证码
    const response = await register({
      username: registerForm.value.username,
      email: registerForm.value.email,
      password: registerForm.value.password,
      verificationCode: registerForm.value.verificationCode
    })
    
    msg.success(response.message || Text.registerSuccess, 'register-success')
    router.push('/login')
  } catch (error: any) {
    msg.error(error.message || Text.registerFail, 'register-fail')
    console.error('注册失败:', error)
  }
}
import { useSiteInfoStore } from '@/store/siteInfo'
onMounted(loadPolicy)
const siteInfo = useSiteInfoStore()
</script>

<style scoped lang="scss">
@font-face {
    font-family: "ZSFT-dd";
    src: url("https://fontsapi.zeoseven.com/dd/main.woff2") format("woff2"),
        url("https://fontsapi-storage.zeoseven.com/dd/main.woff2") format("woff2");
    font-display: swap;
}

.login-container {
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

.login-box {
  position: relative;
  background: white;
  border-radius: 30px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  border: 4px solid #A56A5A; // 粉棕色边框，加粗
  box-shadow: 0 20px 50px rgba(100, 50, 40, 0.3);
  margin: 0 auto; // 确保水平居中
}

.pwd-hint {
  margin-top: 6px;
  font-size: 12px;
  color: #ff4081;
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

// 站点描述样式
.site-description {
  text-align: center;
  margin: -30px 0 35px 0;
  font-size: 0.8rem;
  color: #888;
  font-weight: 400;
  line-height: 1.4;
}

// 表单样式
.login-form {
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

// 登录按钮
.login-btn {
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
  
  .btn-decoration {
    position: absolute;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 1.2rem;
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

// 背景装饰爱心
.bg-hearts {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

.heart {
  position: absolute;
  font-size: 2rem;
  color: rgba(255, 128, 171, 0.3);
  animation: float 6s ease-in-out infinite;
  
  &.heart-1 {
    top: 20%;
    left: 10%;
    animation-delay: 0s;
  }
  
  &.heart-2 {
    top: 60%;
    right: 15%;
    animation-delay: 2s;
    font-size: 1.5rem;
  }
  
  &.heart-3 {
    top: 80%;
    left: 20%;
    animation-delay: 4s;
    font-size: 1.2rem;
  }
  
  &.heart-4 {
    top: 30%;
    right: 25%;
    animation-delay: 1s;
    font-size: 1.8rem;
  }
}

@keyframes float {
  0%, 100% { 
    transform: translateY(0px) rotate(0deg); 
    opacity: 0.3;
  }
  50% { 
    transform: translateY(-20px) rotate(5deg); 
    opacity: 0.6;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .login-container {
    padding: 15px;
    justify-content: center;
    align-items: center;
  }
  
  .login-box {
    padding: 30px 25px;
    max-width: 350px;
    margin: 0 auto;
    left: 0;
    right: 0;
    transform: none;
  }
  
  .title .title-text {
    font-size: 2.5rem;
  }
  
  .form-input {
    padding: 12px 15px;
  }
  
  .login-btn {
    padding: 12px;
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .login-container {
    padding: 10px;
  }
  
  .login-box {
    padding: 25px 20px;
    border-radius: 25px;
    max-width: calc(100% - 20px);
    margin: 0 auto;
    left: 0;
    right: 0;
    transform: none;
    box-sizing: border-box;
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
  .login-container {
    padding: 15px;
  }
  
  .login-box {
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