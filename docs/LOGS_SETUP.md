# 📝 日志收集配置说明

## 🎯 架构说明

现在日志已经配置为统一收集到云服务（Loki），而不是查看本地日志文件：

```
应用程序 (service-a, service-b)
  ↓ 发送日志到 Collector (OTLP)
OpenTelemetry Collector
  ↓ 转发日志到 Loki
Loki (日志存储服务)
  ↑ 查询日志
Grafana (统一可视化平台)
```

## 📊 服务地址

| 服务 | 地址 | 说明 |
|------|------|------|
| **Grafana** | http://localhost:3003 | 统一查看 Traces、Logs、Metrics |
| **Jaeger** | http://localhost:16686 | 查看 Traces |
| **Loki** | http://localhost:3100 | 日志存储（API） |
| **Collector** | http://localhost:4318 | 数据收集器 |

## 🚀 使用步骤

### 1. 启动所有服务

```bash
./start-all.sh
```

这会启动：
- ✅ Jaeger (Traces)
- ✅ Loki (Logs)
- ✅ Grafana (可视化)
- ✅ Collector (数据收集)
- ✅ service-a, service-b (应用服务)

### 2. 访问 Grafana

1. 打开 http://localhost:3003
2. 登录：
   - 用户名: `admin`
   - 密码: `admin`

### 3. 配置 Grafana 数据源

#### 添加 Loki 数据源（查看日志）

1. 进入 **Configuration** → **Data Sources**
2. 点击 **Add data source**
3. 选择 **Loki**
4. 配置：
   - **URL**: `http://loki:3100`
   - 点击 **Save & Test**

#### 添加 Jaeger 数据源（查看 Traces）

1. 点击 **Add data source**
2. 选择 **Jaeger**
3. 配置：
   - **URL**: `http://jaeger:16686`
   - 点击 **Save & Test**

### 4. 查看日志

#### 方式一：在 Grafana Explore 中查看

1. 进入 **Explore** (左侧菜单)
2. 选择 **Loki** 数据源
3. 输入查询：
   ```
   {service_name="service-a"}
   ```
4. 点击 **Run query**

#### 方式二：通过 traceId 关联查询

1. 在 Jaeger 中找到某个 Trace，复制 `traceId`
2. 在 Grafana Explore 中选择 Loki
3. 输入查询：
   ```
   {trace_id="你的traceId"}
   ```
4. 这样就能看到该 Trace 对应的所有日志！

## 🔗 数据关联

### 关键特性：通过 traceId 关联

所有日志都自动添加了 `trace_id` 标签，所以可以：

1. **从 Trace 找 Logs**：
   - 在 Jaeger 中看到 Trace
   - 复制 traceId
   - 在 Grafana Loki 中查询：`{trace_id="xxx"}`

2. **从 Logs 找 Trace**：
   - 在 Grafana 中看到日志
   - 查看日志的 `trace_id` 标签
   - 在 Jaeger 中搜索该 traceId

## 📝 应用程序日志配置

应用程序现在会自动发送日志到 Collector：

```javascript
// tracing.js
logRecordProcessor: new BatchLogRecordProcessor(
  new OTLPLogExporter({
    url: 'http://localhost:4318/v1/logs',
  })
)
```

### 在代码中记录日志

使用 OpenTelemetry Logger API：

```javascript
const { logs } = require('@opentelemetry/api-logs');

const logger = logs.getLogger('service-a', '1.0.0');

// 记录日志
logger.emit({
  severityText: 'INFO',
  body: '这是一条日志消息',
  attributes: {
    userId: '123',
    action: 'login'
  }
});
```

## 🎨 创建 Dashboard

在 Grafana 中可以创建 Dashboard，同时展示：
- **Traces** (从 Jaeger)
- **Logs** (从 Loki)
- **Metrics** (从 Prometheus，如果配置了)

这样就能在一个界面看到完整的可观测性数据！

## 💡 优势

相比查看本地日志文件：

1. ✅ **集中存储**：所有服务的日志都在 Loki 中
2. ✅ **统一查询**：通过 Grafana 统一界面查询
3. ✅ **关联查询**：通过 traceId 关联 Traces 和 Logs
4. ✅ **历史记录**：日志持久化存储
5. ✅ **搜索功能**：强大的日志搜索和过滤

## 🔧 故障排查

### 日志没有显示

1. 检查 Collector 是否运行：
   ```bash
   docker ps | grep otel-collector
   ```

2. 查看 Collector 日志：
   ```bash
   docker logs otel-collector
   ```

3. 检查 Loki 是否运行：
   ```bash
   docker ps | grep loki
   ```

4. 查看 Loki 日志：
   ```bash
   docker logs loki
   ```

### Grafana 无法连接 Loki

确保在 Grafana 中配置 Loki 数据源时，URL 使用服务名：
- ✅ `http://loki:3100` (Docker 网络内)
- ❌ `http://localhost:3100` (会失败)

