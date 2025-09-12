# Docker 自动构建和部署指南

这个项目配置了 GitHub Actions 来自动构建和推送 Docker 镜像到 GitHub Container Registry (ghcr.io)。

## 🔄 自动构建触发条件

### 1. 基础构建 (`docker-build.yml`)
- **推送到主分支**: `main`, `master`, `develop`
- **Pull Request**: 向 `main`, `master` 分支提交 PR
- **发布版本**: 创建新的 Release

### 2. 高级构建 (`advanced-docker-build.yml`)
- 包含安全扫描 (Trivy)
- 多平台构建 (amd64, arm64)
- 构建缓存优化
- 详细的标签策略

### 3. 生产部署 (`production-deploy.yml`)
- **自动触发**: 发布新版本时
- **手动触发**: 可以指定标签和环境

## 📦 镜像标签策略

| 触发方式 | 生成的标签 | 示例 | 用途 |
|---------|-----------|------|-----|
| 推送到 main | `latest`, `main`, `main-<sha>` | `latest`, `main-abc1234` | 生产环境 |
| 推送到 develop | `develop`, `develop-<sha>` | `develop`, `develop-def5678` | 开发环境 |
| 推送到任意分支 | `<branch>`, `<branch>-<sha>` | `feature-auth`, `feature-auth-abc123` | 功能测试 |
| Pull Request | `pr-<number>` | `pr-123` | PR 预览 |
| 发布版本 | `v1.0.0`, `v1.0`, `v1` | `v1.0.0`, `v1.0`, `v1` | 稳定版本 |
| 手动构建 | `<branch>-<timestamp>` | `hotfix-20240913-143022` | 临时构建 |

## 🎯 如何拉取特定分支的镜像

### 1. 拉取不同分支的镜像
```bash
# 生产环境 (主分支)
docker pull ghcr.io/xuchang200/web:latest
docker pull ghcr.io/xuchang200/web:main

# 开发环境
docker pull ghcr.io/xuchang200/web:develop

# 功能分支 (例如: feature/user-auth)
docker pull ghcr.io/xuchang200/web:feature-user-auth

# 特定版本
docker pull ghcr.io/xuchang200/web:v1.0.0

# 特定提交
docker pull ghcr.io/xuchang200/web:main-abc1234
```

### 2. 手动触发分支构建
1. 进入 GitHub 仓库
2. 点击 `Actions` 标签
3. 选择 `Manual Branch Build` 工作流
4. 点击 `Run workflow`
5. 输入要构建的分支名称
6. 可选择添加自定义标签后缀
7. 选择是否推送到镜像仓库

### 3. 环境-分支对应建议
```bash
# 生产环境
docker-compose.prod.yml → latest 或 v1.0.0

# 预发布环境  
docker-compose.staging.yml → main

# 开发环境
docker-compose.dev.yml → develop

# 功能测试
docker-compose.feature.yml → feature-<name>
```

## �️ 管理脚本使用

我们提供了便捷的管理脚本来简化 Docker 镜像的使用：

### Linux/macOS 用户
```bash
# 给脚本执行权限
chmod +x docker-manager.sh

# 拉取生产环境镜像
./docker-manager.sh pull prod

# 运行开发环境
./docker-manager.sh run dev

# 拉取并运行功能分支
./docker-manager.sh pull feature user-auth
./docker-manager.sh run feature user-auth

# 更新预发布环境
./docker-manager.sh update staging

# 查看帮助
./docker-manager.sh help
```

### Windows 用户
```cmd
# 拉取生产环境镜像
docker-manager.bat pull prod

# 运行开发环境
docker-manager.bat run dev

# 拉取并运行功能分支
docker-manager.bat pull feature user-auth
docker-manager.bat run feature user-auth

# 更新预发布环境
docker-manager.bat update staging

# 查看帮助
docker-manager.bat help
```

## �🚀 使用 Docker 镜像

### 1. 拉取最新镜像
```bash
docker pull ghcr.io/xuchang200/web:latest
```

### 2. 运行容器
```bash
# 简单运行
docker run -p 3000:3000 ghcr.io/xuchang200/web:latest

# 使用环境变量
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:password@localhost:5432/gamedb" \
  -e JWT_SECRET="your-jwt-secret" \
  -e REDIS_URL="redis://localhost:6379" \
  ghcr.io/xuchang200/web:latest
```

### 3. 使用 Docker Compose
```yaml
version: '3.8'

services:
  app:
    image: ghcr.io/xuchang200/web:latest
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/gamedb
      - JWT_SECRET=your-jwt-secret
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=gamedb
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

## 🔧 环境变量配置

### 必需的环境变量
```bash
# 数据库连接
DATABASE_URL=postgresql://user:password@localhost:5432/gamedb

# JWT 密钥
JWT_SECRET=your-secure-jwt-secret-key

# Redis 连接
REDIS_URL=redis://localhost:6379

# 应用配置
NODE_ENV=production
```

### 可选的环境变量
```bash
# 上传配置
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=jpg,jpeg,png,gif,zip

# 日志级别
LOG_LEVEL=info

# CORS 配置
CORS_ORIGIN=*
```

## 🏭 生产环境部署

### 1. 手动部署
1. 从 GitHub Actions 下载部署文件
2. 设置环境变量
3. 运行部署脚本:
   ```bash
   ./deploy.sh
   ```

### 2. 自动部署
1. 创建新的 Release
2. GitHub Actions 自动构建并生成部署文件
3. 下载部署文件到服务器
4. 配置环境变量并运行

## 🔍 监控和健康检查

Docker 镜像包含健康检查端点:
```bash
# 检查应用健康状态
curl http://localhost:3000/health
```

## 🛠️ 自定义构建

如果需要自定义构建过程，可以修改 `.github/workflows/` 目录下的工作流文件:

- `docker-build.yml`: 基础构建配置
- `advanced-docker-build.yml`: 高级构建配置（包含安全扫描）
- `production-deploy.yml`: 生产环境部署配置

## 📚 相关链接

- [GitHub Container Registry 文档](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Docker Buildx 文档](https://docs.docker.com/buildx/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)