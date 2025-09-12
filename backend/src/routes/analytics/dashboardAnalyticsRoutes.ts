import express from 'express';
import * as dashboardAnalyticsController from '../../controllers/analytics/dashboardAnalyticsController';
import { authenticateToken, requireAdmin } from '../../middlewares/authMiddleware';

const router = express.Router();

// 应用认证和管理员权限中间件
router.use(authenticateToken);
router.use(requireAdmin);

// 核心指标
router.get('/metrics', dashboardAnalyticsController.getDashboardMetrics);

// 用户分析
router.get('/user-analytics', dashboardAnalyticsController.getUserAnalytics);

// 游戏分析
router.get('/game-analytics', dashboardAnalyticsController.getGameAnalytics);

// 激活分析
router.get('/activation-analytics', dashboardAnalyticsController.getActivationAnalytics);

// 系统分析
router.get('/system-analytics', dashboardAnalyticsController.getSystemAnalytics);

// 实时指标
router.get('/realtime-metrics', dashboardAnalyticsController.getRealTimeMetrics);

// 综合仪表盘数据
router.get('/comprehensive', dashboardAnalyticsController.getComprehensiveDashboard);

export default router;
