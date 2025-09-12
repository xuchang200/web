import express from 'express';
import {
  uploadCover,
  uploadGameFolder,
  deleteUploadedFile,
  getFileInfo
} from '../controllers/uploadController';
import {
  uploadCoverMiddleware,
  uploadGameFolderMiddleware,
  uploadCombinedMiddleware,
  handleUploadError
} from '../middlewares/uploadMiddleware';
import { authenticateToken, requireAdmin } from '../middlewares/authMiddleware';

const router = express.Router();

// 应用认证中间件 - 只有管理员可以上传文件
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * 上传封面图片
 * POST /upload/cover
 */
router.post('/cover', 
  uploadCoverMiddleware.single('coverImage'), 
  handleUploadError,
  uploadCover
);

/**
 * 上传游戏文件夹
 * POST /upload/game-folder
 */
router.post('/game-folder', 
  uploadGameFolderMiddleware.array('gameFiles'), 
  handleUploadError,
  uploadGameFolder
);

/**
 * 同时上传封面和游戏文件夹
 * POST /upload/combined
 */
router.post('/combined', 
  uploadCombinedMiddleware.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'gameFiles', maxCount: 200 }
  ]), 
  handleUploadError,
  async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const result: any = {
        success: true,
        message: '文件上传成功',
        data: {}
      };

      // 处理封面
      if (files.coverImage && files.coverImage[0]) {
        const coverFile = files.coverImage[0];
        const { getFileAccessUrl } = await import('../config/storage');
        const coverUrl = getFileAccessUrl(coverFile.path, `${req.protocol}://${req.get('host')}`);
        
        result.data.cover = {
          fileName: coverFile.filename,
          originalName: coverFile.originalname,
          url: coverUrl,
          path: coverFile.path,
          size: coverFile.size
        };
      }

      // 处理游戏文件夹
      if (files.gameFiles && files.gameFiles.length > 0) {
        const gameFiles = files.gameFiles;
        const totalSize = gameFiles.reduce((sum, file) => sum + file.size, 0);
        
        // 验证游戏文件夹
        const hasIndexHtml = gameFiles.some(file => 
          file.originalname.toLowerCase() === 'index.html' ||
          file.originalname.toLowerCase().endsWith('/index.html')
        );
        
        if (!hasIndexHtml) {
          // 清理上传的文件
          const fs = await import('fs/promises');
          const fsSync = await import('fs');
          
          const cleanupPromises = [...(files.coverImage || []), ...gameFiles].map(async (file) => {
            try {
              if (fsSync.default.existsSync(file.path)) {
                await fs.unlink(file.path);
              }
            } catch (error) {
              console.error(`清理文件失败: ${file.path}`, error);
            }
          });
          
          await Promise.all(cleanupPromises);
          
          return res.status(400).json({
            success: false,
            message: '游戏文件夹必须包含 index.html 文件'
          });
        }
        
        // 返回根临时目录（如果中间件收敛到了单一目录，则目录相同）
        const pathModule = require('path');
        const allDirs = gameFiles.map(f => pathModule.dirname(f.path));
        // 优先取公共前缀目录，退化为第一项目录
        let rootTemp = allDirs[0] || '';
        if (allDirs.length > 1) {
          const splitDirs = allDirs.map(p => p.split(pathModule.sep));
          const minLen = Math.min(...splitDirs.map(arr => arr.length));
          const prefixParts: string[] = [];
          for (let i = 0; i < minLen; i++) {
            const part = splitDirs[0][i];
            if (splitDirs.every(arr => arr[i] === part)) {
              prefixParts.push(part);
            } else {
              break;
            }
          }
          if (prefixParts.length > 0) {
            rootTemp = prefixParts.join(pathModule.sep);
          }
        }

        result.data.game = {
          fileCount: gameFiles.length,
          totalSize: totalSize,
          files: gameFiles.map(file => ({
            fileName: file.filename,
            originalName: file.originalname,
            path: file.path,
            size: file.size
          })),
          tempPath: rootTemp
        };
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * 删除上传的文件
 * DELETE /upload/file
 */
router.delete('/file', deleteUploadedFile);

/**
 * 获取文件信息
 * GET /upload/file-info
 */
router.get('/file-info', getFileInfo);

/**
 * 健康检查
 * GET /upload/health
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '上传服务正常',
    timestamp: new Date().toISOString()
  });
});

export default router;