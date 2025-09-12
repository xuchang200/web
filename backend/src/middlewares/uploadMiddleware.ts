import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { STORAGE_CONFIG, generateUniqueFileName, ensureDirectoryExists } from '../config/storage';

/**
 * 封面图片上传中间件
 */
const coverStorage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    const uploadPath = STORAGE_CONFIG.COVERS_PATH;
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueName = generateUniqueFileName(file.originalname, 'cover_');
    cb(null, uniqueName);
  }
});

const coverFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只支持 JPG、PNG 格式的图片文件'));
  }
};

export const uploadCoverMiddleware = multer({
  storage: coverStorage,
  fileFilter: coverFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  }
});

/**
 * 游戏文件夹上传中间件
 */
const gameFolderStorage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    // 同一次上传复用同一临时目录
    const reqAny = req as any;
    if (!reqAny._gameUploadTempDir) {
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const folderName = `game_${timestamp}_${randomStr}`;
      reqAny._gameUploadTempDir = path.join(STORAGE_CONFIG.TEMP_PATH, folderName);
      ensureDirectoryExists(reqAny._gameUploadTempDir);
    }
    cb(null, reqAny._gameUploadTempDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    // 保持原始文件名和相对路径结构
    let fileName = file.originalname;
    
    // 处理文件夹结构（webkitRelativePath）
    if (file.fieldname === 'gameFiles' && (file as any).webkitRelativePath) {
      fileName = (file as any).webkitRelativePath;
    }
    
    // 确保文件名安全
    fileName = fileName.replace(/[^a-zA-Z0-9\-_\.\/\\]/g, '_');
    // 确保子目录存在
    try {
      const baseDir = (req as any)._gameUploadTempDir as string;
      if (baseDir) {
        const subDir = path.dirname(fileName);
        if (subDir && subDir !== '.' && subDir !== path.sep) {
          ensureDirectoryExists(path.join(baseDir, subDir));
        }
      }
    } catch {}

    cb(null, fileName);
  }
});

const gameFolderFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // 允许常见的游戏文件类型
  const allowedExtensions = [
    '.html', '.htm', '.js', '.css', '.json', '.txt', '.md',
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico',
    '.mp3', '.wav', '.ogg', '.m4a',
    '.mp4', '.webm', '.ogv',
    '.woff', '.woff2', '.ttf', '.otf', '.eot',
    '.xml', '.csv', '.pdf'
  ];
  
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(fileExt) || !fileExt) {
    cb(null, true);
  } else {
    cb(new Error(`不支持的文件类型: ${fileExt}`));
  }
};

export const uploadGameFolderMiddleware = multer({
  storage: gameFolderStorage,
  fileFilter: gameFolderFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 单个文件最大 10MB
    files: 200, // 最多 200 个文件
    fieldSize: 100 * 1024 * 1024 // 总大小 100MB
  }
});

/**
 * 通用上传中间件（用于同时上传封面和游戏文件夹）
 */
const combinedStorage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    let uploadPath: string;
    
    if (file.fieldname === 'coverImage') {
      uploadPath = STORAGE_CONFIG.COVERS_PATH;
    } else if (file.fieldname === 'gameFiles') {
      // 同一次上传复用同一临时目录
      const reqAny = req as any;
      if (!reqAny._gameUploadTempDir) {
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const folderName = `game_${timestamp}_${randomStr}`;
        reqAny._gameUploadTempDir = path.join(STORAGE_CONFIG.TEMP_PATH, folderName);
      }
      uploadPath = reqAny._gameUploadTempDir;
    } else {
      uploadPath = STORAGE_CONFIG.TEMP_PATH;
    }
    
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    let fileName: string;
    
    if (file.fieldname === 'coverImage') {
      fileName = generateUniqueFileName(file.originalname, 'cover_');
    } else if (file.fieldname === 'gameFiles') {
      // 保持游戏文件的原始结构
      fileName = file.originalname;
      if ((file as any).webkitRelativePath) {
        fileName = (file as any).webkitRelativePath;
      }
      fileName = fileName.replace(/[^a-zA-Z0-9\-_\.\/\\]/g, '_');
      // 确保子目录存在
      try {
        const baseDir = (req as any)._gameUploadTempDir as string;
        if (baseDir) {
          const subDir = path.dirname(fileName);
          if (subDir && subDir !== '.' && subDir !== path.sep) {
            ensureDirectoryExists(path.join(baseDir, subDir));
          }
        }
      } catch {}
    } else {
      fileName = generateUniqueFileName(file.originalname);
    }
    
    cb(null, fileName);
  }
});

const combinedFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.fieldname === 'coverImage') {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('封面只支持 JPG、PNG 格式的图片文件'));
    }
  } else if (file.fieldname === 'gameFiles') {
    const allowedExtensions = [
      '.html', '.htm', '.js', '.css', '.json', '.txt', '.md',
      '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico',
      '.mp3', '.wav', '.ogg', '.m4a',
      '.mp4', '.webm', '.ogv',
      '.woff', '.woff2', '.ttf', '.otf', '.eot',
      '.xml', '.csv', '.pdf'
    ];
    
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(fileExt) || !fileExt) {
      cb(null, true);
    } else {
      cb(new Error(`不支持的文件类型: ${fileExt}`));
    }
  } else {
    cb(new Error('不支持的文件字段'));
  }
};

export const uploadCombinedMiddleware = multer({
  storage: combinedStorage,
  fileFilter: combinedFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 单个文件最大 10MB
    files: 201, // 最多 201 个文件 (200个游戏文件 + 1个封面)
    fieldSize: 100 * 1024 * 1024 // 总大小 100MB
  }
});

/**
 * 错误处理中间件
 */
export const handleUploadError = (error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    let message = '文件上传错误';
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = '文件大小超过限制';
        break;
      case 'LIMIT_FILE_COUNT':
        message = '文件数量超过限制';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = '意外的文件字段';
        break;
      case 'LIMIT_FIELD_VALUE':
        message = '字段值过长';
        break;
      default:
        message = error.message || '文件上传错误';
    }
    
    return res.status(400).json({
      success: false,
      message: message,
      error: error.code
    });
  }
  
  // 其他错误传递给下一个错误处理中间件
  next(error);
};