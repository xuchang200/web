import express from 'express';
import { getPublishedGames, incrementPlayCount, checkGameAccess } from '../controllers/gameController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = express.Router();

// 获取已发布的游戏列表（公开接口）
router.get('/list', getPublishedGames);

// 增加游戏播放次数（需要登录）
router.post('/:id/play', authenticateToken, incrementPlayCount);

// 验证用户游戏访问权限（需要登录）
router.get('/:id/access', authenticateToken, checkGameAccess);

export default router;