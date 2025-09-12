import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';
import { msg, AdminText } from '@/utils/message';
import { useAuthStore } from '@/store/auth';

// Create an Axios instance
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api', // api base_url
  timeout: 5000, // request timeout
});

// Request interceptor
service.interceptors.request.use(
  (config) => {
    // 自动添加 token 到请求头
    const authStore = useAuthStore();
    const token = authStore.token;
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error(error); // for debug
    return Promise.reject(error);
  }
);

// Response interceptor
service.interceptors.response.use(
  (response) => {
    const res = response.data;
    if (!res.success) {
      msg.error(res.message || AdminText.genericFail);
      return Promise.reject(new Error(res.message || 'Error'));
    } else {
      return res;
    }
  },
  (error) => {
    console.error('err' + error); // for debug
    
    // 处理 401 未授权错误
    if (error.response?.status === 401) {
      const authStore = useAuthStore();
      authStore.logout(); // 清除登录状态并跳转
      msg.error(AdminText.authExpired, 'authExpired');
    } else {
      // 优先使用后端返回的错误信息
      const message = error.response?.data?.message || error.message;
      msg.error(message || AdminText.genericFail);
    }
    
    return Promise.reject(error);
  }
);

// 封装一个带泛型的请求函数，返回响应体而非 AxiosResponse
const request = <T = any>(config: AxiosRequestConfig): Promise<T> => {
  // 通过 axios 的第二泛型参数覆盖返回类型为 T
  return service.request<any, T>(config);
};

export default request;