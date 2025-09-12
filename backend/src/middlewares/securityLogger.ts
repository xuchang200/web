import { Request, Response, NextFunction } from 'express';
import { logSecurityEvent } from '../services/logService';
import { extractClientContext } from '../utils/requestContext';

/**
 * 记录可疑登录活动
 */
export const logSuspiciousLogin = async (req: Request, attempts: number) => {
  try {
    const context = extractClientContext(req);
    await logSecurityEvent(
      'SUSPICIOUS_ACTIVITY',
      `检测到可疑登录活动，IP: ${context.ip}，连续失败 ${attempts} 次`,
      context,
      undefined,
      {
        attempts,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
      }
    );
  } catch (error) {
    console.error('记录可疑登录活动日志失败:', error);
  }
};

/**
 * 记录未授权访问尝试
 */
export const logUnauthorizedAccess = async (req: Request, userId?: string, resource?: string) => {
  try {
    const context = extractClientContext(req);
    await logSecurityEvent(
      'UNAUTHORIZED_ACCESS',
      `检测到未授权访问尝试，IP: ${context.ip}，资源: ${resource || req.url}`,
      context,
      userId,
      {
        resource: resource || req.url,
        method: req.method,
        timestamp: new Date().toISOString()
      }
    );
  } catch (error) {
    console.error('记录未授权访问日志失败:', error);
  }
};

/**
 * 记录频率限制触发
 */
export const logRateLimitExceeded = async (req: Request, limit: number, windowMs: number) => {
  try {
    const context = extractClientContext(req);
    await logSecurityEvent(
      'RATE_LIMIT_EXCEEDED',
      `IP ${context.ip} 触发频率限制，${windowMs}ms 内超过 ${limit} 次请求`,
      context,
      undefined,
      {
        limit,
        windowMs,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
      }
    );
  } catch (error) {
    console.error('记录频率限制日志失败:', error);
  }
};

/**
 * 记录IP被阻止
 */
export const logIpBlocked = async (ip: string, reason: string) => {
  try {
    await logSecurityEvent(
      'IP_BLOCKED',
      `IP ${ip} 被阻止访问，原因: ${reason}`,
      { ip, userAgent: undefined },
      undefined,
      {
        reason,
        timestamp: new Date().toISOString()
      }
    );
  } catch (error) {
    console.error('记录IP阻止日志失败:', error);
  }
};

/**
 * 记录密码策略违规
 */
export const logPasswordPolicyViolation = async (req: Request, userId: string, username: string, violationType: string) => {
  try {
    const context = extractClientContext(req);
    await logSecurityEvent(
      'SUSPICIOUS_ACTIVITY',
      `用户 ${username} 违反密码策略: ${violationType}`,
      context,
      userId,
      {
        violationType,
        username,
        timestamp: new Date().toISOString()
      }
    );
  } catch (error) {
    console.error('记录密码策略违规日志失败:', error);
  }
};

/**
 * 安全事件记录中间件
 */
export const securityEventMiddleware = (eventType: 'UNAUTHORIZED_ACCESS' | 'SUSPICIOUS_ACTIVITY', message?: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const context = extractClientContext(req);
      const defaultMessage = eventType === 'UNAUTHORIZED_ACCESS' 
        ? `未授权访问尝试: ${req.method} ${req.url}`
        : `可疑活动: ${req.method} ${req.url}`;
      
      await logSecurityEvent(
        eventType,
        message || defaultMessage,
        context,
        user?.id,
        {
          url: req.url,
          method: req.method,
          timestamp: new Date().toISOString()
        }
      );
    } catch (error) {
      console.error('记录安全事件失败:', error);
    }
    next();
  };
};
