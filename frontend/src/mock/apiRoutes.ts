// API路由到模拟API的映射
import { mockAPI } from './mockAPI'

// URL路径到模拟API方法的映射
export const apiRouteMap = {
  // 认证相关
  'POST:/auth/login': async (data: any) => {
    return await mockAPI.auth.login(data)
  },
  
  'POST:/auth/register': async (data: any) => {
    return await mockAPI.auth.register(data)
  },
  
  'POST:/auth/logout': async () => {
    return { message: '登出成功' }
  },
  
  'POST:/auth/refresh': async () => {
    return { token: 'mock_jwt_token_refreshed_12345' }
  },
  
  // 用户相关
  'GET:/user/profile': async () => {
    return await mockAPI.auth.getUserProfile()
  },
  
  // 游戏相关
  'GET:/game/list': async () => {
    const games = await mockAPI.game.getGames()
    return {
      games: games,
      pagination: {
        total: games.length,
        page: 1,
        pageSize: 10,
        totalPages: Math.ceil(games.length / 10)
      }
    }
  },
  
  'GET:/game/detail': async (_data: any, url: string) => {
    // 从URL参数中提取游戏ID
    const urlParams = new URLSearchParams(url.split('?')[1])
    const id = urlParams.get('id') || '1'
    return await mockAPI.game.getGameById(id)
  },
  
  // 公共设置
  'GET:/public/settings/site-basic': async () => {
    return await mockAPI.settings.getPublicSettings()
  },
  
  'GET:/public/announcements': async () => {
    return {
      items: [
        {
          id: '1',
          title: '欢迎使用withU游戏平台！',
          content: '这是一个演示公告，欢迎大家使用我们的平台和ta一起玩游戏！',
          type: 'info',
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z'
        }
      ],
      total: 1
    }
  },
  
  // 管理员相关
  'GET:/admin/dashboard/stats': async () => {
    return await mockAPI.settings.getStats()
  },
  
  'GET:/admin/games': async () => {
    const games = await mockAPI.admin.getAllGames()
    return {
      items: games,
      total: games.length,
      page: 1,
      pageSize: 10
    }
  },
  
  'GET:/admin/users': async () => {
    const users = await mockAPI.admin.getAllUsers()
    return {
      items: users,
      total: users.length,
      page: 1,
      pageSize: 10
    }
  },
  
  'POST:/admin/games': async (data: any) => {
    return await mockAPI.admin.createGame(data)
  },
  
  'PUT:/admin/games': async (data: any, url: string) => {
    // 从URL参数中提取游戏ID
    const urlParams = new URLSearchParams(url.split('?')[1])
    const id = urlParams.get('id') || data.id
    return await mockAPI.admin.updateGame(id, data)
  },
  
  'DELETE:/admin/games': async (data: any, url: string) => {
    // 从URL参数中提取游戏ID
    const urlParams = new URLSearchParams(url.split('?')[1])
    const id = urlParams.get('id') || data.id
    return await mockAPI.admin.deleteGame(id)
  }
}

// 处理模拟API请求的主函数
export async function handleMockApiRequest(
  method: string, 
  url: string, 
  data?: any
): Promise<any> {
  // 移除查询参数，构建路由键
  const baseUrl = url.split('?')[0]
  const routeKey = `${method.toUpperCase()}:${baseUrl}`
  
  console.log(`🔍 查找模拟API路由: ${routeKey}`)
  
  const handler = apiRouteMap[routeKey as keyof typeof apiRouteMap]
  
  if (!handler) {
    throw new Error(`模拟API未实现: ${routeKey}`)
  }
  
  try {
    const result = await handler(data, url)
    console.log(`✅ 模拟API成功: ${routeKey}`, result)
    return result
  } catch (error) {
    console.error(`❌ 模拟API错误: ${routeKey}`, error)
    throw error
  }
}