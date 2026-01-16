# 🚀 从0到1启动指南

## 一键启动（推荐）

```bash
# 给脚本添加执行权限（首次运行）
chmod +x start-all.sh stop-all.sh

# 启动所有服务
./start-all.sh
```

这个脚本会自动完成：
1. ✅ 检查环境（Node.js、Docker）
2. ✅ 安装依赖
3. ✅ 启动 Jaeger
4. ✅ 启动 OpenTelemetry Collector
5. ✅ 启动 service-a (端口 3001)
6. ✅ 启动 service-b (端口 3002)
7. ✅ 启动前端 (端口 3000)

## 手动启动（分步执行）

如果你想分步启动，可以按照以下步骤：

### 1. 检查环境

```bash
# 检查 Node.js
node -v  # 需要 >= 16.0.0

# 检查 Docker
docker --version
docker info  # 确保 Docker 正在运行
```

### 2. 安装依赖

```bash
# 安装所有依赖（根目录、services、frontend）
npm run install:all
```

### 3. 启动 Jaeger

```bash
# 方式一：使用脚本
./start-jaeger.sh

# 方式二：使用 docker-compose
docker-compose up -d jaeger
```

验证：访问 http://localhost:16686

### 4. 启动 OpenTelemetry Collector

```bash
# 使用 docker-compose
docker-compose up -d otel-collector
```

验证：`curl http://localhost:4318` 应该返回 404（这是正常的）

### 5. 启动后端服务

```bash
# 启动 service-a (终端1)
cd services/service-a
npm run dev

# 启动 service-b (终端2)
cd services/service-b
npm run dev
```

或者使用根目录的脚本：
```bash
npm run dev:service-a  # 终端1
npm run dev:service-b  # 终端2
```

### 6. 启动前端

```bash
# 终端3
cd frontend
npm run dev
```

或使用根目录脚本：
```bash
npm run dev:frontend
```

## 📍 访问地址

启动成功后，可以访问：

| 服务 | 地址 | 说明 |
|------|------|------|
| **前端应用** | http://localhost:3000 | Next.js 前端界面 |
| **service-a** | http://localhost:3001 | 后端服务A |
| **service-b** | http://localhost:3002 | 后端服务B |
| **Jaeger UI** | http://localhost:16686 | 追踪数据可视化 |
| **Collector** | http://localhost:4318 | OpenTelemetry Collector |

## 🧪 测试流程

1. **打开前端**: http://localhost:3000
2. **点击按钮**触发服务调用
3. **查看 Jaeger**: http://localhost:16686
   - 选择服务：`service-a`
   - 点击 "Find Traces"
   - 查看完整的调用链路

## 🛑 停止所有服务

```bash
# 使用停止脚本
./stop-all.sh

# 或手动停止
# 1. 按 Ctrl+C 停止各个服务
# 2. 停止 Docker 服务
docker-compose down
```

## 📝 日志文件

启动脚本会创建以下日志文件：
- `logs-service-a.log` - service-a 的日志
- `logs-service-b.log` - service-b 的日志
- `logs-frontend.log` - 前端的日志

查看日志：
```bash
tail -f logs-service-a.log
tail -f logs-service-b.log
tail -f logs-frontend.log
```

## 🔧 常见问题

### 端口被占用

如果某个端口已被占用，脚本会提示。解决方法：

```bash
# 查找占用端口的进程
lsof -i :3000
lsof -i :3001
lsof -i :3002

# 停止进程
kill -9 <PID>
```

### Docker 未运行

```bash
# macOS: 启动 Docker Desktop
open -a Docker

# 等待 Docker 启动后重试
```

### 依赖安装失败

```bash
# 清理并重新安装
rm -rf node_modules services/*/node_modules frontend/node_modules
npm run install:all
```

## 🎯 下一步

启动成功后：
1. 在前端页面触发服务调用
2. 在 Jaeger UI 查看追踪数据
3. 查看服务之间的调用链路
4. 分析性能瓶颈

祝你使用愉快！🎉

