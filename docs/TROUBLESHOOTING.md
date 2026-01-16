# 故障排除指南

## Jaeger UI 无法打开

### 问题诊断

1. **检查Docker是否运行**
   ```bash
   docker info
   ```
   如果报错，说明Docker未运行，请启动Docker Desktop。

2. **检查Jaeger容器状态**
   ```bash
   docker ps | grep jaeger
   ```
   如果没有输出，说明容器未运行。

3. **检查端口占用**
   ```bash
   lsof -i :16686
   ```
   如果端口被占用，需要停止占用该端口的进程。

### 解决方案

#### 方案1: 使用启动脚本（推荐）
```bash
./start-jaeger.sh
```

#### 方案2: 手动启动
```bash
# 启动Jaeger
docker-compose up -d

# 检查状态
docker ps

# 查看日志
docker logs jaeger
```

#### 方案3: 如果端口被占用
```bash
# 停止现有容器
docker stop jaeger
docker rm jaeger

# 重新启动
docker-compose up -d
```

#### 方案4: 如果Docker未安装
1. 安装Docker Desktop: https://docs.docker.com/get-docker/
2. 启动Docker Desktop
3. 运行 `./start-jaeger.sh`

### 验证Jaeger是否正常工作

```bash
# 检查容器状态
./check-jaeger.sh

# 测试UI访问
curl http://localhost:16686

# 查看容器日志
docker logs jaeger
```

## 服务无法连接

### 问题：Network Error

**可能原因：**
1. 服务A或服务B未启动
2. 端口被占用
3. CORS配置问题

**解决方案：**
1. 检查服务是否运行：
   ```bash
   # 检查服务A
   curl http://localhost:3001/health
   
   # 检查服务B
   curl http://localhost:3002/health
   ```

2. 确保所有服务都已启动：
   ```bash
   # 终端1
   cd services/service-a && npm run dev
   
   # 终端2
   cd services/service-b && npm run dev
   
   # 终端3
   cd frontend && npm run dev
   ```

## Trace数据未显示在Jaeger中

### 可能原因

1. **Jaeger未运行**
   - 运行 `./check-jaeger.sh` 检查状态

2. **服务未正确连接到Jaeger**
   - 检查 `tracing.js` 中的endpoint配置
   - 确保Jaeger在 `http://localhost:14268/api/traces` 可访问

3. **没有生成trace数据**
   - 确保调用了服务端点
   - 检查服务日志中是否有错误

### 验证步骤

1. 调用服务端点生成trace
2. 等待几秒钟让数据发送到Jaeger
3. 在Jaeger UI中：
   - 选择服务名称（service-a或service-b）
   - 点击"Find Traces"
   - 应该能看到trace数据

## 常见错误

### Error: connect ECONNREFUSED

**原因：** 目标服务未运行或端口错误

**解决：** 确保所有服务都已启动

### Error: Network Error

**原因：** CORS问题或服务未启动

**解决：** 
1. 检查服务是否运行
2. 确保使用了Next.js rewrites路径（/api/service-a/...）

### Jaeger UI显示"No traces found"

**原因：** 
1. 没有调用服务端点
2. Trace数据还未发送到Jaeger
3. 时间范围设置不正确

**解决：**
1. 调用服务端点生成trace
2. 在Jaeger UI中调整时间范围
3. 检查服务日志确认trace已发送

