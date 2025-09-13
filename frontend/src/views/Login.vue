<template>
  <div class="login-container">
    <div class="login-box">
      <!-- 网站标题 - 新字体，无反射 -->
      <h1 class="title">
        <span class="title-text">{{ siteInfo.siteName }}</span>
      </h1>
      <p class="site-description">{{ siteInfo.site?.siteDescription || '一个温馨的小站，与你分享美好时光' }}</p>
      
      <!-- 登录表单 -->
      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <input
            type="text"
            id="account"
            v-model="loginForm.account"
            placeholder="请输入用户名或邮箱"
            class="form-input"
          >
        </div>
        
        <div class="form-group">
          <input
            type="password"
            id="password"
            v-model="loginForm.password"
            placeholder="请输入密码"
            class="form-input"
          >
        </div>
        
        <button type="submit" class="login-btn">
          <span>登录</span>
        </button>
      </form>
      
      <!-- 引导选项 -->
      <div class="guide-links">
        <button class="guide-link" @click="$router.push('/register')">
          <span>还没有账号？</span>
          <span class="link-text">立即注册 →</span>
        </button>
        <button class="guide-link" @click="$router.push('/forgot-password')">
          <span>忘记密码？</span>
          <span class="link-text">找回密码 →</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '@/api/auth'
import { msg, TextEx } from '@/utils/message'
import { useAuthStore } from '@/store/auth'

const router = useRouter()
const authStore = useAuthStore()

// 登录表单数据
const loginForm = ref({
  account: '',
  password: ''
})

const loading = ref(false)

// 登录处理函数 - 调用后端API
const handleLogin = async () => {
  if (!loginForm.value.account || !loginForm.value.password) {
    msg.validation(TextEx.loginAccountRequired, 'login-required')
    return
  }
  
  loading.value = true
  // reset previous inline message (handled globally now)
  
  try {
    const response = await login(loginForm.value)
    
    const { token, user } = response
    
    // 调用 store 的 action 来保存登录信息
    authStore.setLoginInfo(token, user)
    
  msg.success(TextEx.loginSuccess, 'login-success')
    console.log('登录用户:', user)
    
    // 根据用户角色跳转到不同页面
    if (user.role === 'ADMIN') {
      router.push('/admin')
    } else {
      router.push('/')
    }
    
  } catch (error: any) {
    // 错误提示交由全局 axios 拦截器统一处理，避免重复弹窗
    console.error('Login error:', error)
  } finally {
    loading.value = false
  }
}
import { useSiteInfoStore } from '@/store/siteInfo'
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