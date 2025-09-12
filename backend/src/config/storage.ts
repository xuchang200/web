import path from 'path';
import fs from 'fs';

// 存储配置
export const STORAGE_CONFIG = {
  // 基础存储路径
  BASE_UPLOAD_PATH: path.join(process.cwd(), 'uploads'),
  
  // 游戏文件存储路径
  GAMES_PATH: path.join(process.cwd(), 'uploads', 'games'),
  
  // 封面图片存储路径
  COVERS_PATH: path.join(process.cwd(), 'uploads', 'covers'),
  
  // 临时文件路径
  TEMP_PATH: path.join(process.cwd(), 'uploads', 'temp'),
  
  // 文件大小限制
  MAX_COVER_SIZE: 2 * 1024 * 1024, // 2MB
  MAX_GAME_SIZE: 50 * 1024 * 1024, // 50MB
  
  // 允许的文件类型
  ALLOWED_COVER_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],
  
  // 文件扩展名
  COVER_EXTENSIONS: ['.jpg', '.jpeg', '.png']
};

// 确保目录存在的函数
export const ensureDirectoryExists = (dirPath: string): void => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// 初始化存储目录
export const initializeStorageDirectories = (): void => {
  const directories = [
    STORAGE_CONFIG.BASE_UPLOAD_PATH,
    STORAGE_CONFIG.GAMES_PATH,
    STORAGE_CONFIG.COVERS_PATH,
    STORAGE_CONFIG.TEMP_PATH
  ];
  
  directories.forEach(dir => {
    ensureDirectoryExists(dir);
  });
  
  console.log('存储目录初始化完成');
};

// 生成唯一文件名
export const generateUniqueFileName = (originalName: string, prefix: string = ''): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = path.extname(originalName);
  const baseName = path.basename(originalName, extension);
  
  return `${prefix}${timestamp}_${randomString}_${baseName}${extension}`;
};

// 获取游戏存储路径
export const getGameStoragePath = (gameId: string): string => {
  return path.join(STORAGE_CONFIG.GAMES_PATH, gameId);
};

// 获取封面存储路径
export const getCoverStoragePath = (fileName: string): string => {
  return path.join(STORAGE_CONFIG.COVERS_PATH, fileName);
};

// 获取文件的访问URL
export const getFileAccessUrl = (filePath: string, baseUrl: string = ''): string => {
  const relativePath = path.relative(STORAGE_CONFIG.BASE_UPLOAD_PATH, filePath);
  return `${baseUrl}/uploads/${relativePath.replace(/\\/g, '/')}`;
};

// 清理临时文件
export const cleanupTempFiles = (maxAge: number = 24 * 60 * 60 * 1000): void => {
  const tempDir = STORAGE_CONFIG.TEMP_PATH;
  
  if (!fs.existsSync(tempDir)) return;
  
  const files = fs.readdirSync(tempDir);
  const now = Date.now();
  
  files.forEach(file => {
    const filePath = path.join(tempDir, file);
    const stats = fs.statSync(filePath);
    
    if (now - stats.mtime.getTime() > maxAge) {
      fs.unlinkSync(filePath);
      console.log(`已清理过期临时文件: ${file}`);
    }
  });
};