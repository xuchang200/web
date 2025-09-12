#!/bin/bash

# 生产环境部署脚本
# 使用方法: ./deploy.sh [tag]

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

REGISTRY="ghcr.io"
IMAGE_NAME="xuchang200/web"
TAG=${1:-latest}

echo -e "${BLUE}🚀 开始部署 Personal Game Website${NC}"
echo -e "${BLUE}镜像: ${REGISTRY}/${IMAGE_NAME}:${TAG}${NC}"
echo ""

# 检查是否存在 .env 文件
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  未找到 .env 文件${NC}"
    echo -e "请复制 .env.example 为 .env 并配置正确的环境变量"
    echo -e "示例: ${YELLOW}cp .env.example .env${NC}"
    exit 1
fi

# 更新 docker-compose.yml 中的镜像标签
if [ "$TAG" != "latest" ]; then
    echo -e "${BLUE}📝 更新镜像标签为: ${TAG}${NC}"
    sed -i "s|image: ${REGISTRY}/${IMAGE_NAME}:.*|image: ${REGISTRY}/${IMAGE_NAME}:${TAG}|g" docker-compose.yml
fi

# 拉取最新镜像
echo -e "${BLUE}📦 拉取镜像...${NC}"
docker pull ${REGISTRY}/${IMAGE_NAME}:${TAG}

# 停止旧容器
echo -e "${BLUE}🛑 停止旧容器...${NC}"
docker-compose down

# 启动新容器
echo -e "${BLUE}🚀 启动新容器...${NC}"
docker-compose up -d

# 等待服务启动
echo -e "${BLUE}⏳ 等待服务启动...${NC}"
sleep 30

# 检查服务状态
echo -e "${BLUE}🔍 检查服务状态...${NC}"
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ 部署成功！${NC}"
    echo ""
    echo -e "${GREEN}🎉 服务现在运行在:${NC}"
    echo -e "   应用地址: http://localhost:3000"
    echo -e "   健康检查: http://localhost:3000/health"
    echo ""
    echo -e "${BLUE}📊 容器状态:${NC}"
    docker-compose ps
else
    echo -e "${RED}❌ 部署失败！${NC}"
    echo -e "${RED}查看日志:${NC}"
    docker-compose logs --tail=50
    exit 1
fi

echo ""
echo -e "${GREEN}🔧 常用命令:${NC}"
echo -e "  查看日志: ${YELLOW}docker-compose logs -f${NC}"
echo -e "  停止服务: ${YELLOW}docker-compose down${NC}"
echo -e "  重启服务: ${YELLOW}docker-compose restart${NC}"
echo -e "  查看状态: ${YELLOW}docker-compose ps${NC}"