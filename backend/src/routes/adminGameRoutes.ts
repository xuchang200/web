import express from 'express';
import { authenticateToken, requireAdmin } from '../middlewares/authMiddleware';
import {
  getGamesForAdmin,
  getGameDetail,
  createGame,
  updateGame,
  deleteGame,
  deleteGames,
  toggleGameStatus
} from '../controllers/gameController';

const router = express.Router();

// 所有管理员游戏路由都需要认证和管理员权限
router.use(authenticateToken);
router.use(requireAdmin);

// 获取游戏列表（管理员）
router.get('/', getGamesForAdmin);

// 获取游戏详情
router.get('/:id', getGameDetail);

// 创建游戏
router.post('/', createGame);

// 更新游戏
router.put('/:id', updateGame);

// 删除单个游戏
router.delete('/:id', deleteGame);

// 批量删除游戏
router.post('/batch-delete', deleteGames);

// 切换游戏状态（发布/下架）
router.patch('/:id/toggle-status', toggleGameStatus);

export default router;