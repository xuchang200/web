# 🎮 Personal Game Website

> 一个现代化的全栈游戏分享平台，支持游戏上传、用户管理、数据分析和系统监控

[![Docker Build](https://img.shields.io/badge/docker-automated-blue)](https://github.com/xuchang200/web)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-20%2B-green)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://www.typescriptlang.org/)

## ✨ 核心特性

🔐 **完整用户系统**
- 用户注册/登录/找回密码
- 邮箱验证和双因素认证
- 用户权限和角色管理
- 个人资料和偏好设置

🎯 **游戏管理平台**
- 游戏上传和发布系统
- 多格式游戏文件支持
- 游戏分类和标签管理
- 游戏评分和评论系统
- 游戏激活码管理

📊 **数据分析中心**
- 实时用户活跃度统计
- 游戏访问量和下载量分析
- 系统性能监控面板
- 可视化图表和报表
- 日志管理和审计追踪

⚙️ **管理后台**
- 用户管理和权限控制
- 游戏审核和内容管理
- 系统设置和配置中心
- 安全风险监控
- 邮件服务配置

🐳 **DevOps 就绪**
- Docker 容器化部署
- GitHub Actions CI/CD
- 自动镜像构建和推送
- 多环境部署支持
- 健康检查和监控

## 🏗️ 技术架构

### 前端技术栈
- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - 类型安全的 JavaScript 超集
- **Vite** - 新一代前端构建工具
- **Pinia** - Vue 状态管理库
- **Vue Router** - 官方路由管理器
- **Element Plus** - 基于 Vue 3 的组件库
- **ECharts** - 数据可视化图表库
- **Axios** - Promise 基于的 HTTP 库

### 后端技术栈
- **Node.js** - JavaScript 运行时环境
- **Express** - 快速、极简的 Web 框架
- **TypeScript** - 提供完整的类型安全
- **Prisma** - 现代数据库工具包
- **MySQL** - 关系型数据库
- **Redis** - 内存数据库和缓存
- **JWT** - JSON Web Token 认证
- **Nodemailer** - 邮件发送服务
- **Multer** - 文件上传中间件

### 部署和运维
- **Docker** - 容器化部署
- **GitHub Actions** - CI/CD 自动化
- **GitHub Container Registry** - 镜像仓库
- **Nginx** - 反向代理和负载均衡

## 📁 项目结构

```
personal-game-website/
├── 📁 backend/                     # 后端服务
│   ├── 📁 src/
│   │   ├── 📁 controllers/         # 控制器层
│   │   │   ├── authController.ts   # 认证控制器
│   │   │   ├── gameController.ts   # 游戏管理
│   │   │   ├── userController.ts   # 用户管理
│   │   │   └── analytics/          # 数据分析
│   │   ├── 📁 middlewares/         # 中间件
│   │   │   ├── authMiddleware.ts   # 认证中间件
│   │   │   ├── rateLimit.ts       # 限流中间件
│   │   │   └── errorHandler.ts    # 错误处理
│   │   ├── 📁 routes/             # 路由定义
│   │   ├── 📁 services/           # 业务逻辑层
│   │   ├── 📁 utils/              # 工具函数
│   │   └── 📁 types/              # 类型定义
│   ├── 📁 prisma/                 # 数据库配置
│   │   ├── schema.prisma          # 数据库模式
│   │   ├── migrations/            # 数据库迁移
│   │   └── seed.ts               # 初始数据
│   └── 📁 uploads/               # 文件上传目录
├── 📁 frontend/                   # 前端应用
│   ├── 📁 src/
│   │   ├── 📁 components/         # 可复用组件
│   │   ├── 📁 views/             # 页面组件
│   │   │   ├── 📁 admin/         # 管理后台
│   │   │   ├── Home.vue         # 首页
│   │   │   ├── Login.vue        # 登录页
│   │   │   └── Profile.vue      # 个人中心
│   │   ├── 📁 store/             # 状态管理
│   │   ├── 📁 router/            # 路由配置
│   │   ├── 📁 api/               # API 接口
│   │   ├── 📁 utils/             # 工具函数
│   │   └── 📁 types/             # 类型定义
│   └── 📁 public/                # 静态资源
├── 📁 .github/workflows/          # GitHub Actions
│   ├── docker-build.yml          # Docker 构建
│   ├── advanced-docker-build.yml # 高级构建
│   └── production-deploy.yml     # 生产部署
├── 🐳 docker-compose.yml         # Docker 编排
├── 🐳 Dockerfile                 # Docker 镜像定义
├── ⚙️ .env.example              # 环境变量模板
├── 🚀 deploy.sh                  # 部署脚本
├── 🛠️ docker-manager.sh         # Docker 管理脚本
└── 📖 README.md                  # 项目文档
```

## 🚀 快速开始

### 前置要求

- **Node.js** >= 20.0.0
- **MySQL** >= 8.0 或 **PostgreSQL** >= 13
- **Redis** >= 6.0
- **Docker** (可选，推荐用于生产部署)

### 本地开发环境

1. **克隆项目**
   ```bash
   git clone https://github.com/xuchang200/web.git
   cd web
   ```

2. **安装依赖**
   ```bash
   # 安装所有依赖 (使用 npm workspaces)
   npm install
   
   # 或分别安装
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. **环境配置**
   ```bash
   # 复制环境变量模板
   cp .env.example .env
   
   # 编辑 .env 文件，配置数据库和其他服务
   vim .env
   ```

4. **数据库设置**
   ```bash
   # 生成 Prisma 客户端
   npm run prisma:generate
   
   # 运行数据库迁移
   npm run prisma:migrate
   
   # 查看数据库 (可选)
   npm run prisma:studio
   ```

5. **启动开发服务**
   ```bash
   # 同时启动前后端服务
   npm run dev
   
   # 或分别启动
   npm run dev:backend   # 后端服务 http://localhost:3000
   npm run dev:frontend  # 前端服务 http://localhost:5173
   ```

### 🐳 Docker 部署 (推荐)

Docker 部署是生产环境的推荐方式，提供了完整的容器化解决方案。

#### 快速部署

1. **准备环境**
   ```bash
   git clone https://github.com/xuchang200/web.git
   cd web
   cp .env.example .env
   # 编辑 .env 文件配置生产环境变量
   ```

2. **一键部署**
   ```bash
   # 使用部署脚本
   chmod +x deploy.sh
   ./deploy.sh

   # 或直接使用 Docker Compose
   docker-compose up -d
   ```

3. **访问应用**
   - 应用地址: http://localhost:3000
   - 健康检查: http://localhost:3000/health

#### Docker 管理

使用提供的管理脚本来管理 Docker 服务：

```bash
# 拉取最新镜像
./docker-manager.sh pull latest

# 部署指定版本
./docker-manager.sh deploy v1.0.0

# 查看服务状态
./docker-manager.sh status

# 查看日志
./docker-manager.sh logs

# 重启服务
./docker-manager.sh restart
```

#### 多版本部署

支持部署不同版本的应用镜像：

```bash
# 部署最新版本
./docker-manager.sh deploy latest

# 部署特定版本
./docker-manager.sh deploy v1.2.3

# 部署开发版本
./docker-manager.sh deploy develop

# 部署主分支版本
./docker-manager.sh deploy main
```

## ⚙️ 环境变量配置

### 必需配置

```env
# 数据库配置
DATABASE_URL=mysql://user:password@localhost:3306/gamedb

# JWT 认证
JWT_SECRET=your-super-secure-jwt-secret-key-at-least-32-characters

# Redis 缓存
REDIS_URL=redis://localhost:6379

# 应用配置
NODE_ENV=production
PORT=3000
```

### 可选配置

```env
# 邮件服务 (用于验证码和通知)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# 文件上传
UPLOAD_MAX_SIZE=10485760  # 10MB
UPLOAD_ALLOWED_TYPES=jpg,jpeg,png,gif,zip

# 安全配置
CORS_ORIGIN=*
RATE_LIMIT_WINDOW=15     # 分钟
RATE_LIMIT_MAX=100       # 请求数

# 功能开关
MAINTENANCE_MODE=false
REGISTRATION_ENABLED=true
EMAIL_VERIFICATION_REQUIRED=true
```

## 🎯 主要功能模块

### 🔐 用户认证系统
- **注册流程**: 邮箱验证 + 用户激活
- **登录方式**: 用户名/邮箱 + 密码
- **密码安全**: bcrypt 加密 + 找回密码
- **会话管理**: JWT + Redis 会话存储
- **权限控制**: 基于角色的访问控制 (RBAC)

### 🎮 游戏管理平台
- **游戏上传**: 支持多种游戏文件格式
- **内容管理**: 游戏信息编辑和分类
- **发布流程**: 游戏审核和发布机制
- **访问控制**: 游戏激活码和权限管理
- **统计分析**: 游戏访问量和用户行为分析

### 📊 数据分析中心
- **用户分析**: 注册、活跃、留存用户统计
- **游戏分析**: 下载量、评分、热门游戏排行
- **系统监控**: 性能指标、错误率、响应时间
- **可视化**: ECharts 图表展示数据趋势
- **导出功能**: 支持数据导出和报表生成

### ⚙️ 系统管理后台
- **用户管理**: 用户列表、权限设置、账户状态
- **内容审核**: 游戏审核、评论管理、举报处理
- **系统设置**: 站点配置、邮件设置、安全策略
- **日志管理**: 操作日志、错误日志、审计追踪
- **监控面板**: 实时系统状态和性能监控

## 🔧 开发指南

### 代码规范

- **TypeScript**: 严格类型检查，提高代码质量
- **ESLint**: 代码风格检查和自动修复
- **Prettier**: 代码格式化和统一风格
- **Git Hooks**: 提交前自动检查和格式化

### API 设计

- **RESTful**: 遵循 REST 架构设计原则
- **统一响应**: 标准化的 API 响应格式
- **错误处理**: 完善的错误码和错误信息
- **文档化**: 接口文档和使用示例

### 数据库管理

```bash
# 创建新迁移
npx prisma migrate dev --name add-new-feature

# 重置数据库
npx prisma migrate reset

# 查看数据库
npx prisma studio

# 生成类型定义
npx prisma generate
```

### 测试和调试

```bash
# 运行测试
npm test

# 代码覆盖率
npm run test:coverage

# 类型检查
npm run type-check

# 代码格式化
npm run format
```

## 🚀 部署指南

### 生产环境准备

1. **服务器要求**
   - Ubuntu 20.04+ 或 CentOS 8+
   - 2GB+ RAM, 20GB+ 存储
   - Docker 和 Docker Compose

2. **域名和 SSL**
   ```bash
   # 使用 Nginx 反向代理
   server {
       listen 80;
       server_name your-domain.com;
       return 301 https://$server_name$request_uri;
   }
   
   server {
       listen 443 ssl http2;
       server_name your-domain.com;
       
       ssl_certificate /path/to/ssl/cert.pem;
       ssl_certificate_key /path/to/ssl/private.key;
       
       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

3. **数据备份**
   ```bash
   # 数据库备份
   docker exec mysql_container mysqldump -u root -p gamedb > backup.sql
   
   # 文件备份
   tar -czf uploads-backup.tar.gz uploads/
   ```

### CI/CD 自动化

项目配置了 GitHub Actions 自动化流程：

- **代码推送** → 自动构建 Docker 镜像
- **版本发布** → 自动生成部署文件
- **安全扫描** → Trivy 漏洞扫描
- **多平台支持** → amd64 和 arm64 架构

### 监控和维护

```bash
# 查看服务状态
docker-compose ps

# 查看实时日志
docker-compose logs -f

# 系统资源监控
docker stats

# 健康检查
curl http://localhost:3000/health
```

## 🤝 贡献指南

我们欢迎各种形式的贡献！

### 如何贡献

1. **Fork 项目**
2. **创建特性分支** (`git checkout -b feature/AmazingFeature`)
3. **提交更改** (`git commit -m 'Add some AmazingFeature'`)
4. **推送分支** (`git push origin feature/AmazingFeature`)
5. **创建 Pull Request**

### 贡献类型

- 🐛 **Bug 修复**
- ✨ **新功能开发**
- 📝 **文档改进**
- 🎨 **UI/UX 优化**
- ⚡ **性能优化**
- 🔒 **安全增强**

### 开发流程

1. **问题讨论**: 在 Issues 中讨论新功能或改进
2. **代码审查**: 所有 PR 需要代码审查
3. **测试通过**: 确保所有测试通过
4. **文档更新**: 更新相关文档

## 📚 相关文档

- [🐳 Docker 部署指南](DOCKER_DEPLOY.md)
- [📝 开发计划](Development_Plan.md)
- [📋 功能规格说明](Functional_Specification.md)

## 📞 支持和反馈

- **GitHub Issues**: [提交 Bug 或功能请求](https://github.com/xuchang200/web/issues)
- **讨论区**: [项目讨论和问答](https://github.com/xuchang200/web/discussions)
- **邮箱**: 技术支持邮箱

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)。详见 LICENSE 文件。

## 🎉 致谢

感谢所有为此项目做出贡献的开发者和用户！

特别感谢以下开源项目：
- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Express.js](https://expressjs.com/) - 快速 Web 框架
- [Prisma](https://prisma.io/) - 现代数据库工具包
- [Docker](https://docker.com/) - 容器化平台

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给个星标！**

[🏠 首页](https://github.com/xuchang200/web) • [📖 文档](https://github.com/xuchang200/web#readme) • [🐛 问题反馈](https://github.com/xuchang200/web/issues) • [💬 讨论](https://github.com/xuchang200/web/discussions)

</div>