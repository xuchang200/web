#!/bin/sh

set -e

echo "[entrypoint] Starting container services..."

if [ -z "$DATABASE_URL" ]; then
    echo "[entrypoint][error] DATABASE_URL is not set"
    exit 1
fi

cd /app/backend

# 等待数据库就绪
echo "[entrypoint] Waiting for database to be ready..."
until npx prisma db ping 2>/dev/null; do
    echo "[entrypoint] Database not ready, waiting 5 seconds..."
    sleep 5
done
echo "[entrypoint] Database is ready!"

# 生成 Prisma 客户端（在运行时生成，确保平台兼容性）
echo "[entrypoint] Generating Prisma client..."
npx prisma generate

# 运行数据库迁移或 db push
echo "[entrypoint] Running database migrations..."
if [ -d "prisma/migrations" ] && [ "$(find prisma/migrations -name "*.sql" | wc -l)" -gt 0 ]; then
    echo "[entrypoint] Found migrations, running migrate deploy..."
    npx prisma migrate deploy
else
    echo "[entrypoint] No migrations found, performing prisma db push..."
    npx prisma db push --accept-data-loss
fi

# 验证数据库连接和表结构
echo "[entrypoint] Verifying database schema..."
npx prisma db ping || {
    echo "[entrypoint][error] Database connection failed"
    exit 1
}

# 可选：执行种子（幂等），可通过环境变量控制，默认执行
if [ "${DISABLE_SEED}" = "1" ]; then
    echo "[entrypoint] Seed skipped (DISABLE_SEED=1)"
else
    echo "[entrypoint] Running seed script..."
    npm run seed || echo "[entrypoint][warn] seed failed (this is usually fine)"
fi

# 最终验证：确保 Prisma 客户端可以正常工作
echo "[entrypoint] Final verification of Prisma client..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect().then(() => {
    console.log('[entrypoint] Prisma client connected successfully');
    process.exit(0);
}).catch((err) => {
    console.error('[entrypoint][error] Prisma client connection failed:', err.message);
    process.exit(1);
});
"

# 启动后端服务
echo "[entrypoint] Starting backend service..."
exec npm run start