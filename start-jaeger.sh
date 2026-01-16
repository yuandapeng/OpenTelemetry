#!/bin/bash

echo "🚀 启动Jaeger..."

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ 错误: Docker未安装"
    echo ""
    echo "📦 安装Docker:"
    echo "   macOS: 下载并安装 Docker Desktop"
    echo "   https://www.docker.com/products/docker-desktop/"
    echo ""
    echo "   或者使用Homebrew安装:"
    echo "   brew install --cask docker"
    echo ""
    echo "   安装完成后，启动Docker Desktop，然后重新运行此脚本"
    echo ""
    echo "💡 提示: 如果不想安装Docker，可以使用Jaeger二进制文件"
    echo "   查看 README.md 中的'不使用Docker运行Jaeger'部分"
    exit 1
fi

# 检查Docker是否运行
if ! docker info &> /dev/null; then
    echo "❌ 错误: Docker未运行"
    echo ""
    echo "正在尝试启动Docker Desktop..."
    # macOS: 尝试启动Docker Desktop
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open -a Docker 2>/dev/null || true
        echo "   已尝试启动Docker Desktop"
        echo "   请等待Docker Desktop完全启动（通常需要10-30秒）"
        echo ""
        echo "   等待Docker启动..."
        # 等待最多30秒
        for i in {1..30}; do
            sleep 1
            if docker info &> /dev/null; then
                echo "   ✅ Docker已启动！"
                break
            fi
            if [ $i -eq 30 ]; then
                echo "   ❌ Docker启动超时"
                echo "   请手动启动Docker Desktop，然后重新运行此脚本"
                exit 1
            fi
        done
    else
        echo "请手动启动Docker服务，然后重新运行此脚本"
        exit 1
    fi
fi

# 检查端口是否被占用
if lsof -Pi :16686 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  警告: 端口16686已被占用"
    echo "正在尝试停止现有的Jaeger容器..."
    docker stop jaeger 2>/dev/null || true
    docker rm jaeger 2>/dev/null || true
fi

# 启动Jaeger
echo "正在启动Jaeger容器..."
docker-compose up -d

# 等待Jaeger启动
echo "等待Jaeger启动..."
sleep 3

# 检查容器状态
if docker ps | grep -q jaeger; then
    echo "✅ Jaeger已成功启动!"
    echo ""
    echo "📊 Jaeger UI: http://localhost:16686"
    echo "📡 Collector端点: http://localhost:14268/api/traces"
    echo ""
    echo "要查看日志，运行: docker logs -f jaeger"
    echo "要停止Jaeger，运行: docker-compose down"
else
    echo "❌ Jaeger启动失败"
    echo "查看日志: docker logs jaeger"
    exit 1
fi

