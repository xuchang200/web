import Mock from 'mockjs'

// 用户数据
Mock.mock('/api/users', 'get', {
  code: 200,
  message: 'success',
  data: {
    list: [
      // 真实用户数据
      {
        id: 1,
        username: '管理员',
        email: 'admin@loveislove.com',
        avatar: 'https://avatars.githubusercontent.com/u/1?v=4',
        status: 'active',
        registerTime: '2024-01-15 10:30:00',
        lastLoginTime: '2025-09-07 15:00:00'
      },
      {
        id: 2,
        username: '测试用户001',
        email: 'user001@example.com',
        avatar: 'https://avatars.githubusercontent.com/u/2?v=4',
        status: 'active',
        registerTime: '2024-03-20 14:20:00',
        lastLoginTime: '2025-09-06 18:30:00'
      },
      {
        id: 3,
        username: '开发者小李',
        email: 'developer@loveislove.com',
        avatar: 'https://avatars.githubusercontent.com/u/3?v=4',
        status: 'active',
        registerTime: '2024-02-10 09:15:00',
        lastLoginTime: '2025-09-07 12:45:00'
      }
    ].concat(Mock.mock({
      'list|7-15': [{
        id: '@increment(4)',
        username: '@cname',
        email: '@email',
        avatar: '@image("64x64")',
        status: '@pick(["active", "inactive", "banned"])',
        registerTime: '@datetime',
        lastLoginTime: '@datetime'
      }]
    }).list),
    total: 18
  }
})

// 新增用户接口
Mock.mock('/api/users', 'post', (options: any) => {
  const body = JSON.parse(options.body)
  const newUser = {
    id: Date.now(),
    ...body,
    avatar: body.avatar || 'https://avatars.githubusercontent.com/u/new?v=4',
    registerTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
    lastLoginTime: '暂未登录'
  }
  
  console.log('新增用户:', newUser)
  
  return {
    code: 200,
    message: '用户创建成功',
    data: newUser
  }
})

// 更新用户接口
Mock.mock(/\/api\/users\/\d+/, 'put', (options: any) => {
  const body = JSON.parse(options.body)
  const id = options.url.match(/\/api\/users\/(\d+)/)[1]
  
  const updatedUser = {
    id: parseInt(id),
    ...body,
    updateTime: new Date().toISOString().replace('T', ' ').substring(0, 19)
  }
  
  console.log('更新用户:', updatedUser)
  
  return {
    code: 200,
    message: '用户更新成功',
    data: updatedUser
  }
})

// 删除用户接口
Mock.mock(/\/api\/users\/\d+/, 'delete', (options: any) => {
  const id = options.url.match(/\/api\/users\/(\d+)/)[1]
  
  console.log('删除用户ID:', id)
  
  return {
    code: 200,
    message: '用户删除成功'
  }
})

// 游戏数据
Mock.mock('/api/games', 'get', {
  code: 200,
  message: 'success',
  data: {
    total: '@natural(20, 100)'
  },
  'list|20-50': [{
    id: '@increment',
    title: '@ctitle(5, 15)',
    description: '@cparagraph(2, 4)',
    cover: '@image("300x200")',
    category: '@pick(["恋爱", "冒险", "悬疑", "奇幻", "现实"])',
    status: '@pick(["published", "draft", "reviewing"])',
    downloads: '@natural(0, 10000)',
    rating: '@float(1, 5, 1, 1)',
    createTime: '@datetime',
    updateTime: '@datetime'
  }]
})

// 激活码数据
Mock.mock('/api/codes', 'get', {
  code: 200,
  message: 'success',
  data: {
    total: '@natural(50, 200)'
  },
  'list|20-50': [{
    id: '@increment',
    code: '@string("upper", 8)',
    type: '@pick(["premium", "vip", "trial"])',
    status: '@pick(["unused", "used", "expired"])',
    createTime: '@datetime',
    expireTime: '@datetime("yyyy-MM-dd HH:mm:ss", "2025-12-31 23:59:59")',
    usedBy: '@cname',
    usedTime: '@datetime'
  }]
})

// 统计数据
Mock.mock('/api/stats', 'get', {
  code: 200,
  message: 'success',
  data: {
    totalUsers: '@natural(1000, 5000)',
    totalGames: '@natural(50, 200)',
    totalDownloads: '@natural(10000, 50000)',
    activeUsers: '@natural(500, 2000)'
  }
})

export default Mock