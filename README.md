# 个人游戏网站

一个全栈的游戏分享平台，包含用户认证、游戏管理、数据分析和系统设置等功能。

## 🚀 项目特性

- **用户系统**: 完整的用户注册、登录、找回密码功能
- **游戏管理**: 游戏上传、编辑、删除和分类管理
- **数据分析**: 实时仪表盘展示用户和游戏统计数据
- **邮箱验证**: 注册和找回密码的邮箱验证码功能
- **管理后台**: 管理员后台包含用户管理、游戏管理、系统设置等
- **系统设置**: 灵活的系统配置和站点设置
- **日志系统**: 完整的系统操作日志记录和查询

## 🛠️ 技术栈

### 前端
- **Vue 3**: 现代化的前端框架
- **TypeScript**: 类型安全的JavaScript
- **Vite**: 快速的构建工具
- **Element Plus**: UI组件库
- **Vue Router**: 前端路由
- **Pinia**: 状态管理
- **Axios**: HTTP客户端
- **ECharts**: 数据可视化

### 后端
- **Node.js**: JavaScript运行时
- **Express**: Web应用框架
- **TypeScript**: 类型安全的JavaScript
- **Prisma**: 现代数据库ORM
- **MySQL**: 关系型数据库
- **Redis**: 缓存和会话存储
- **Nodemailer**: 邮件发送
- **Multer**: 文件上传处理
- **JWT**: 用户认证
- **bcryptjs**: 密码加密

## 📁 项目结构

```
personal-game-website/
├── backend/                 # 后端代码
│   ├── src/
│   │   ├── controllers/     # 控制器
│   │   ├── middlewares/     # 中间件
│   │   ├── routes/          # 路由
│   │   ├── services/        # 业务逻辑
│   │   ├── types/           # 类型定义
│   │   └── utils/           # 工具函数
│   ├── prisma/              # 数据库配置
│   └── uploads/             # 文件上传目录
├── frontend/                # 前端代码
│   ├── src/
│   │   ├── api/             # API接口
│   │   ├── components/      # 组件
│   │   ├── router/          # 路由配置
│   │   ├── store/           # 状态管理
│   │   ├── types/           # 类型定义
│   │   ├── utils/           # 工具函数
│   │   └── views/           # 页面组件
│   └── public/              # 静态资源
└── docs/                    # 文档
```

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- MySQL >= 5.7 或 MySQL >= 8.0
- Redis >= 6.0

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/xuchang200/web.git
   cd web
   ```

2. **安装依赖**
   ```bash
   # 安装后端依赖
   cd backend
   npm install
   
   # 安装前端依赖
   cd ../frontend
   npm install
   ```

3. **环境配置**
   
   在 `backend` 目录下创建 `.env` 文件：
   ```env
   # 数据库配置
   DATABASE_URL="mysql://username:password@localhost:3306/game_website"
   
   # Redis配置
   REDIS_URL="redis://localhost:6379"
   
   # JWT密钥
   JWT_SECRET="your-secret-key"
   
   # 邮箱配置
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT=587
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-email-password"
   
   # 服务器配置
   PORT=3000
   NODE_ENV="development"
   ```

4. **数据库设置**
   ```bash
   cd backend
   # 运行数据库迁移
   npx prisma migrate dev
   # 生成Prisma客户端
   npx prisma generate
   # 可选：填充初始数据
   npx prisma db seed
   ```

5. **启动服务**
   ```bash
   # 启动后端服务 (在 backend 目录)
   npm run dev
   
   # 启动前端服务 (在 frontend 目录，新终端)
   cd ../frontend
   npm run dev
   ```

6. **访问应用**
   - 前端: http://localhost:5173
   - 后端API: http://localhost:3000

## 📊 主要功能

### 用户功能
- 用户注册和邮箱验证
- 用户登录和找回密码
- 个人资料管理
- 游戏收藏和评分

### 游戏管理
- 游戏上传和发布
- 游戏分类和标签
- 游戏编辑和删除
- 游戏搜索和筛选

### 管理功能
- 用户管理和权限控制
- 游戏审核和管理
- 系统设置和配置
- 数据统计和分析
- 操作日志查看

### 数据分析
- 用户活跃度统计
- 游戏访问量分析
- 系统性能监控
- 可视化图表展示

## 🔧 开发指南

### 代码规范
- 使用 TypeScript 进行类型检查
- 遵循 ESLint 和 Prettier 配置
- 组件和函数使用驼峰命名
- 数据库字段使用下划线命名

### 数据库操作
```bash
# 创建新的迁移
npx prisma migrate dev --name migration-name

# 重置数据库
npx prisma migrate reset

# 查看数据库
npx prisma studio
```

### API文档
- 后端API遵循RESTful设计
- 使用JWT进行身份验证
- 统一的错误处理和响应格式

## 🐳 使用 Docker 部署（推荐）

### 一次性构建并启动
```bash
# 在项目根目录（包含 docker-compose.yml 的位置）
docker compose build
docker compose up -d

# 查看日志
docker compose logs -f app
```
访问：`http://服务器IP:3000` （若使用 OpenResty/Nginx 绑定域名则通过域名访问）。

### 必填环境变量（参考 .env.example）
| 变量 | 说明 |
|------|------|
| DATABASE_URL | MySQL 连接串 |
| JWT_SECRET | 长随机密钥（>=32字符） |
| REDIS_HOST / REDIS_PORT | Redis 服务（使用 compose 内部 redis 则为 redis:6379） |
| NODE_ENV | production |
| MAINTENANCE_MODE | 是否启用维护模式 |

### 生产推荐操作
```
# 健康检查
curl http://127.0.0.1:3000/health

# 运行数据库迁移（若需要手动）：
docker compose exec app npx prisma migrate deploy
```

### 使用 OpenResty / Nginx 反向代理域名示例
```
server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 数据持久化
- 上传目录：`uploads` 卷（映射到容器 `/app/backend/uploads`）。
- Redis 数据：`redis_data` 卷（如使用云 Redis 可删除该卷和 redis 服务）。

### 常见问题 FAQ
| 问题 | 说明 |
|------|------|
| 为什么只暴露 3000 端口 | Node 同时提供静态前端与 API |
| 如何加 HTTPS | 用 OpenResty/Nginx/Caddy 配置证书并反代到 3000 |
| 改了代码需要重启吗 | 需重新构建镜像：`docker compose build && docker compose up -d` |
| 上传文件会丢吗 | 不会，已使用命名卷 `uploads` |

## 🚀 部署

### 生产环境构建
```bash
# 构建前端
cd frontend
npm run build

# 构建后端
cd ../backend
npm run build
```

### 环境变量
生产环境需要配置以下环境变量：
- `DATABASE_URL`: 生产数据库连接
- `REDIS_URL`: Redis连接
- `JWT_SECRET`: JWT密钥
- `SMTP_*`: 邮箱服务配置

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 联系方式

如有问题，请通过以下方式联系：
- GitHub Issues
- Email: [你的邮箱]

---

⭐ 如果这个项目对你有帮助，请给个星标！