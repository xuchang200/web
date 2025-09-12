#!/bin/sh

# 启动脚本 - 用于在单个容器中运行前端和后端服务

echo "Starting container services..."

# 检查环境变量
if [ -z "$DATABASE_URL" ]; then
    echo "Warning: DATABASE_URL environment variable is not set"
fi

# 设置工作目录
cd /app/backend

# 运行数据库迁移（如果需要）
echo "Running database migrations..."
npx prisma migrate deploy || echo "Migration failed or no migrations to run"

# 启动 nginx（前端服务）
echo "Starting nginx..."
nginx &

# 启动后端服务
echo "Starting backend service..."
node server.js &

# 等待所有后台进程
wait