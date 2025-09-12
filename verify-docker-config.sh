#!/bin/bash

# 验证 Docker 镜像地址配置脚本
# 检查所有相关文件中的镜像地址是否正确设置

echo "🔍 验证 Docker 镜像地址配置..."
echo "预期镜像地址: ghcr.io/xuchang200/web"
echo ""

# 检查 GitHub Actions 工作流文件
echo "📋 检查 GitHub Actions 工作流:"
for file in .github/workflows/*.yml; do
    if [ -f "$file" ]; then
        echo "  $file:"
        grep -n "IMAGE_NAME:" "$file" | sed 's/^/    /'
    fi
done
echo ""

# 检查 docker-compose 文件
echo "📋 检查 Docker Compose 文件:"
for file in docker-compose*.yml; do
    if [ -f "$file" ] && [ "$file" != "docker-compose.yml" ]; then
        echo "  $file:"
        grep -n "image:" "$file" | sed 's/^/    /'
    fi
done
echo ""

# 检查管理脚本
echo "📋 检查管理脚本:"
if [ -f "docker-manager.sh" ]; then
    echo "  docker-manager.sh:"
    grep -n "REPO_NAME=" docker-manager.sh | sed 's/^/    /'
fi

if [ -f "docker-manager.bat" ]; then
    echo "  docker-manager.bat:"
    grep -n "REPO_NAME=" docker-manager.bat | sed 's/^/    /'
fi
echo ""

# 检查文档
echo "📋 检查文档中的示例:"
if [ -f "DOCKER_DEPLOY.md" ]; then
    echo "  DOCKER_DEPLOY.md 中的镜像地址:"
    grep -n "ghcr.io/xuchang200/web" DOCKER_DEPLOY.md | head -5 | sed 's/^/    /'
    echo "    ..."
fi
echo ""

echo "✅ 验证完成！"
echo ""
echo "🚀 下一步:"
echo "1. 推送代码到 GitHub 仓库"
echo "2. GitHub Actions 将自动构建并推送镜像到 ghcr.io/xuchang200/web"
echo "3. 使用以下命令测试拉取镜像:"
echo "   docker pull ghcr.io/xuchang200/web:latest"