// 模拟API实现
export const mockAPI = {
  // 认证相关API
  auth: {
    async login(data: { username: string; password: string }) {
      // 模拟登录
      if (data.username === 'admin' && data.password === 'admin') {
        return {
          token: 'mock_jwt_token_12345',
          user: {
            id: '1',
            username: 'admin',
            email: 'admin@example.com',
            role: 'ADMIN'
          }
        }
      } else if (data.username === 'user' && data.password === 'user') {
        return {
          token: 'mock_jwt_token_67890',
          user: {
            id: '2',
            username: 'user',
            email: 'user@example.com',
            role: 'USER'
          }
        }
      } else {
        throw new Error('用户名或密码错误')
      }
    },

    async register(data: { username: string; email: string; password: string }) {
      // 模拟注册
      return {
        user: {
          id: Math.random().toString(),
          username: data.username,
          email: data.email,
          role: 'USER'
        },
        message: '注册成功'
      }
    },

    async getUserProfile() {
      return {
        id: '1',
        username: 'admin',
        email: 'admin@example.com',
        role: 'ADMIN',
        avatar: 'https://avatars.githubusercontent.com/u/1?v=4',
        createdAt: '2024-01-01T00:00:00Z'
      }
    }
  },

  // 游戏相关API
  game: {
    async getGames() {
      return [
        {
          id: '1',
          title: '示例游戏1',
          description: '这是一个示例游戏',
          coverImage: '/images/game1.jpg',
          status: 'PUBLISHED',
          createdAt: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          title: '示例游戏2',
          description: '这是另一个示例游戏',
          coverImage: '/images/game2.jpg',
          status: 'PUBLISHED',
          createdAt: '2024-01-02T00:00:00Z'
        }
      ]
    },

    async getGameById(id: string) {
      const games = await this.getGames()
      const game = games.find(g => g.id === id)
      if (!game) {
        throw new Error('游戏不存在')
      }
      return {
        ...game,
        content: '游戏详细内容...',
        downloadUrl: `/api/games/${id}/download`
      }
    }
  },

  // 设置相关API
  settings: {
    async getPublicSettings() {
      return {
        siteName: 'withU游戏平台',
        siteDescription: '和ta一起玩游戏',
        enableRegistration: true,
        enableGameActivation: true,
        maxUploadSize: 10485760,
        allowedFileTypes: ['zip', 'rar', '7z']
      }
    },

    async getStats() {
      return {
        totalUsers: 1250,
        totalGames: 42,
        activeUsers: 89,
        todayRegistrations: 12
      }
    }
  },

  // 管理员相关API
  admin: {
    async getAllGames() {
      return [
        {
          id: '1',
          title: '示例游戏1',
          description: '这是一个示例游戏',
          status: 'PUBLISHED',
          author: 'admin',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          title: '示例游戏2',
          description: '这是另一个示例游戏',
          status: 'DRAFT',
          author: 'admin',
          createdAt: '2024-01-02T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z'
        }
      ]
    },

    async getAllUsers() {
      return [
        {
          id: '1',
          username: 'admin',
          email: 'admin@example.com',
          role: 'ADMIN',
          status: 'ACTIVE',
          createdAt: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          username: 'user',
          email: 'user@example.com',
          role: 'USER',
          status: 'ACTIVE',
          createdAt: '2024-01-02T00:00:00Z'
        }
      ]
    },

    async createGame(data: any) {
      return {
        id: Math.random().toString(),
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    },

    async updateGame(id: string, data: any) {
      return {
        id,
        ...data,
        updatedAt: new Date().toISOString()
      }
    },

    async deleteGame(id: string) {
      return {
        message: `游戏 ${id} 已删除`
      }
    }
  }
}
