import request from './request';

// 基础统计数据
export const getDashboardStats = () => {
  return request({
    url: '/dashboard/stats',
    method: 'get',
  });
};

export const getGameActivationRank = () => {
  return request({
    url: '/dashboard/game-activation-rank',
    method: 'get',
  });
};

export const getUserRegistrationTrend = () => {
  return request({
    url: '/dashboard/user-registration-trend',
    method: 'get',
  });
};

export const getGamePlayRanking = () => {
  return request({
    url: '/dashboard/game-play-ranking',
    method: 'get',
  });
};

export const getUserActivityStats = () => {
  return request({
    url: '/dashboard/user-activity-stats',
    method: 'get',
  });
};

export const getRecentActivities = (limit?: number) => {
  return request({
    url: '/dashboard/recent-activities',
    method: 'get',
    params: { limit },
  });
};

// 商业分析数据
export const getRevenueAnalysis = () => {
  return request({
    url: '/dashboard/revenue-analysis',
    method: 'get',
  });
};

export const getUserBehaviorAnalysis = () => {
  return request({
    url: '/dashboard/user-behavior-analysis',
    method: 'get',
  });
};

export const getGamePerformanceAnalysis = () => {
  return request({
    url: '/dashboard/game-performance-analysis',
    method: 'get',
  });
};

export const getActivationTrend = (days?: number) => {
  return request({
    url: '/dashboard/activation-trend',
    method: 'get',
    params: { days },
  });
};

export const getUserGeographicDistribution = () => {
  return request({
    url: '/dashboard/user-geographic-distribution',
    method: 'get',
  });
};

// 深度分析数据
export const getUserActivityHeatmap = () => {
  return request({
    url: '/dashboard/user-activity-heatmap',
    method: 'get',
  });
};

export const getSecurityStats = () => {
  return request({
    url: '/dashboard/security-stats',
    method: 'get',
  });
};

export const getGameUsagePatterns = () => {
  return request({
    url: '/dashboard/game-usage-patterns',
    method: 'get',
  });
};