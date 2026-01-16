#!/bin/bash

echo "🔍 检查Jaeger状态..."
echo ""

# 检查Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "❌ Docker未运行"
    exit 1
fi

# 检查容器
echo "📦 容器状态:"
if docker ps | grep -q jaeger; then
    echo "✅ Jaeger容器正在运行"
    docker ps | grep jaeger
else
    echo "❌ Jaeger容器未运行"
    echo ""
    echo "尝试启动: ./start-jaeger.sh 或 docker-compose up -d"
    exit 1
fi

echo ""
echo "🌐 端口检查:"
if lsof -Pi :16686 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "✅ 端口16686 (Jaeger UI) 正在监听"
else
    echo "❌ 端口16686未监听"
fi

if lsof -Pi :14268 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "✅ 端口14268 (Collector) 正在监听"
else
    echo "❌ 端口14268未监听"
fi

echo ""
echo "🔗 访问地址:"
echo "   Jaeger UI: http://localhost:16686"
echo "   Collector: http://localhost:14268/api/traces"
echo ""

# 测试连接
echo "🧪 测试连接..."
if curl -s http://localhost:16686 > /dev/null 2>&1; then
    echo "✅ Jaeger UI可以访问"
else
    echo "❌ 无法访问Jaeger UI"
    echo "   请检查防火墙设置或端口占用"
fi

