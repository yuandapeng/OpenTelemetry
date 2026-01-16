#!/bin/bash

# 从0到1启动整个OpenTelemetry项目
# 包括：依赖安装、Jaeger、Collector、服务A、服务B、前端

set -e

echo "🚀 开始启动 OpenTelemetry 项目..."
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 步骤1: 检查环境
echo "📋 步骤 1/6: 检查环境..."

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ 错误: Node.js 未安装${NC}"
    echo "   请访问 https://nodejs.org/ 安装 Node.js"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✅ Node.js: $NODE_VERSION${NC}"

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ 错误: npm 未安装${NC}"
    exit 1
fi
NPM_VERSION=$(npm -v)
echo -e "${GREEN}✅ npm: $NPM_VERSION${NC}"

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ 错误: Docker 未安装${NC}"
    echo "   请访问 https://www.docker.com/products/docker-desktop/ 安装 Docker"
    exit 1
fi

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Docker 未运行，正在尝试启动...${NC}"
    # macOS 尝试启动 Docker Desktop
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open -a Docker 2>/dev/null || true
        echo "   等待 Docker Desktop 启动..."
        for i in {1..30}; do
            if docker info > /dev/null 2>&1; then
                break
            fi
            sleep 2
        done
    fi
    
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ 错误: Docker 无法启动${NC}"
        echo "   请手动启动 Docker Desktop"
        exit 1
    fi
fi
echo -e "${GREEN}✅ Docker 已运行${NC}"

echo ""

# 步骤2: 安装依赖
echo "📦 步骤 2/6: 安装依赖..."

if [ ! -d "node_modules" ] || [ ! -d "services/service-a/node_modules" ] || [ ! -d "frontend/node_modules" ]; then
    echo "   正在安装依赖（这可能需要几分钟）..."
    npm run install:all
    echo -e "${GREEN}✅ 依赖安装完成${NC}"
else
    echo -e "${GREEN}✅ 依赖已存在，跳过安装${NC}"
fi

echo ""

# 步骤3: 启动可观测性服务（Jaeger、Loki、Grafana）
echo "🔍 步骤 3/7: 启动可观测性服务..."

# 启动 Jaeger
if docker ps --format '{{.Names}}' | grep -q "^jaeger$"; then
    echo -e "${GREEN}✅ Jaeger 已在运行${NC}"
else
    echo "   正在启动 Jaeger..."
    docker-compose up -d jaeger
    sleep 2
fi

# 启动 Loki
if docker ps --format '{{.Names}}' | grep -q "^loki$"; then
    echo -e "${GREEN}✅ Loki 已在运行${NC}"
else
    echo "   正在启动 Loki..."
    docker-compose up -d loki
    sleep 2
fi

# 启动 Grafana
if docker ps --format '{{.Names}}' | grep -q "^grafana$"; then
    echo -e "${GREEN}✅ Grafana 已在运行${NC}"
else
    echo "   正在启动 Grafana..."
    docker-compose up -d grafana
    sleep 3
fi

echo "   📍 Jaeger UI: http://localhost:16686"
echo "   📍 Loki API: http://localhost:3100"
echo "   📍 Grafana: http://localhost:3003 (admin/admin)"

echo ""

# 步骤4: 启动 OpenTelemetry Collector
echo "📡 步骤 4/7: 启动 OpenTelemetry Collector..."

if docker ps --format '{{.Names}}' | grep -q "^otel-collector$"; then
    echo -e "${GREEN}✅ Collector 已在运行${NC}"
else
    echo "   正在启动 Collector..."
    docker-compose up -d otel-collector
    sleep 3
    
    # 检查 Collector 是否启动成功
    if docker ps --format '{{.Names}}' | grep -q "^otel-collector$"; then
        echo -e "${GREEN}✅ Collector 启动成功${NC}"
    else
        echo -e "${RED}❌ Collector 启动失败${NC}"
        docker-compose logs otel-collector
        exit 1
    fi
fi

echo "   📍 Collector HTTP: http://localhost:4318"
echo "   📍 Collector gRPC: localhost:4317"

echo ""

# 步骤5: 启动后端服务
echo "⚙️  步骤 5/7: 启动后端服务..."

# 检查端口是否被占用
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0
    else
        return 1
    fi
}

# 启动 service-a
if check_port 3001; then
    echo -e "${YELLOW}⚠️  端口 3001 已被占用，跳过 service-a${NC}"
else
    echo "   正在启动 service-a (端口 3001)..."
    cd services/service-a
    npm run dev > ../../logs-service-a.log 2>&1 &
    SERVICE_A_PID=$!
    cd ../..
    sleep 2
    
    if check_port 3001; then
        echo -e "${GREEN}✅ service-a 启动成功 (PID: $SERVICE_A_PID)${NC}"
        echo $SERVICE_A_PID > .service-a.pid
    else
        echo -e "${RED}❌ service-a 启动失败${NC}"
        cat logs-service-a.log
        exit 1
    fi
fi

# 启动 service-b
if check_port 3002; then
    echo -e "${YELLOW}⚠️  端口 3002 已被占用，跳过 service-b${NC}"
else
    echo "   正在启动 service-b (端口 3002)..."
    cd services/service-b
    npm run dev > ../../logs-service-b.log 2>&1 &
    SERVICE_B_PID=$!
    cd ../..
    sleep 2
    
    if check_port 3002; then
        echo -e "${GREEN}✅ service-b 启动成功 (PID: $SERVICE_B_PID)${NC}"
        echo $SERVICE_B_PID > .service-b.pid
    else
        echo -e "${RED}❌ service-b 启动失败${NC}"
        cat logs-service-b.log
        exit 1
    fi
fi

echo "   📍 service-a: http://localhost:3001"
echo "   📍 service-b: http://localhost:3002"

echo ""

# 步骤6: 启动前端
echo "🎨 步骤 6/7: 启动前端..."

if check_port 3000; then
    echo -e "${YELLOW}⚠️  端口 3000 已被占用，跳过前端${NC}"
else
    echo "   正在启动 Next.js 前端 (端口 3000)..."
    cd frontend
    npm run dev > ../logs-frontend.log 2>&1 &
    FRONTEND_PID=$!
    cd ..
    sleep 5
    
    if check_port 3000; then
        echo -e "${GREEN}✅ 前端启动成功 (PID: $FRONTEND_PID)${NC}"
        echo $FRONTEND_PID > .frontend.pid
    else
        echo -e "${RED}❌ 前端启动失败${NC}"
        cat logs-frontend.log
        exit 1
    fi
fi

echo "   📍 前端: http://localhost:3000"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 所有服务启动成功！${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 访问地址:"
echo "   • 前端应用:    http://localhost:3000"
echo "   • service-a:   http://localhost:3001"
echo "   • service-b:   http://localhost:3002"
echo "   • Grafana:     http://localhost:3003 (统一查看 Traces、Logs、Metrics)"
echo "   • Jaeger UI:   http://localhost:16686 (查看 Traces)"
echo "   • Loki API:    http://localhost:3100 (日志存储)"
echo "   • Prometheus:  http://localhost:8889/metrics (Metrics 端点)"
echo "   • Collector:  http://localhost:4318"
echo ""
echo "📝 日志文件:"
echo "   • service-a:   logs-service-a.log"
echo "   • service-b:   logs-service-b.log"
echo "   • frontend:    logs-frontend.log"
echo ""
echo "🛑 停止所有服务:"
echo "   ./stop-all.sh"
echo ""
echo "💡 提示:"
echo "   1. 在前端页面点击按钮触发服务调用"
echo "   2. 在 Grafana (http://localhost:3003) 统一查看 Traces、Logs 和 Metrics"
echo "   3. 在 Jaeger UI 查看详细的 Trace 链路"
echo "   4. 通过 traceId 在 Grafana 中关联查询日志"
echo "   5. 在 Grafana 中添加 Prometheus 数据源 (http://otel-collector:8889) 查看 Metrics"
echo ""

