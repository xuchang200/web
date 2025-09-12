import { addDays, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from 'date-fns';
import prisma from '../../lib/prisma';

export interface DashboardMetrics {
  // 核心指标
  totalUsers: number;
  totalGames: number;
  totalActivations: number;
  totalActivationCodes: number;
  
  // 趋势指标
  userGrowthRate: number;
  activationRate: number;
  
  // 实时指标
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
    playActivationRatio: number; // 激活游玩比：playCount / activationCount
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

// 获取仪表盘核心指标
export const getDashboardMetrics = async (): Promise<DashboardMetrics> => {
  const now = new Date();
  const yesterday = subDays(now, 1);

  const [
    totalUsers,
    totalGames,
    totalActivations,
    totalActivationCodes,
    usersYesterday,
    activationsYesterday,
    activeUsersToday,
    activationsToday,
    newUsersToday
  ] = await Promise.all([
    prisma.user.count(),
    prisma.game.count({ where: { status: 'PUBLISHED' } }),
    prisma.userGameActivation.count(),
    prisma.activationCode.count(),
    prisma.user.count({ where: { createdAt: { lte: yesterday } } }),
    prisma.userGameActivation.count({ where: { activatedAt: { lte: yesterday } } }),
    prisma.user.count({
      where: {
        lastLoginAt: {
          gte: startOfDay(now)
        }
      }
    }),
    prisma.userGameActivation.count({
      where: {
        activatedAt: {
          gte: startOfDay(now)
        }
      }
    }),
    prisma.user.count({
      where: {
        createdAt: {
          gte: startOfDay(now)
        }
      }
    })
  ]);

  // 计算增长率
  const userGrowthRate = usersYesterday > 0 ? ((totalUsers - usersYesterday) / usersYesterday) * 100 : 0;
  const activationRate = totalActivationCodes > 0 ? (totalActivations / totalActivationCodes) * 100 : 0;

  return {
    totalUsers,
    totalGames,
    totalActivations,
    totalActivationCodes,
    userGrowthRate,
    activationRate,
    activeUsersToday,
    activationsToday,
    newUsersToday
  };
};

// 获取用户分析数据
export const getUserAnalytics = async (): Promise<UserAnalytics> => {
  const now = new Date();

  // 注册趋势 (最近30天)
  const registrationTrend = [];
  for (let i = 29; i >= 0; i--) {
    const date = subDays(now, i);
    const count = await prisma.user.count({
      where: {
        createdAt: {
          gte: startOfDay(date),
          lte: endOfDay(date)
        }
      }
    });
    registrationTrend.push({
      date: format(date, 'yyyy-MM-dd'),
      count
    });
  }

  // 登录趋势 (最近30天)
  const loginTrend = [];
  for (let i = 29; i >= 0; i--) {
    const date = subDays(now, i);
    const count = await prisma.log.count({
      where: {
        type: 'USER_LOGIN',
        createdAt: {
          gte: startOfDay(date),
          lte: endOfDay(date)
        }
      }
    });
    loginTrend.push({
      date: format(date, 'yyyy-MM-dd'),
      count
    });
  }

  // 用户角色分布
  const roleDistribution = await prisma.user.groupBy({
    by: ['role'],
    _count: {
      _all: true
    }
  });

  const totalUsers = await prisma.user.count();
  const userRoleDistribution = roleDistribution.map(item => ({
    role: item.role,
    count: item._count._all,
    percentage: totalUsers > 0 ? (item._count._all / totalUsers) * 100 : 0
  }));

  // 最近注册用户
  const recentRegistrations = await prisma.user.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      username: true,
      email: true,
      createdAt: true
    }
  });

  const recentRegistrationsList = recentRegistrations.map(user => ({
    userId: user.id,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt
  }));

  return {
    registrationTrend,
    loginTrend,
    userRoleDistribution,
    recentRegistrations: recentRegistrationsList
  };
};

// 获取游戏分析数据
export const getGameAnalytics = async (): Promise<GameAnalytics> => {
  // 游戏状态分布
  const statusDistribution = await prisma.game.groupBy({
    by: ['status'],
    _count: {
      _all: true
    }
  });

  const totalGames = await prisma.game.count();
  const gamesByStatus = statusDistribution.map(item => ({
    status: item.status,
    count: item._count._all,
    percentage: totalGames > 0 ? (item._count._all / totalGames) * 100 : 0
  }));

  // 热门游戏排行
  const popularGames = await prisma.game.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { activationCount: 'desc' },
    take: 10,
    select: {
      id: true,
      name: true,
      activationCount: true,
      playCount: true,
      createdAt: true
    }
  });

  const popularGamesList = popularGames.map(game => {
    // 计算激活游玩比：如果激活数为0，比率为0；否则为游玩次数/激活次数
    const playActivationRatio = game.activationCount > 0 ? 
      Number((game.playCount / game.activationCount).toFixed(2)) : 0;
    
    return {
      gameId: game.id,
      gameName: game.name,
      activationCount: game.activationCount,
      playCount: game.playCount,
      createdAt: game.createdAt,
      playActivationRatio
    };
  });

  // 游戏激活数据
  const activationsByGame = await prisma.userGameActivation.groupBy({
    by: ['gameId'],
    _count: {
      gameId: true
    },
    orderBy: { _count: { gameId: 'desc' } }
  });

  const gameIds = activationsByGame.map(item => item.gameId);
  const games = await prisma.game.findMany({
    where: { id: { in: gameIds } },
    select: { id: true, name: true }
  });

  const gameMap = new Map(games.map(game => [game.id, game.name]));
  const activationsByGameList = activationsByGame.map(item => ({
    gameId: item.gameId,
    gameName: gameMap.get(item.gameId) || 'Unknown',
    activations: item._count.gameId
  }));

  // 游戏创建趋势 (最近30天)
  const now = new Date();
  const gameCreationTrend = [];
  for (let i = 29; i >= 0; i--) {
    const date = subDays(now, i);
    const count = await prisma.game.count({
      where: {
        createdAt: {
          gte: startOfDay(date),
          lte: endOfDay(date)
        }
      }
    });
    gameCreationTrend.push({
      date: format(date, 'yyyy-MM-dd'),
      count
    });
  }

  return {
    gamesByStatus,
    popularGames: popularGamesList,
    activationsByGame: activationsByGameList,
    gameCreationTrend
  };
};

// 获取激活分析数据
export const getActivationAnalytics = async (): Promise<ActivationAnalytics> => {
  // 激活码状态分布
  const statusDistribution = await prisma.activationCode.groupBy({
    by: ['status'],
    _count: {
      _all: true
    }
  });

  const totalCodes = await prisma.activationCode.count();
  const codeStatusDistribution = statusDistribution.map(item => ({
    status: item.status,
    count: item._count._all,
    percentage: totalCodes > 0 ? (item._count._all / totalCodes) * 100 : 0
  }));

  // 激活趋势 (最近30天)
  const now = new Date();
  const activationTrend = [];
  for (let i = 29; i >= 0; i--) {
    const date = subDays(now, i);
    const count = await prisma.userGameActivation.count({
      where: {
        activatedAt: {
          gte: startOfDay(date),
          lte: endOfDay(date)
        }
      }
    });
    activationTrend.push({
      date: format(date, 'yyyy-MM-dd'),
      count
    });
  }

  // 最近激活记录
  const recentActivations = await prisma.userGameActivation.findMany({
    take: 10,
    orderBy: { activatedAt: 'desc' },
    include: {
      game: { select: { name: true } }
    }
  });

  const recentActivationsList = recentActivations.map(activation => ({
    activationId: activation.id,
    userId: activation.userId,
    gameId: activation.gameId,
    gameName: activation.game.name,
    activatedAt: activation.activatedAt
  }));

  // 按小时统计激活数据
  const activationsByTimeOfDay = [];
  for (let hour = 0; hour < 24; hour++) {
    const count = await prisma.userGameActivation.count({
      where: {
        activatedAt: {
          gte: subDays(now, 7) // 最近7天
        }
      }
    });
    
    // 这里需要更复杂的查询来按小时分组，暂时使用简化版本
    activationsByTimeOfDay.push({
      hour,
      count: Math.floor(count / 24) // 简化计算
    });
  }

  return {
    codeStatusDistribution,
    activationTrend,
    recentActivations: recentActivationsList,
    activationsByTimeOfDay
  };
};

// 获取系统分析数据
export const getSystemAnalytics = async (): Promise<SystemAnalytics> => {
  // 日志类型分布
  const logTypeDistribution = await prisma.log.groupBy({
    by: ['type'],
    _count: {
      type: true
    },
    orderBy: { _count: { type: 'desc' } }
  });

  const logTypeDistributionList = logTypeDistribution.map(item => ({
    type: item.type,
    count: item._count.type
  }));

  // 安全事件统计
  const securityLogTypes = [
    'USER_LOGIN_FAILED',
    'SECURITY_UNAUTHORIZED_ACCESS',
    'SECURITY_RATE_LIMIT_EXCEEDED',
    'SECURITY_SUSPICIOUS_ACTIVITY',
    'SECURITY_IP_BLOCKED'
  ];

  const securityEvents = await Promise.all(
    securityLogTypes.map(async (type) => {
      const count = await prisma.log.count({
        where: { type: type as any }
      });
      const lastEvent = await prisma.log.findFirst({
        where: { type: type as any },
        orderBy: { createdAt: 'desc' }
      });
      
      return {
        type,
        count,
        lastOccurred: lastEvent?.createdAt || new Date(0)
      };
    })
  );

  // 系统活动趋势 (最近30天)
  const now = new Date();
  const systemActivity = [];
  for (let i = 29; i >= 0; i--) {
    const date = subDays(now, i);
    const totalLogs = await prisma.log.count({
      where: {
        createdAt: {
          gte: startOfDay(date),
          lte: endOfDay(date)
        }
      }
    });
    systemActivity.push({
      date: format(date, 'yyyy-MM-dd'),
      totalLogs
    });
  }

  return {
    logTypeDistribution: logTypeDistributionList,
    securityEvents,
    systemActivity
  };
};

// 获取实时指标
export const getRealTimeMetrics = async (): Promise<RealTimeMetrics> => {
  const now = new Date();

  // 最近活动
  const recentActivities = await prisma.log.findMany({
    take: 20,
    orderBy: { createdAt: 'desc' },
    select: {
      type: true,
      message: true,
      createdAt: true,
      userId: true,
      gameId: true
    }
  });

  const recentActivitiesList = recentActivities.map(activity => ({
    type: activity.type,
    message: activity.message,
    timestamp: activity.createdAt,
    userId: activity.userId || undefined,
    gameId: activity.gameId || undefined
  }));

  // 今日统计
  const [newUsers, activations, logins] = await Promise.all([
    prisma.user.count({
      where: {
        createdAt: {
          gte: startOfDay(now)
        }
      }
    }),
    prisma.userGameActivation.count({
      where: {
        activatedAt: {
          gte: startOfDay(now)
        }
      }
    }),
    prisma.log.count({
      where: {
        type: 'USER_LOGIN',
        createdAt: {
          gte: startOfDay(now)
        }
      }
    })
  ]);

  return {
    recentActivities: recentActivitiesList,
    todayStats: {
      newUsers,
      activations,
      logins
    }
  };
};
