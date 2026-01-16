#!/bin/bash

# 停止所有服务

set -e

echo "🛑 正在停止所有服务..."

# 停止前端
if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo "   停止前端 (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID 2>/dev/null || true
        rm .frontend.pid
    fi
fi

# 停止 service-a
if [ -f ".service-a.pid" ]; then
    SERVICE_A_PID=$(cat .service-a.pid)
    if ps -p $SERVICE_A_PID > /dev/null 2>&1; then
        echo "   停止 service-a (PID: $SERVICE_A_PID)..."
        kill $SERVICE_A_PID 2>/dev/null || true
        rm .service-a.pid
    fi
fi

# 停止 service-b
if [ -f ".service-b.pid" ]; then
    SERVICE_B_PID=$(cat .service-b.pid)
    if ps -p $SERVICE_B_PID > /dev/null 2>&1; then
        echo "   停止 service-b (PID: $SERVICE_B_PID)..."
        kill $SERVICE_B_PID 2>/dev/null || true
        rm .service-b.pid
    fi
fi

# 停止 Docker 服务
echo "   停止 Docker 服务..."
docker-compose down 2>/dev/null || true

# 清理日志文件
echo "   清理日志文件..."
rm -f logs-*.log 2>/dev/null || true

echo "✅ 所有服务已停止"

