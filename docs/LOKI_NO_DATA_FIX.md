# 🔍 Loki 没有数据 - 解决方案

## ❌ 问题：在 Loki 中找不到 `service_name` 标签

**原因**：Loki 中还没有日志数据，所以看不到任何标签。

## ✅ 解决步骤

### 步骤 1：确认服务正在运行

```bash
# 检查服务是否运行
ps aux | grep "service-a\|service-b" | grep -v grep

# 或检查端口
lsof -i :3001  # service-a
lsof -i :3002  # service-b
```

### 步骤 2：触发服务调用生成日志

**方法 1：通过前端触发**

1. 打开前端：http://localhost:3000
2. 点击按钮触发服务调用
3. 等待几秒钟

**方法 2：直接调用 API**

```bash
# 调用 service-a
curl http://localhost:3001/api/test

# 调用 service-a 调用 service-b
curl http://localhost:3001/api/call-service-b
```

### 步骤 3：检查日志是否到达 Loki

```bash
# 查询所有日志
curl "http://localhost:3100/loki/api/v1/query?query={}"

# 查看标签列表
curl "http://localhost:3100/loki/api/v1/labels"
```

### 步骤 4：在 Grafana 中查看

1. 等待 10-30 秒让日志到达 Loki
2. 在 Grafana Explore 中：
   - 切换到 **Code 模式**
   - 输入查询：`{}`（查看所有日志）
   - 点击运行

## 🔧 如果还是没有数据

### 检查 1：应用程序是否配置了日志导出

确认 `services/service-a/tracing.js` 和 `services/service-b/tracing.js` 中都有：

```javascript
logRecordProcessor: new BatchLogRecordProcessor(
  new OTLPLogExporter({
    url: 'http://localhost:4318/v1/logs',
  })
)
```

### 检查 2：Collector 是否正常运行

```bash
# 检查 Collector 状态
docker ps | grep otel-collector

# 查看 Collector 日志
docker logs otel-collector --tail 50
```

### 检查 3：Collector 配置是否正确

确认 `collector-config.yaml` 中：

```yaml
service:
  pipelines:
    logs:
      receivers: [otlp]
      processors: [batch, attributes]
      exporters: [loki]
```

### 检查 4：重启服务

如果配置已更改，需要重启：

```bash
# 停止所有服务
./stop-all.sh

# 重新启动
./start-all.sh
```

## 💡 重要提示

### Node.js 日志收集的限制

**重要**：Node.js 的 OpenTelemetry 日志支持需要**手动记录日志**才能发送到 Collector。

自动 instrumentations **不会自动收集 console.log**，需要：

1. **使用 OpenTelemetry Logger API**：

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

2. **或者使用日志库集成**：

需要安装和配置日志库的 OpenTelemetry 集成，如：
- `@opentelemetry/instrumentation-winston`
- `@opentelemetry/instrumentation-bunyan`

### 快速测试：手动发送日志

在 `services/service-a/index.js` 中添加测试日志：

```javascript
const { logs } = require('@opentelemetry/api-logs');

// 在路由处理函数中
app.get('/api/test', (req, res) => {
  const logger = logs.getLogger('service-a', '1.0.0');
  
  logger.emit({
    severityText: 'INFO',
    body: 'Test log message from service-a',
    attributes: {
      endpoint: '/api/test',
      method: 'GET'
    }
  });
  
  res.json({ message: 'Test successful' });
});
```

## 🎯 推荐方案

### 方案 1：使用日志库（推荐）

安装 Winston 或 Bunyan，并配置 OpenTelemetry 集成：

```bash
cd services/service-a
npm install winston
npm install @opentelemetry/instrumentation-winston
```

### 方案 2：直接使用 console.log（简单但不推荐）

console.log 不会自动发送到 OpenTelemetry，但可以通过配置捕获。

### 方案 3：暂时跳过日志收集

如果主要关注 Traces，可以：
- 先使用 Jaeger 查看 Traces
- 日志收集可以后续配置

## 📝 下一步

1. **先触发服务调用**：确保有数据产生
2. **检查 Collector 日志**：看是否有错误
3. **在 Grafana 中尝试查询**：`{}` 查看所有日志
4. **如果还是没有**：考虑添加手动日志记录

