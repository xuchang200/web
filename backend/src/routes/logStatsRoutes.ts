import express from 'express'
import { authenticateToken, requireAdmin } from '../middlewares/authMiddleware'
import {
  getLogStats,
  getLogTypeStats,
  getDailyLogStats,
  getPopularOperations
} from '../controllers/logStatsController'

const router = express.Router()

// 所有统计路由都需要管理员权限
router.use(authenticateToken)
router.use(requireAdmin)

// 获取日志统计概览
router.get('/overview', getLogStats)

// 获取日志类型分布统计
router.get('/types', getLogTypeStats)

// 获取每日日志统计
router.get('/daily', getDailyLogStats)

// 获取热门操作统计
router.get('/popular', getPopularOperations)

export default router
