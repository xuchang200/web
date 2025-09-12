import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '@/types/user'; // 确保你的 User 类型路径正确

export const useAuthStore = defineStore('auth', () => {
  // --- State ---
  const token = ref<string | null>(null);
  const user = ref<User | null>(null);

  // --- Getters ---
  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const userRole = computed(() => user.value?.role);

  // --- Actions ---

  /**
   * 从 localStorage 加载 token 和用户信息，实现持久化登录
   */
  const loadStateFromStorage = () => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken) {
      token.value = storedToken;
    }
    if (storedUser) {
      try {
        user.value = JSON.parse(storedUser);
      } catch (e) {
        console.error('Failed to parse user from localStorage', e);
        // 解析失败则清除，避免应用出错
        localStorage.removeItem('user');
        user.value = null;
      }
    }
  };

  /**
   * 在登录成功后设置 token 和用户信息
   * @param newToken - 从后端获取的 JWT
   * @param newUser - 从后端获取的用户信息
   */
  const setLoginInfo = (newToken: string, newUser: User) => {
    token.value = newToken;
    user.value = newUser;
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  /**
   * 登出，并清除所有认证信息
   */
  const logout = () => {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // 登出后通常会重定向到登录页，这部分逻辑可以在调用 logout 的地方处理，或者在路由守卫中处理
  };

  return {
    token,
    user,
    isAuthenticated,
    userRole,
    loadStateFromStorage,
    setLoginInfo,
    logout,
  };
});