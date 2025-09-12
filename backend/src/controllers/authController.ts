import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';
import { createLog } from '../services/logService';
import { extractClientContext } from '../utils/requestContext';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await authService.register(req.body, req);
    res.status(201).json({ success: true, message: '用户注册成功', data: user });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, user } = await authService.login(req.body, req);
    res.status(200).json({ success: true, message: '用户登录成功', data: { token, user } });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    
    // 记录登出日志
    if (user) {
      try {
        const logType = user.role === 'ADMIN' ? 'ADMIN_LOGOUT' : 'USER_LOGOUT'
        await createLog({
          type: logType,
          message: `${user.role === 'ADMIN' ? '管理员' : '用户'} ${user.username} 登出`,
          userId: user.id,
          context: extractClientContext(req),
          metadata: {
            username: user.username,
            role: user.role,
            logoutTime: new Date().toISOString()
          }
        })
      } catch (e) {
        // 忽略日志失败
      }
    }
    
    res.status(200).json({ success: true, message: '用户登出成功' });
  } catch (error) {
    next(error);
  }
};