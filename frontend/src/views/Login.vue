<template>
  <div class="login-container">
    <div class="auth-wrapper">
      <!-- 登录表单 -->
      <div v-if="currentView === 'login'" class="auth-form">
        <h2>用户登录</h2>
        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <input 
              v-model="loginForm.account" 
              type="text" 
              placeholder="用户名或邮箱" 
              required 
            />
          </div>
          <div class="form-group">
            <input 
              v-model="loginForm.password" 
              type="password" 
              placeholder="密码" 
              required 
            />
          </div>
          <button type="submit" class="btn-primary" :disabled="isLoading">
            {{ isLoading ? '登录中...' : '登录' }}
          </button>
        </form>
        
        <div class="form-links">
          <a href="#" @click.prevent="currentView = 'forgot'" class="forgot-password">忘记密码？</a>
        </div>
        
        <div class="form-switch">
          <p>还没有账号？ <a href="#" @click.prevent="currentView = 'register'">立即注册</a></p>
        </div>
      </div>

      <!-- 注册表单 -->
      <div v-else-if="currentView === 'register'" class="auth-form">
        <h2>用户注册</h2>
        <form @submit.prevent="handleRegister">
          <div class="form-group">
            <input 
              v-model="registerForm.username" 
              type="text" 
              placeholder="用户名" 
              required 
            />
          </div>
          <div class="form-group">
            <input 
              v-model="registerForm.email" 
              type="email" 
              placeholder="邮箱" 
              required 
            />
          </div>
          <div class="form-group verification-group">
            <input 
              v-model="registerForm.code" 
              type="text" 
              placeholder="邮箱验证码" 
              maxlength="6"
              required 
            />
            <button 
              type="button" 
              class="btn-code" 
              :disabled="isCodeSending || codeCountdown > 0"
              @click="sendVerificationCode"
            >
              {{ codeCountdown > 0 ? `${codeCountdown}s` : '发送验证码' }}
            </button>
          </div>
          <div class="form-group">
            <input 
              v-model="registerForm.password" 
              type="password" 
              placeholder="密码" 
              required 
            />
          </div>
          <div class="form-group">
            <input 
              v-model="registerForm.confirmPassword" 
              type="password" 
              placeholder="确认密码" 
              required 
            />
          </div>
          <button type="submit" class="btn-primary" :disabled="isLoading">
            {{ isLoading ? '注册中...' : '注册' }}
          </button>
        </form>
        
        <div class="form-switch">
          <p>已有账号？ <a href="#" @click.prevent="currentView = 'login'">立即登录</a></p>
        </div>
      </div>

      <!-- 忘记密码表单 -->
      <div v-else-if="currentView === 'forgot'" class="auth-form">
        <h2>找回密码</h2>
        <form @submit.prevent="handleForgotPassword">
          <div class="form-group">
            <input 
              v-model="forgotForm.email" 
              type="email" 
              placeholder="请输入注册时使用的邮箱" 
              required 
            />
          </div>
          <button type="submit" class="btn-primary" :disabled="isLoading">
            {{ isLoading ? '发送中...' : '发送重置链接' }}
          </button>
        </form>
        
        <div class="form-switch">
          <p><a href="#" @click.prevent="currentView = 'login'">返回登录</a></p>
        </div>
      </div>

      <!-- 重置密码表单 -->
      <div v-else-if="currentView === 'reset'" class="auth-form">
        <h2>重置密码</h2>
        <form @submit.prevent="handleResetPassword">
          <div class="form-group">
            <input 
              v-model="resetForm.newPassword" 
              type="password" 
              placeholder="新密码" 
              required 
            />
          </div>
          <div class="form-group">
            <input 
              v-model="resetForm.confirmPassword" 
              type="password" 
              placeholder="确认新密码" 
              required 
            />
          </div>
          <button type="submit" class="btn-primary" :disabled="isLoading">
            {{ isLoading ? '重置中...' : '重置密码' }}
          </button>
        </form>
      </div>
    </div>

    <!-- 消息提示 -->
    <div v-if="message" :class="['message', messageType]">
      {{ message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter, useRoute } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

// 当前视图状态
const currentView = ref('login'); // 'login', 'register', 'forgot', 'reset'

// 加载状态
const isLoading = ref(false);
const isCodeSending = ref(false);
const codeCountdown = ref(0);

// 消息状态
const message = ref('');
const messageType = ref('success'); // 'success', 'error', 'info'

// 表单数据
const loginForm = ref({
  account: '',
  password: '',
});

const registerForm = ref({
  username: '',
  email: '',
  code: '',
  password: '',
  confirmPassword: '',
});

const forgotForm = ref({
  email: '',
});

const resetForm = ref({
  newPassword: '',
  confirmPassword: '',
});

// 重置令牌
const resetToken = ref('');

// 检查是否是密码重置页面
onMounted(() => {
  if (route.query.token) {
    currentView.value = 'reset';
    resetToken.value = route.query.token as string;
  }
});

// 显示消息
const showMessage = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
  message.value = msg;
  messageType.value = type;
  setTimeout(() => {
    message.value = '';
  }, 5000);
};

// 验证码倒计时
const startCountdown = () => {
  codeCountdown.value = 60;
  const timer = setInterval(() => {
    codeCountdown.value--;
    if (codeCountdown.value <= 0) {
      clearInterval(timer);
    }
  }, 1000);
};

// 发送验证码
const sendVerificationCode = async () => {
  if (!registerForm.value.email) {
    showMessage('请先填写邮箱地址', 'error');
    return;
  }

  isCodeSending.value = true;
  try {
    const success = await authStore.sendVerificationCode(registerForm.value.email);
    if (success) {
      showMessage('验证码已发送到您的邮箱，请查收', 'success');
      startCountdown();
    } else {
      showMessage('验证码发送失败，请稍后重试', 'error');
    }
  } catch (error) {
    showMessage('验证码发送失败，请稍后重试', 'error');
  } finally {
    isCodeSending.value = false;
  }
};

// 处理登录
const handleLogin = async () => {
  isLoading.value = true;
  try {
    const result = await authStore.login(loginForm.value);
    if (result.success) {
      showMessage('登录成功！', 'success');
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } else {
      showMessage(result.message || '登录失败', 'error');
    }
  } catch (error) {
    showMessage('登录失败，请稍后重试', 'error');
  } finally {
    isLoading.value = false;
  }
};

// 处理注册
const handleRegister = async () => {
  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    showMessage('两次输入的密码不一致', 'error');
    return;
  }

  isLoading.value = true;
  try {
    const result = await authStore.register(registerForm.value);
    if (result.success) {
      showMessage('注册成功！正在跳转...', 'success');
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } else {
      showMessage(result.message || '注册失败', 'error');
    }
  } catch (error) {
    showMessage('注册失败，请稍后重试', 'error');
  } finally {
    isLoading.value = false;
  }
};

// 处理忘记密码
const handleForgotPassword = async () => {
  isLoading.value = true;
  try {
    const result = await authStore.forgotPassword(forgotForm.value.email);
    if (result.success) {
      showMessage('密码重置链接已发送到您的邮箱，请查收', 'success');
      setTimeout(() => {
        currentView.value = 'login';
      }, 2000);
    } else {
      showMessage(result.message || '发送重置链接失败', 'error');
    }
  } catch (error) {
    showMessage('发送重置链接失败，请稍后重试', 'error');
  } finally {
    isLoading.value = false;
  }
};

// 处理重置密码
const handleResetPassword = async () => {
  if (resetForm.value.newPassword !== resetForm.value.confirmPassword) {
    showMessage('两次输入的密码不一致', 'error');
    return;
  }

  isLoading.value = true;
  try {
    const result = await authStore.resetPassword({
      token: resetToken.value,
      newPassword: resetForm.value.newPassword,
      confirmPassword: resetForm.value.confirmPassword,
    });
    if (result.success) {
      showMessage('密码重置成功！请使用新密码登录', 'success');
      setTimeout(() => {
        currentView.value = 'login';
        router.replace('/login');
      }, 2000);
    } else {
      showMessage(result.message || '密码重置失败', 'error');
    }
  } catch (error) {
    showMessage('密码重置失败，请稍后重试', 'error');
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.auth-wrapper {
  background: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.auth-form h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
  font-weight: 600;
}

.form-group {
  margin-bottom: 20px;
}

.verification-group {
  display: flex;
  gap: 10px;
}

.verification-group input {
  flex: 1;
}

input {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 5px;
  font-size: 16px;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

input:focus {
  outline: none;
  border-color: #667eea;
}

.btn-primary {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-code {
  padding: 12px 15px;
  background: #f8f9fa;
  border: 2px solid #e0e0e0;
  border-radius: 5px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s;
  white-space: nowrap;
}

.btn-code:hover:not(:disabled) {
  background: #e9ecef;
}

.btn-code:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-links {
  text-align: center;
  margin: 20px 0;
}

.forgot-password {
  color: #667eea;
  text-decoration: none;
  font-size: 14px;
}

.forgot-password:hover {
  text-decoration: underline;
}

.form-switch {
  text-align: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.form-switch p {
  margin: 0;
  color: #666;
}

.form-switch a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.form-switch a:hover {
  text-decoration: underline;
}

.message {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: 5px;
  font-weight: 600;
  z-index: 1000;
  max-width: 400px;
  text-align: center;
}

.message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.message.info {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

@media (max-width: 480px) {
  .auth-wrapper {
    padding: 30px 20px;
    margin: 10px;
  }
  
  .verification-group {
    flex-direction: column;
  }
  
  .verification-group input {
    flex: none;
  }
}
</style>