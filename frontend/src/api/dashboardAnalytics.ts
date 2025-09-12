import request from './request';

export interface DashboardMetrics {
  totalUsers: number;
  totalGames: number;
  totalActivations: number;
  totalActivationCodes: number;
  userGrowthRate: number;
  activationRate: number;
  activeUsersToday: number;
  activationsToday: number;
  newUsersToday: number;
}

export interface UserAnalytics {
  registrationTrend: Array<{ date: string; count: number; }>;
  loginTrend: Array<{ date: string; count: number; }>;
  userRoleDistribution: Array<{ role: string; count: number; percentage: number; }>;
  recentRegistrations: Array<{
    userId: string;
    username: string;
    email: string;
    createdAt: Date;
  }>;
}

export interface GameAnalytics {
  gamesByStatus: Array<{ status: string; count: number; percentage: number; }>;
  popularGames: Array<{
    gameId: string;
    gameName: string;
    activationCount: number;
    playCount: number;
    createdAt: Date;
    playActivationRatio: number;
  }>;
  activationsByGame: Array<{
    gameId: string;
    gameName: string;
    activations: number;
  }>;
  gameCreationTrend: Array<{ date: string; count: number; }>;
}

export interface ActivationAnalytics {
  codeStatusDistribution: Array<{ status: string; count: number; percentage: number; }>;
  activationTrend: Array<{ date: string; count: number; }>;
  recentActivations: Array<{
    activationId: string;
    userId: string;
    gameId: string;
    gameName: string;
    activatedAt: Date;
  }>;
  activationsByTimeOfDay: Array<{ hour: number; count: number; }>;
}

export interface SystemAnalytics {
  logTypeDistribution: Array<{ type: string; count: number; }>;
  securityEvents: Array<{
    type: string;
    count: number;
    lastOccurred: Date;
  }>;
  systemActivity: Array<{ date: string; totalLogs: number; }>;
}

export interface RealTimeMetrics {
  recentActivities: Array<{
    type: string;
    message: string;
    timestamp: Date;
    userId?: string;
    gameId?: string;
  }>;
  todayStats: {
    newUsers: number;
    activations: number;
    logins: number;
  };
}

export interface ComprehensiveDashboard {
  metrics: DashboardMetrics;
  userAnalytics: UserAnalytics;
  gameAnalytics: GameAnalytics;
  activationAnalytics: ActivationAnalytics;
  systemAnalytics: SystemAnalytics;
  realTimeMetrics: RealTimeMetrics;
}

// API 接口
export const dashboardAnalyticsApi = {
  // 获取核心指标
  getMetrics(): Promise<{ data: DashboardMetrics }> {
    return request({ url: '/admin/analytics/metrics', method: 'get' });
  },

  // 获取用户分析数据
  getUserAnalytics(): Promise<{ data: UserAnalytics }> {
    return request({ url: '/admin/analytics/user-analytics', method: 'get' });
  },

  // 获取游戏分析数据
  getGameAnalytics(): Promise<{ data: GameAnalytics }> {
    return request({ url: '/admin/analytics/game-analytics', method: 'get' });
  },

  // 获取激活分析数据
  getActivationAnalytics(): Promise<{ data: ActivationAnalytics }> {
    return request({ url: '/admin/analytics/activation-analytics', method: 'get' });
  },

  // 获取系统分析数据
  getSystemAnalytics(): Promise<{ data: SystemAnalytics }> {
    return request({ url: '/admin/analytics/system-analytics', method: 'get' });
  },

  // 获取实时指标
  getRealTimeMetrics(): Promise<{ data: RealTimeMetrics }> {
    return request({ url: '/admin/analytics/realtime-metrics', method: 'get' });
  },

  // 获取综合仪表盘数据
  getComprehensiveDashboard(): Promise<{ data: ComprehensiveDashboard }> {
    return request({ url: '/admin/analytics/comprehensive', method: 'get' });
  }
};
