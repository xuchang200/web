import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { logSystemError, logFileOperation } from '../services/logService';
import { extractClientContext } from '../utils/requestContext';
import prisma from '../lib/prisma';

interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

const errorHandler = async (err: AppError, req: Request, res: Response, next: NextFunction) => {
  console.error('Error occurred:', err);

  // 获取用户信息（如果存在）
  const user = (req as any).user;
  const userId = user?.id;

  // 处理Multer错误
  if (err instanceof multer.MulterError) {
    let message = '文件上传错误';
    let statusCode = 400;

    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = '文件大小超过限制';
        break;
      case 'LIMIT_FILE_COUNT':
        message = '文件数量超过限制';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = '意外的文件字段';
        break;
      case 'LIMIT_FIELD_KEY':
        message = '字段名过长';
        break;
      case 'LIMIT_FIELD_VALUE':
        message = '字段值过长';
        break;
      case 'LIMIT_FIELD_COUNT':
        message = '字段数量过多';
        break;
      case 'LIMIT_PART_COUNT':
        message = '部分数量过多';
        break;
      default:
        message = err.message || '文件上传错误';
    }

    // 记录文件上传失败日志
    if (userId) {
      try {
        const userInfo = await prisma.user.findUnique({
          where: { id: userId },
          select: { username: true }
        });
        
        if (userInfo) {
          await logFileOperation(
            userId,
            userInfo.username,
            'UPLOAD',
            req.file?.originalname || 'unknown',
            'OTHER',
            false,
            extractClientContext(req),
            message
          );
        }
      } catch (logError) {
        console.error('记录文件上传错误日志失败:', logError);
      }
    }

    return res.status(statusCode).json({
      success: false,
      message,
      error: err.code
    });
  }

  // 对于严重错误（500级别），记录系统错误日志
  const statusCode = err.statusCode || 500;
  if (statusCode >= 500) {
    try {
      await logSystemError(
        err,
        userId,
        extractClientContext(req),
        {
          url: req.url,
          method: req.method,
          userAgent: req.get('User-Agent'),
          statusCode
        }
      );
    } catch (logError) {
      console.error('记录系统错误日志失败:', logError);
    }
  }

  // 处理其他错误
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

export default errorHandler;