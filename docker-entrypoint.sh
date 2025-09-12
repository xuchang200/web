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

# 运行数据库迁移（若有迁移）或回退到 db push
echo "[entrypoint] Running database migrations..."
if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations | wc -l)" -gt 0 ]; then
  npx prisma migrate deploy || echo "[entrypoint][warn] migrate deploy failed"
else
  echo "[entrypoint] No migrations found, performing prisma db push (baseline sync)"
  npx prisma db push || echo "[entrypoint][error] db push failed"
fi

# 若 dist 不存在（防御性）则构建
if [ ! -d "dist" ]; then
  echo "[entrypoint] dist not found, building backend..."
  npm run build
fi

# 可选：执行种子（幂等），可通过环境变量控制，默认执行
if [ "${DISABLE_SEED}" = "1" ]; then
  echo "[entrypoint] Seed skipped (DISABLE_SEED=1)"
else
  echo "[entrypoint] Running seed script..."
  npm run seed || echo "[entrypoint][warn] seed failed"
fi

# 启动后端服务
echo "[entrypoint] Starting backend service..."
exec npm run start