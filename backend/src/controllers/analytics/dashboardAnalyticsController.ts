import { Request, Response, NextFunction } from 'express';
import * as dashboardAnalyticsService from '../../services/analytics/dashboardAnalyticsService';

// 获取仪表盘核心指标
export const getDashboardMetrics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const metrics = await dashboardAnalyticsService.getDashboardMetrics();
    res.json({ success: true, data: metrics });
  } catch (error) {
    next(error);
  }
};

// 获取用户分析数据
export const getUserAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const analytics = await dashboardAnalyticsService.getUserAnalytics();
    res.json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
};

// 获取游戏分析数据
export const getGameAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const analytics = await dashboardAnalyticsService.getGameAnalytics();
    res.json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
};

// 获取激活分析数据
export const getActivationAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const analytics = await dashboardAnalyticsService.getActivationAnalytics();
    res.json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
};

// 获取系统分析数据
export const getSystemAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const analytics = await dashboardAnalyticsService.getSystemAnalytics();
    res.json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
};

// 获取实时指标
export const getRealTimeMetrics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const metrics = await dashboardAnalyticsService.getRealTimeMetrics();
    res.json({ success: true, data: metrics });
  } catch (error) {
    next(error);
  }
};

// 获取综合仪表盘数据（一次性获取所有数据）
export const getComprehensiveDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      metrics,
      userAnalytics,
      gameAnalytics,
      activationAnalytics,
      systemAnalytics,
      realTimeMetrics
    ] = await Promise.all([
      dashboardAnalyticsService.getDashboardMetrics(),
      dashboardAnalyticsService.getUserAnalytics(),
      dashboardAnalyticsService.getGameAnalytics(),
      dashboardAnalyticsService.getActivationAnalytics(),
      dashboardAnalyticsService.getSystemAnalytics(),
      dashboardAnalyticsService.getRealTimeMetrics()
    ]);

    res.json({
      success: true,
      data: {
        metrics,
        userAnalytics,
        gameAnalytics,
        activationAnalytics,
        systemAnalytics,
        realTimeMetrics
      }
    });
  } catch (error) {
    next(error);
  }
};
