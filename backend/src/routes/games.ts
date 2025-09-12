import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// 扩展Request接口以包含user属性
interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    username: string;
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
    const games = await prisma.games.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        version: true,
        cover_image: true,
        play_count: true,
        file_size: true,
        created_at: true
      },
      orderBy: {
        created_at: 'desc'
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

// 获取游戏详情
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const gameId = parseInt(req.params.id);
    
    if (isNaN(gameId)) {
      return res.status(400).json({
        success: false,
        message: '无效的游戏ID'
      });
    }

    const game = await prisma.games.findUnique({
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
    const userId = req.user!.userId;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: '激活码不能为空'
      });
    }

    // 查找激活码
    const activationCode = await prisma.activation_codes.findUnique({
      where: { code },
      include: {
        games: true
      }
    });

    if (!activationCode) {
      return res.status(400).json({
        success: false,
        message: '激活码不存在'
      });
    }

    if (activationCode.used) {
      return res.status(400).json({
        success: false,
        message: '激活码已被使用'
      });
    }

    // 检查用户是否已拥有该游戏
    const existingUserGame = await prisma.user_games.findFirst({
      where: {
        user_id: userId,
        game_id: activationCode.game_id
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
      prisma.activation_codes.update({
        where: { id: activationCode.id },
        data: {
          used: true,
          used_by: userId,
          used_at: new Date()
        }
      }),
      // 添加用户游戏记录
      prisma.user_games.create({
        data: {
          user_id: userId,
          game_id: activationCode.game_id
        }
      })
    ]);

    res.json({
      success: true,
      message: '游戏激活成功',
      data: {
        game: activationCode.games
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
    const userId = req.user!.userId;

    const userGames = await prisma.user_games.findMany({
      where: { user_id: userId },
      include: {
        games: true
      },
      orderBy: {
        activated_at: 'desc'
      }
    });

    interface UserGameWithActivation {
      id: number;
      title: string;
      description: string | null;
      version: string | null;
      file_path: string;
      cover_image: string | null;
      play_count: number;
      file_size: bigint | null;
      created_at: Date;
      updated_at: Date;
      activatedAt: Date;
      lastPlayed: Date | null;
    }

    const gamesWithActivationTime: UserGameWithActivation[] = userGames.map((userGame: any) => ({
      ...userGame.games,
      activatedAt: userGame.activated_at,
      lastPlayed: userGame.last_played
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
    const gameId = parseInt(req.params.id);
    const userId = req.user!.userId;

    if (isNaN(gameId)) {
      return res.status(400).json({
        success: false,
        message: '无效的游戏ID'
      });
    }

    // 检查用户是否拥有该游戏
    const userGame = await prisma.user_games.findFirst({
      where: {
        user_id: userId,
        game_id: gameId
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
      prisma.games.update({
        where: { id: gameId },
        data: {
          play_count: {
            increment: 1
          }
        }
      }),
      // 更新用户最后游玩时间
      prisma.user_games.update({
        where: { id: userGame.id },
        data: {
          last_played: new Date()
        }
      })
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