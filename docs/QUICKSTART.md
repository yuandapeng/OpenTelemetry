# 🚀 快速开始指南

## 第一步：启动 Jaeger（追踪后端）

```bash
./start-jaeger.sh
```

等待几秒钟，Jaeger UI将在 http://localhost:16686 可用。

## 第二步：安装依赖（如果还没安装）

```bash
# 安装所有依赖
npm run install:all

# 或者分别安装
cd services/service-a && npm install && cd ../..
cd services/service-b && npm install && cd ../..
cd frontend && npm install && cd ..
```

## 第三步：启动服务

### 方式一：分别启动（推荐，便于查看日志）

打开**三个终端窗口**：

**终端1 - 启动服务A:**
```bash
cd services/service-a
npm run dev
```

**终端2 - 启动服务B:**
```bash
cd services/service-b
npm run dev
```

**终端3 - 启动前端:**
```bash
cd frontend
npm run dev
```

### 方式二：使用concurrently同时启动

```bash
npm run dev
```

## 第四步：访问应用

- **前端界面**: http://localhost:3000
- **服务A**: http://localhost:3001
- **服务B**: http://localhost:3002
- **Jaeger UI**: http://localhost:16686

## 第五步：测试追踪

1. 打开前端界面：http://localhost:3000
2. 点击"调用服务A → 服务B"按钮
3. 查看返回的响应数据
4. 点击"打开 Jaeger UI"链接
5. 在Jaeger UI中：
   - 选择服务名称（service-a或service-b）
   - 点击"Find Traces"
   - 查看完整的调用链

## 🎯 测试场景

### 场景1：基本服务调用
- 在前端点击"调用服务A → 服务B"
- 查看Jaeger中的完整调用链

### 场景2：用户信息查询
- 在前端点击"获取用户信息"
- 查看跨服务的用户查询追踪

### 场景3：健康检查
- 点击"检查服务A健康状态"或"检查服务B健康状态"
- 查看简单的健康检查追踪

## 📊 在Jaeger UI中查看追踪

1. 打开 http://localhost:16686
2. 在左侧选择服务：
   - `service-a` - 查看服务A的追踪
   - `service-b` - 查看服务B的追踪
3. 点击"Find Traces"
4. 点击任意trace查看详情：
   - 查看完整的调用链
   - 查看每个span的耗时
   - 查看span的详细信息

## 🛑 停止服务

- **停止Jaeger**: 在运行Jaeger的终端按 `Ctrl+C`，或运行 `docker-compose down`
- **停止服务**: 在各自的终端按 `Ctrl+C`

## 💡 提示

- 如果Jaeger UI无法打开，检查Docker是否运行：`docker ps`
- 如果服务无法启动，检查端口是否被占用
- 如果看不到trace，确保所有服务都已启动并调用了API端点

