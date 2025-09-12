import request from './request';
import type { LoginData, RegisterData } from '../types/auth';

export const login = (data: LoginData): Promise<{ token: string; user: any }> => {
  return request({
    url: '/auth/login',
    method: 'post',
    data,
  });
};

export const register = (data: RegisterData) => {
  return request({
    url: '/auth/register',
    method: 'post',
    data,
  });
};