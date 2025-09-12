#!/bin/sh

set -e

echo "[entrypoint] Starting container services..."

if [ -z "$DATABASE_URL" ]; then
    echo "[entrypoint][warn] DATABASE_URL is not set"
fi

cd /app/backend

# 生成 Prisma 客户端（幂等）
echo "[entrypoint] Generating Prisma client..."
npx prisma generate

# 运行数据库迁移
echo "[entrypoint] Running database migrations..."
npx prisma migrate deploy || echo "[entrypoint][warn] Migration failed or none to run"

# 若 dist 不存在（防御性）则构建
if [ ! -d "dist" ]; then
  echo "[entrypoint] dist not found, building backend..."
  npm run build
fi

# 启动后端服务
echo "[entrypoint] Starting backend service..."
exec npm run start