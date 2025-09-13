import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import { GameStatus } from '@prisma/client';
import { STORAGE_CONFIG } from '../config/storage';
import { authenticateToken } from '../middlewares/authMiddleware';
import { logGameAccess } from '../services/logService';
import { extractClientContext } from '../utils/requestContext';
import prisma from '../lib/prisma';

const router = express.Router();

// 游戏内容访问中间件 - 权限检查
const checkGameAccess = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const { gameId } = req.params;
    const user = (req as any).user; // 来自 authenticateToken 中间件

    // 查找游戏
    const game = await prisma.game.findUnique({
      where: { id: gameId }
    });

    if (!game) {
      return res.status(404).json({
        success: false,
        message: '游戏不存在'
      });
    }

    // 权限检查逻辑
    let hasAccess = false;

    if (user?.role === 'ADMIN') {
      // 管理员可以访问所有游戏（包括草稿）
      hasAccess = true;
    } else if (game.status === GameStatus.PUBLISHED) {
      // 已发布的游戏，检查用户是否有激活权限
      if (user?.id) {
        const userGameActivation = await prisma.userGameActivation.findUnique({
          where: {
            userId_gameId: {
              userId: user.id,
              gameId: gameId
            }
          }
        });
        hasAccess = !!userGameActivation;
      }
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: '无权访问该游戏'
      });
    }

    // 将游戏信息附加到请求对象
    (req as any).game = game;
    next();
  } catch (error) {
    console.error('游戏访问权限检查失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

// 游戏内容文件访问（使用正则表达式匹配任意路径）
router.get(/^\/([^\/]+)\/(.*)$/, authenticateToken, async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const gameId = req.params[0];  // 第一个捕获组是 gameId
    const filePath = req.params[1] || 'index.html';  // 第二个捕获组是文件路径
    
    // 手动设置 gameId 到 params 以便 checkGameAccess 使用
    req.params.gameId = gameId;
    
    // 查找游戏
    const game = await prisma.game.findUnique({
      where: { id: gameId }
    });

    if (!game) {
      return res.status(404).json({
        success: false,
        message: '游戏不存在'
      });
    }

    // 权限检查
    const user = (req as any).user;
    let hasAccess = false;

    if (user?.role === 'ADMIN') {
      hasAccess = true;
    } else if (game.status === GameStatus.PUBLISHED) {
      // 已发布的游戏，检查用户是否有激活权限
      if (user?.id) {
        const userGameActivation = await prisma.userGameActivation.findUnique({
          where: {
            userId_gameId: {
              userId: user.id,
              gameId: gameId
            }
          }
        });
        hasAccess = !!userGameActivation;
      }
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: '无权访问该游戏'
      });
    }
    
    // 构建实际文件路径
    const gameDir = path.join(STORAGE_CONFIG.GAMES_PATH, game.path);
    const fullPath = path.resolve(gameDir, filePath);
    
    // 安全检查：确保文件在游戏目录内（防止路径穿越攻击）
    if (!fullPath.startsWith(path.resolve(gameDir))) {
      return res.status(403).json({
        success: false,
        message: '访问被拒绝'
      });
    }

    // 检查文件是否存在
    if (!fsSync.existsSync(fullPath)) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

    const stats = await fs.stat(fullPath);
    
    if (stats.isDirectory()) {
      // 如果是目录，尝试访问 index.html
      const indexPath = path.join(fullPath, 'index.html');
      if (fsSync.existsSync(indexPath)) {
        return res.redirect(`/game/${game.id}/index.html`);
      } else {
        return res.status(404).json({
          success: false,
          message: '目录中没有找到 index.html'
        });
      }
    }

    // 设置适当的 Content-Type
    const ext = path.extname(fullPath).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.otf': 'font/otf'
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);

    // 设置缓存头
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1小时缓存

    // 流式返回文件内容
    const fileStream = fsSync.createReadStream(fullPath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('访问游戏文件失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 游戏主页访问（不带具体文件路径）
router.get('/:gameId', authenticateToken, async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const { gameId } = req.params;
    
    // 查找游戏
    const game = await prisma.game.findUnique({
      where: { id: gameId }
    });

    if (!game) {
      return res.status(404).json({
        success: false,
        message: '游戏不存在'
      });
    }

    // 权限检查
    const user = (req as any).user;
    let hasAccess = false;

    if (user?.role === 'ADMIN') {
      hasAccess = true;
    } else if (game.status === GameStatus.PUBLISHED) {
      // 已发布的游戏，检查用户是否有激活权限
      if (user?.id) {
        const userGameActivation = await prisma.userGameActivation.findUnique({
          where: {
            userId_gameId: {
              userId: user.id,
              gameId: gameId
            }
          }
        });
        hasAccess = !!userGameActivation;
      }
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: '无权访问该游戏'
      });
    }
    
    // 如果通过查询参数传入了 token，则把它设置到短时 Cookie，便于后续资源请求带上认证
    const token = typeof req.query.token === 'string' ? req.query.token : '';
    if (token) {
      res.cookie('auth_token', token, {
        httpOnly: false,
        sameSite: 'lax',
        maxAge: 10 * 60 * 1000 // 10 分钟
      });
    }

    // 检查游戏文件是否存在
    const gameDir = path.join(STORAGE_CONFIG.GAMES_PATH, game.path);
    const indexPath = path.join(gameDir, 'index.html');
    
    if (!fsSync.existsSync(indexPath)) {
      return res.status(404).json({
        success: false,
        message: '游戏文件不存在或损坏'
      });
    }
    
    // 直接重定向到 index.html，使用新的API路径避免循环
    res.redirect(`/api/game-content/${game.id}/index.html`);
  } catch (error) {
    console.error('游戏访问失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 记录游戏开始游玩
router.post('/:gameId/start', authenticateToken, async (req, res) => {
  try {
    const { gameId } = req.params;
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '请先登录'
      });
    }

    // 查找游戏
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true, name: true, status: true }
    });

    if (!game) {
      return res.status(404).json({
        success: false,
        message: '游戏不存在'
      });
    }

    // 检查权限（与checkGameAccess逻辑一致）
    let hasAccess = false;
    if (user.role === 'ADMIN') {
      hasAccess = true;
    } else if (game.status === 'PUBLISHED') {
      const userGameActivation = await prisma.userGameActivation.findUnique({
        where: {
          userId_gameId: {
            userId: user.id,
            gameId: gameId
          }
        }
      });
      hasAccess = !!userGameActivation;
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: '没有访问权限'
      });
    }

    // 记录游戏开始事件
    // if (user) {
    //   await createSecurityRiskLog({
    //     userId: user.id,
    //     gameId: game.id,
    //     ip: req.ip,
    //     action: 'START',
    //     details: `用户 ${user.username} 开始游玩游戏 ${game.name}`
    //   });
    // }

    res.json({
      success: true,
      message: '游戏开始记录成功'
    });
  } catch (error) {
    console.error('记录游戏开始失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 记录游戏结束游玩
router.post('/:gameId/end', authenticateToken, async (req, res) => {
  try {
    const { gameId } = req.params;
    const user = (req as any).user;
    const { duration } = req.body; // 游玩时长（秒）

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '请先登录'
      });
    }

    // 查找游戏
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true, name: true }
    });

    if (!game) {
      return res.status(404).json({
        success: false,
        message: '游戏不存在'
      });
    }

    // 这里可以添加游玩时长的统计逻辑
    if (duration && typeof duration === 'number' && duration > 0) {
      // 可以在这里更新用户的游戏统计数据
      // 比如总游玩时长、游玩次数等
    }

    // 记录游戏结束事件
    // if (user) {
    //   await createSecurityRiskLog({
    //     userId: user.id,
    //     gameId: game.id,
    //     ip: req.ip,
    //     action: 'END',
    //     details: `用户 ${user.username} 结束游玩游戏 ${game.name}`
    //   });
    // }

    res.json({
      success: true,
      message: '游戏结束记录成功'
    });
  } catch (error) {
    console.error('记录游戏结束失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

export default router;
