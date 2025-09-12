import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError';
import { getSettings } from '../services/settings/settingsService';
import prisma from '../lib/prisma';

interface JwtPayload {
  id: string;
  role: 'ADMIN' | 'USER';
  lastLoginAt: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: 'ADMIN' | 'USER';
      };
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    let token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;

    // 兼容通过 URL 查询参数传递 token（用于新窗口打开时无法附带请求头的场景）
    if (!token && typeof req.query.token === 'string' && req.query.token.trim()) {
      token = req.query.token.trim().startsWith('Bearer ')
        ? req.query.token.trim().substring(7)
        : req.query.token.trim();
    }

    // 兼容 Cookie 传递 token（用于静态资源二次请求场景）
    if (!token && typeof req.headers.cookie === 'string') {
      const cookieStr = req.headers.cookie;
      const pairs = cookieStr.split(';').map(s => s.trim());
      for (const p of pairs) {
        const eq = p.indexOf('=');
        if (eq > 0) {
          const name = decodeURIComponent(p.substring(0, eq));
          const value = decodeURIComponent(p.substring(eq + 1));
          if (name === 'auth_token' || name === 'token') {
            token = value.startsWith('Bearer ')
              ? value.substring(7)
              : value;
            break;
          }
        }
      }
    }

    if (!token) {
      throw new AppError('Authentication token required', 401);
    }

    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'your_jwt_secret'
    ) as JwtPayload;

    // 查询用户最新信息
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      throw new AppError('User not found', 401);
    }

    // 单点登录开关读取
    try {
      const policy = await getSettings<any>('account.policy');
      if (policy?.sso?.enabled) {
        if (!user.lastLoginAt || user.lastLoginAt.getTime() !== decoded.lastLoginAt) {
          throw new AppError('Session expired due to login from another device', 401);
        }
      }
    } catch (e) {
      // 设置加载失败时默认执行原逻辑（更安全）
      if (!user.lastLoginAt || user.lastLoginAt.getTime() !== decoded.lastLoginAt) {
        throw new AppError('Session expired due to login from another device', 401);
      }
    }

    // 将用户信息附加到请求对象
    req.user = {
      id: user.id,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401));
    } else {
      next(error);
    }
  }
};

// 管理员权限检查中间件
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ADMIN') {
    return next(new AppError('Admin access required', 403));
  }
  next();
};