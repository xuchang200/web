#!/bin/bash

# Docker 镜像管理脚本
# 用法: ./docker-manager.sh [command] [environment] [options]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 默认配置
REGISTRY="ghcr.io"
REPO_NAME="xuchang200/web"
IMAGE_NAME="${REGISTRY}/${REPO_NAME}"

# 帮助信息
show_help() {
    echo -e "${BLUE}Docker 镜像管理脚本${NC}"
    echo ""
    echo "用法: $0 [command] [tag]"
    echo ""
    echo -e "${YELLOW}命令:${NC}"
    echo "  pull [tag]             拉取指定标签的镜像 (默认: latest)"
    echo "  deploy [tag]           部署指定标签 (默认: latest)"
    echo "  start                  启动服务"
    echo "  stop                   停止服务"
    echo "  restart                重启服务"
    echo "  logs                   查看日志"
    echo "  status                 查看服务状态"
    echo "  clean                  清理未使用的镜像"
    echo ""
    echo -e "${YELLOW}标签示例:${NC}"
    echo "  latest                 最新版本"
    echo "  v1.0.0                 特定版本"
    echo "  main                   主分支"
    echo "  develop                开发分支"
    echo ""
    echo -e "${YELLOW}示例:${NC}"
    echo "  $0 pull latest              # 拉取最新镜像"
    echo "  $0 deploy v1.0.0            # 部署 v1.0.0 版本"
    echo "  $0 logs                     # 查看日志"
    echo ""
}

# 拉取镜像
pull_image() {
    local tag=${1:-latest}
    
    echo -e "${BLUE}正在拉取镜像: ${IMAGE_NAME}:${tag}${NC}"
    docker pull ${IMAGE_NAME}:${tag}
    
    # 更新 docker-compose.yml 中的标签
    if [ "$tag" != "latest" ]; then
        sed -i "s|image: ${IMAGE_NAME}:.*|image: ${IMAGE_NAME}:${tag}|g" docker-compose.yml
        echo -e "${YELLOW}已更新 docker-compose.yml 中的镜像标签为: ${tag}${NC}"
    fi
    
    echo -e "${GREEN}✅ 镜像拉取完成${NC}"
}

# 部署服务
deploy_service() {
    local tag=${1:-latest}
    
    echo -e "${BLUE}正在部署服务 (标签: ${tag})...${NC}"
    
    # 拉取镜像
    pull_image $tag
    
    # 停止旧服务
    echo -e "${BLUE}停止旧服务...${NC}"
    docker-compose down
    
    # 启动新服务
    echo -e "${BLUE}启动新服务...${NC}"
    docker-compose up -d
    
    # 等待启动
    echo -e "${BLUE}等待服务启动...${NC}"
    sleep 20
    
    # 检查状态
    if docker-compose ps | grep -q "Up"; then
        echo -e "${GREEN}✅ 部署成功${NC}"
        docker-compose ps
    else
        echo -e "${RED}❌ 部署失败${NC}"
        docker-compose logs --tail=20
        exit 1
    fi
}

# 启动服务
start_service() {
    echo -e "${BLUE}正在启动服务...${NC}"
    docker-compose up -d
    echo -e "${GREEN}✅ 服务启动完成${NC}"
    docker-compose ps
}

# 停止服务
stop_service() {
    echo -e "${BLUE}正在停止服务...${NC}"
    docker-compose down
    echo -e "${GREEN}✅ 服务已停止${NC}"
}

# 重启服务
restart_service() {
    echo -e "${BLUE}正在重启服务...${NC}"
    docker-compose restart
    echo -e "${GREEN}✅ 服务重启完成${NC}"
    docker-compose ps
}

# 查看日志
show_logs() {
    echo -e "${BLUE}显示服务日志...${NC}"
    docker-compose logs -f
}

# 查看状态
show_status() {
    echo -e "${BLUE}服务状态:${NC}"
    docker-compose ps
    echo ""
    echo -e "${BLUE}镜像信息:${NC}"
    docker images ${IMAGE_NAME} --format "table {{.Tag}}\t{{.CreatedAt}}\t{{.Size}}"
}

# 清理镜像
clean_images() {
    echo -e "${BLUE}正在清理未使用的 Docker 镜像...${NC}"
    docker image prune -f
    echo -e "${GREEN}✅ 清理完成${NC}"
}

# 主逻辑
case $1 in
    "pull")
        pull_image $2
        ;;
    "deploy")
        deploy_service $2
        ;;
    "start")
        start_service
        ;;
    "stop")
        stop_service
        ;;
    "restart")
        restart_service
        ;;
    "logs")
        show_logs
        ;;
    "status")
        show_status
        ;;
    "clean")
        clean_images
        ;;
    "help"|"--help"|"-h"|"")
        show_help
        ;;
    *)
        echo -e "${RED}错误: 未知命令 '$1'${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac