import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import { AppError } from '../utils/AppError';
import { STORAGE_CONFIG, getFileAccessUrl } from '../config/storage';
import { logFileOperation } from '../services/logService';
import { extractClientContext } from '../utils/requestContext';

// 清理文件的辅助函数
const cleanupFile = async (filePath: string): Promise<void> => {
  try {
    if (fsSync.existsSync(filePath)) {
      await fs.unlink(filePath);
      console.log(`已清理文件: ${filePath}`);
    }
  } catch (error) {
    console.error(`清理文件失败: ${filePath}`, error);
  }
};

// 清理多个文件
const cleanupFiles = async (filePaths: string[]): Promise<void> => {
  await Promise.all(filePaths.map(cleanupFile));
};

// 验证图片文件
const isValidImage = (file: Express.Multer.File): boolean => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!allowedTypes.includes(file.mimetype)) {
    throw new AppError('封面只支持 JPG、PNG 格式的图片', 400);
  }
  
  if (file.size > maxSize) {
    throw new AppError('封面图片大小不能超过 5MB', 400);
  }
  
  return true;
};

// 验证游戏文件夹
const validateGameFolder = (files: Express.Multer.File[]): boolean => {
  if (!files || files.length === 0) {
    throw new AppError('请选择游戏文件夹', 400);
  }
  
  // 检查是否包含 index.html
  const hasIndexHtml = files.some(file => 
    file.originalname.toLowerCase() === 'index.html' ||
    file.originalname.toLowerCase().endsWith('/index.html')
  );
  
  if (!hasIndexHtml) {
    throw new AppError('游戏文件夹必须包含 index.html 文件', 400);
  }
  
  // 检查文件大小
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const maxSize = 100 * 1024 * 1024; // 100MB
  
  if (totalSize > maxSize) {
    throw new AppError('游戏文件夹总大小不能超过 100MB', 400);
  }
  
  return true;
};

/**
 * 上传封面图片
 */
export const uploadCover = async (req: Request, res: Response, next: NextFunction) => {
  let uploadedFile: Express.Multer.File | undefined;
  
  try {
    const user = (req as any).user;
    uploadedFile = req.file;
    
    if (!uploadedFile) {
      return next(new AppError('请选择封面图片', 400));
    }
    
    // 验证图片
    isValidImage(uploadedFile);
    
    // 记录成功上传日志
    if (user?.id) {
      try {
        // 这里暂时使用用户ID作为用户名，后续可以优化
        await logFileOperation(
          user.id,
          user.id, // 临时使用ID作为用户名
          'UPLOAD',
          uploadedFile.originalname,
          'COVER',
          true,
          extractClientContext(req),
          undefined,
          uploadedFile.size
        );
      } catch (logError) {
        console.error('记录文件上传日志失败:', logError);
      }
    }
    
    // 生成访问URL
    const fileUrl = getFileAccessUrl(uploadedFile.path, `${req.protocol}://${req.get('host')}`);
    
    res.json({
      success: true,
      message: '封面上传成功',
      data: {
        fileName: uploadedFile.filename,
        originalName: uploadedFile.originalname,
        url: fileUrl,
        path: uploadedFile.path,
        size: uploadedFile.size
      }
    });
  } catch (error) {
    // 记录上传失败日志
    const user = (req as any).user;
    if (uploadedFile && user?.id) {
      try {
        await logFileOperation(
          user.id,
          user.id, // 临时使用ID作为用户名
          'UPLOAD',
          uploadedFile.originalname,
          'COVER',
          false,
          extractClientContext(req),
          error instanceof Error ? error.message : '上传失败',
          uploadedFile.size
        );
      } catch (logError) {
        console.error('记录文件上传失败日志失败:', logError);
      }
    }
    
    // 清理上传的文件
    if (uploadedFile?.path) {
      await cleanupFile(uploadedFile.path);
    }
    next(error);
  }
};

/**
 * 上传游戏文件夹
 */
export const uploadGameFolder = async (req: Request, res: Response, next: NextFunction) => {
  let uploadedFiles: Express.Multer.File[] = [];
  
  try {
    const user = (req as any).user;
    uploadedFiles = req.files as Express.Multer.File[];
    
    // 验证游戏文件夹
    validateGameFolder(uploadedFiles);
    
    // 计算总大小
    const totalSize = uploadedFiles.reduce((sum, file) => sum + file.size, 0);
    
    // 记录成功上传日志
    if (user?.id) {
      try {
        await logFileOperation(
          user.id,
          user.id, // 临时使用ID作为用户名
          'UPLOAD',
          `游戏文件夹 (${uploadedFiles.length}个文件)`,
          'GAME',
          true,
          extractClientContext(req),
          undefined,
          totalSize
        );
      } catch (logError) {
        console.error('记录游戏文件夹上传日志失败:', logError);
      }
    }
    
    res.json({
      success: true,
      message: '游戏文件夹上传成功',
      data: {
        fileCount: uploadedFiles.length,
        totalSize: totalSize,
        files: uploadedFiles.map(file => ({
          fileName: file.filename,
          originalName: file.originalname,
          path: file.path,
          size: file.size
        })),
        // 返回临时路径的基础目录
        tempPath: uploadedFiles.length > 0 ? path.dirname(uploadedFiles[0].path) : ''
      }
    });
  } catch (error) {
    // 记录上传失败日志
    const user = (req as any).user;
    if (uploadedFiles.length > 0 && user?.id) {
      try {
        await logFileOperation(
          user.id,
          user.id, // 临时使用ID作为用户名
          'UPLOAD',
          `游戏文件夹 (${uploadedFiles.length}个文件)`,
          'GAME',
          false,
          extractClientContext(req),
          error instanceof Error ? error.message : '上传失败',
          uploadedFiles.reduce((sum, file) => sum + file.size, 0)
        );
      } catch (logError) {
        console.error('记录游戏文件夹上传失败日志失败:', logError);
      }
    }
    
    // 清理所有上传的文件
    if (uploadedFiles.length > 0) {
      const filePaths = uploadedFiles.map(file => file.path);
      await cleanupFiles(filePaths);
    }
    next(error);
  }
};

/**
 * 删除上传的文件
 */
export const deleteUploadedFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filePath } = req.body;
    
    if (!filePath) {
      return next(new AppError('文件路径不能为空', 400));
    }
    
    // 安全检查：确保文件在允许的目录内
    const absolutePath = path.resolve(filePath);
    const allowedDirs = [
      path.resolve(STORAGE_CONFIG.COVERS_PATH),
      path.resolve(STORAGE_CONFIG.TEMP_PATH),
      path.resolve(STORAGE_CONFIG.GAMES_PATH)
    ];
    
    const isAllowed = allowedDirs.some(dir => absolutePath.startsWith(dir));
    
    if (!isAllowed) {
      return next(new AppError('无权限删除该文件', 403));
    }
    
    await cleanupFile(absolutePath);
    
    res.json({
      success: true,
      message: '文件删除成功'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取文件信息
 */
export const getFileInfo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filePath } = req.query;
    
    if (!filePath || typeof filePath !== 'string') {
      return next(new AppError('文件路径参数缺失', 400));
    }
    
    if (!fsSync.existsSync(filePath)) {
      return next(new AppError('文件不存在', 404));
    }
    
    const stats = await fs.stat(filePath);
    const fileName = path.basename(filePath);
    const fileUrl = getFileAccessUrl(filePath, `${req.protocol}://${req.get('host')}`);
    
    res.json({
      success: true,
      data: {
        fileName,
        size: stats.size,
        url: fileUrl,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime
      }
    });
  } catch (error) {
    next(error);
  }
};