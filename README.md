# OpenTelemetry 分布式追踪演示

这是一个完整的OpenTelemetry分布式追踪示例项目，展示了两个服务之间的调用以及自动的trace传播，并使用Next.js构建了可视化界面。

## 🏗️ 项目结构

```
.
├── services/
│   ├── service-a/          # 服务A - 调用服务B
│   │   ├── index.js
│   │   ├── tracing.js
│   │   └── package.json
│   └── service-b/          # 服务B - 被服务A调用
│       ├── index.js
│       ├── tracing.js
│       └── package.json
├── frontend/               # Next.js 前端应用
│   ├── app/
│   ├── package.json
│   └── next.config.js
├── docker-compose.yml      # Jaeger配置
└── README.md
```

## 🚀 快速开始

### 1. 启动Jaeger（追踪后端）

首先启动Jaeger来收集和可视化trace数据：

#### 方式一：使用Docker（推荐，需要安装Docker）

**安装Docker：**
- macOS: 下载 [Docker Desktop](https://www.docker.com/products/docker-desktop/) 或使用 `brew install --cask docker`
- 安装后启动Docker Desktop

**启动Jaeger：**
```bash
./start-jaeger.sh
```

或使用docker-compose：
```bash
docker-compose up -d
```

**检查Jaeger状态：**
```bash
./check-jaeger.sh
```

Jaeger UI将在 http://localhost:16686 可用。

**如果Jaeger UI无法打开，请检查：**
1. Docker是否已安装并运行（如果使用Docker方式）
2. 端口16686是否被占用
3. 运行 `./check-jaeger.sh` 查看详细状态
4. 查看Jaeger日志: `docker logs jaeger`（Docker方式）或查看终端输出（二进制方式）

### 2. 安装依赖

```bash
# 安装根目录依赖
npm install

# 安装服务A依赖
cd services/service-a && npm install && cd ../..

# 安装服务B依赖
cd services/service-b && npm install && cd ../..

# 安装前端依赖
cd frontend && npm install && cd ..
```

或者使用便捷脚本：

```bash
npm run install:all
```

### 3. 启动服务

#### 方式一：分别启动（推荐用于开发）

打开三个终端窗口：

**终端1 - 启动服务A:**
```bash
npm run dev:service-a
```

**终端2 - 启动服务B:**
```bash
npm run dev:service-b
```

**终端3 - 启动前端:**
```bash
npm run dev:frontend
```

#### 方式二：使用concurrently同时启动

```bash
npm run dev
```

### 4. 访问应用

- **前端界面**: http://localhost:3000
- **服务A**: http://localhost:3001
- **服务B**: http://localhost:3002
- **Jaeger UI**: http://localhost:16686

## 📊 功能说明

### 服务调用链

1. **服务A** (`localhost:3001`)
   - `/api/process` - 调用服务B获取数据
   - `/api/user/:id` - 获取用户信息（调用服务B）

2. **服务B** (`localhost:3002`)
   - `/api/data` - 返回数据（被服务A调用）
   - `/api/user/:id/details` - 返回用户详情（被服务A调用）

### Trace传播机制

OpenTelemetry使用W3C Trace Context标准自动在HTTP请求头中传播trace信息：

- `traceparent`: 包含trace ID和span ID
- 服务间的调用会自动继承和传播trace context
- 所有span都会关联到同一个trace ID

### 可视化

1. **前端界面** (`localhost:3000`)
   - 提供按钮来触发服务调用
   - 显示响应数据和trace信息
   - 提供快速链接到Jaeger UI

2. **Jaeger UI** (`localhost:16686`)
   - 查看完整的服务调用链
   - 分析每个span的耗时
   - 搜索和过滤trace
   - 查看详细的trace信息

## 🔍 使用示例

1. 打开前端界面 http://localhost:3000
2. 点击"调用服务A → 服务B"按钮
3. 查看返回的响应数据
4. 点击"打开 Jaeger UI"链接
5. 在Jaeger UI中搜索trace，查看完整的调用链

## 🛠️ 技术栈

### 后端
- **Node.js** + **Express** - 服务框架
- **OpenTelemetry SDK** - 追踪SDK
- **@opentelemetry/auto-instrumentations-node** - 自动instrumentation
- **@opentelemetry/exporter-jaeger** - Jaeger导出器

### 前端
- **Next.js 14** - React框架
- **TypeScript** - 类型安全
- **Axios** - HTTP客户端

### 追踪后端
- **Jaeger** - 分布式追踪系统

## 📝 API端点

### 服务A

- `GET /health` - 健康检查
- `GET /api/process` - 处理请求并调用服务B
- `GET /api/user/:id` - 获取用户信息

### 服务B

- `GET /health` - 健康检查
- `GET /api/data` - 返回数据
- `GET /api/user/:id/details` - 返回用户详情

## 🎯 关键特性

1. **自动Trace传播**: 使用OpenTelemetry的自动instrumentation，无需手动处理trace context
2. **完整的调用链**: 从服务A到服务B的完整追踪
3. **可视化界面**: Next.js构建的现代化UI
4. **Jaeger集成**: 完整的trace数据收集和可视化

## 🔧 配置说明

### OpenTelemetry配置

每个服务都使用相同的配置模式：

```javascript
const sdk = new NodeSDK({
  resource: new Resource({
    [SEMRESATTRS_SERVICE_NAME]: 'service-name',
    [SEMRESATTRS_SERVICE_VERSION]: '1.0.0',
  }),
  traceExporter: new JaegerExporter({
    endpoint: 'http://localhost:14268/api/traces',
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});
```

### 自动Instrumentation

使用`@opentelemetry/auto-instrumentations-node`自动instrument以下库：
- HTTP/HTTPS
- Express
- Axios
- 等等

## 🐛 故障排除

1. **Jaeger连接失败**
   - 确保Docker容器正在运行: `docker ps`
   - 检查端口是否被占用: `lsof -i :16686`

2. **服务无法启动**
   - 检查端口3001和3002是否可用
   - 查看服务日志中的错误信息

3. **Trace未显示在Jaeger中**
   - 确保Jaeger容器正在运行
   - 检查服务是否正确连接到Jaeger端点
   - 在Jaeger UI中刷新页面

## 📚 参考资料

- [OpenTelemetry官方文档](https://opentelemetry.io/docs/)
- [Jaeger文档](https://www.jaegertracing.io/docs/)
- [Next.js文档](https://nextjs.org/docs)

## 📄 许可证

MIT

