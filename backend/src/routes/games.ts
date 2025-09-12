import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

const router = express.Router();

// 扩展Request接口以包含user属性
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: 'ADMIN' | 'USER';
  };
}

// JWT验证中间件
const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: '未提供认证令牌'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: '认证令牌无效'
    });
  }
};

// 获取所有游戏列表
router.get('/', async (req: Request, res: Response) => {
  try {
    const games = await prisma.game.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        coverImage: true,
        playCount: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: games
    });

  } catch (error) {
    console.error('获取游戏列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 获取单个游戏信息
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const gameId = req.params.id;

    if (!gameId) {
      return res.status(400).json({
        success: false,
        message: '无效的游戏ID'
      });
    }

    const game = await prisma.game.findUnique({
      where: { id: gameId }
    });

    if (!game) {
      return res.status(404).json({
        success: false,
        message: '游戏不存在'
      });
    }

    res.json({
      success: true,
      data: game
    });

  } catch (error) {
    console.error('获取游戏详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 激活游戏
router.post('/activate', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code } = req.body;
    const userId = req.user!.id;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: '激活码不能为空'
      });
    }

    // 查找激活码
    const activationCode = await prisma.activationCode.findUnique({
      where: { code },
      include: {
        game: true
      }
    });

    if (!activationCode) {
      return res.status(400).json({
        success: false,
        message: '激活码不存在'
      });
    }

    if (activationCode.status === 'ACTIVATED') {
      return res.status(400).json({
        success: false,
        message: '激活码已被使用'
      });
    }

    // 检查用户是否已拥有该游戏
    const existingUserGame = await prisma.userGameActivation.findFirst({
      where: {
        userId: userId,
        gameId: activationCode.gameId
      }
    });

    if (existingUserGame) {
      return res.status(400).json({
        success: false,
        message: '您已拥有该游戏'
      });
    }

    // 激活游戏（使用事务）
    await prisma.$transaction([
      // 标记激活码为已使用
      prisma.activationCode.update({
        where: { id: activationCode.id },
        data: {
          status: 'ACTIVATED',
          userId: userId,
          activatedAt: new Date()
        }
      }),
      // 添加用户游戏记录
      prisma.userGameActivation.create({
        data: {
          userId: userId,
          gameId: activationCode.gameId
        }
      })
    ]);

    res.json({
      success: true,
      message: '游戏激活成功',
      data: {
        game: activationCode.game
      }
    });

  } catch (error) {
    console.error('激活游戏错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 获取用户的游戏列表
router.get('/my/games', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const userGames = await prisma.userGameActivation.findMany({
      where: { userId: userId },
      include: {
        game: true
      },
      orderBy: {
        activatedAt: 'desc'
      }
    });

    const gamesWithActivationTime = userGames.map((userGame) => ({
      ...userGame.game,
      activatedAt: userGame.activatedAt
    }));

    res.json({
      success: true,
      data: gamesWithActivationTime
    });

  } catch (error) {
    console.error('获取用户游戏错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 记录游戏游玩（更新游玩次数和最后游玩时间）
router.post('/:id/play', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const gameId = req.params.id;
    const userId = req.user!.id;

    if (!gameId) {
      return res.status(400).json({
        success: false,
        message: '无效的游戏ID'
      });
    }

    // 检查用户是否拥有该游戏
    const userGame = await prisma.userGameActivation.findFirst({
      where: {
        userId: userId,
        gameId: gameId
      }
    });

    if (!userGame) {
      return res.status(403).json({
        success: false,
        message: '您尚未拥有该游戏'
      });
    }

    // 更新游戏信息（使用事务）
    await prisma.$transaction([
      // 增加游戏总游玩次数
      prisma.game.update({
        where: { id: gameId },
        data: {
          playCount: {
            increment: 1
          }
        }
      })
      // 注意：UserGameActivation 模型没有 lastPlayed 字段，因此移除相关更新
    ]);

    res.json({
      success: true,
      message: '游戏启动记录成功'
    });

  } catch (error) {
    console.error('记录游戏游玩错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

export default router;