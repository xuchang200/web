# 多阶段构建 - 阶段1: 构建前端
# Vite 7 需要 Node.js >= 20.19 或 22.12+，之前使用的 node:18-alpine 导致构建时报错：crypto.hash is not a function
# 升级到 Node 20 LTS Alpine 镜像
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

# 复制前端的 package 文件
COPY frontend/package*.json ./

# 安装前端依赖
RUN npm install --no-audit --no-fund

# 复制前端源代码
COPY frontend/ ./

# 使用 .env.example 作为构建时变量来源（.env 被 gitignore 忽略）
# 从中抽取以 VITE_ 开头的变量生成前端使用的 .env.production.local
COPY .env.example /tmp/env.source
RUN grep '^VITE_' /tmp/env.source > .env.production.local || true

# 构建前端应用
RUN npm run build

# 多阶段构建 - 阶段2: 构建后端（同样保持与前端一致的 Node 版本）
FROM node:20-alpine AS backend-build

WORKDIR /app/backend

# 复制后端的 package 文件
COPY backend/package*.json ./

# 安装后端依赖（包括 devDependencies 用于构建）
RUN npm install --no-audit --no-fund

# 复制后端源代码
COPY backend/ ./

# 生成 Prisma 客户端
RUN npx prisma generate

# 构建 TypeScript 代码
RUN npm run build

# 最终阶段: 运行时环境（保持同一 Node 版本，避免运行时不一致）
FROM node:20-alpine AS production

# 创建应用目录
WORKDIR /app

ENV NODE_ENV=production
# 后端构建产物
COPY --from=backend-build /app/backend/dist ./backend/dist
COPY --from=backend-build /app/backend/package*.json ./backend/
COPY --from=backend-build /app/backend/prisma ./backend/prisma/
COPY --from=backend-build /app/backend/node_modules ./backend/node_modules
RUN cd backend && npm prune --omit=dev

# 前端构建产物复制到应用目录供 Node 静态托管
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# 复制启动脚本
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

RUN mkdir -p /app/backend/uploads/covers /app/backend/uploads/games /app/backend/uploads/temp

# 暴露端口（仅后端 API + 静态）
EXPOSE 3000

# 启动脚本
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q -O - http://127.0.0.1:3000/health || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]