import { defineStore } from 'pinia';
import axios from 'axios';

const API_URL = 'http://localhost:3000'; // 后端API URL

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    token: localStorage.getItem('token') || null,
  }),
  
  getters: {
    isLoggedIn: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'admin',
  },
  
  actions: {
    // 发送邮箱验证码
    async sendVerificationCode(email: string): Promise<boolean> {
      try {
        const response = await axios.post(`${API_URL}/api/auth/send-code`, { email });
        return true;
      } catch (error: any) {
        console.error('Send verification code failed:', error);
        return false;
      }
    },

    // 用户注册
    async register(credentials: {
      username: string;
      email: string;
      code: string;
      password: string;
      confirmPassword: string;
    }): Promise<AuthResponse> {
      try {
        const response = await axios.post(`${API_URL}/api/auth/register`, credentials);
        const { user, token, message } = response.data;
        
        this.user = user;
        this.token = token;
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        return { success: true, message, user, token };
      } catch (error: any) {
        console.error('Registration failed:', error);
        const message = error.response?.data?.message || '注册失败';
        return { success: false, message };
      }
    },

    // 用户登录
    async login(credentials: {
      account: string;
      password: string;
    }): Promise<AuthResponse> {
      try {
        const response = await axios.post(`${API_URL}/api/auth/login`, credentials);
        const { user, token, message } = response.data;
        
        this.user = user;
        this.token = token;
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        return { success: true, message, user, token };
      } catch (error: any) {
        console.error('Login failed:', error);
        const message = error.response?.data?.message || '登录失败';
        return { success: false, message };
      }
    },

    // 忘记密码
    async forgotPassword(email: string): Promise<AuthResponse> {
      try {
        const response = await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
        const { message } = response.data;
        return { success: true, message };
      } catch (error: any) {
        console.error('Forgot password failed:', error);
        const message = error.response?.data?.message || '发送重置链接失败';
        return { success: false, message };
      }
    },

    // 重置密码
    async resetPassword(data: {
      token: string;
      newPassword: string;
      confirmPassword: string;
    }): Promise<AuthResponse> {
      try {
        const response = await axios.post(`${API_URL}/api/auth/reset-password`, data);
        const { message } = response.data;
        return { success: true, message };
      } catch (error: any) {
        console.error('Reset password failed:', error);
        const message = error.response?.data?.message || '密码重置失败';
        return { success: false, message };
      }
    },

    // 用户退出登录
    logout() {
      this.user = null;
      this.token = null;
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    },

    // 获取用户信息
    async fetchUser() {
      if (this.token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
        try {
          const response = await axios.get(`${API_URL}/api/users/profile`);
          this.user = response.data;
        } catch (error) {
          // Token可能无效，退出登录
          this.logout();
        }
      }
    },

    // 初始化认证状态
    initAuth() {
      if (this.token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
        this.fetchUser();
      }
    }
  },
});