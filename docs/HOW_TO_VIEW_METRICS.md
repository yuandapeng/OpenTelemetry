# 📊 如何在 Grafana 中查看 Metrics

## 🎯 配置步骤

### 1. 启用 Metrics 收集

#### 在应用程序中（service-a/service-b）

如果你使用的是 `tracing-full-example.js`，它已经配置了 `metricReader`：

```javascript
metricReader: new PeriodicExportingMetricReader({
  exporter: new OTLPMetricExporter({
    url: `${COLLECTOR_URL}/v1/metrics`,
  }),
  exportIntervalMillis: 10000, // 每10秒导出一次
}),
```

如果你使用的是 `tracing.js`，需要添加 metrics 支持：

```javascript
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-http');
const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');

const sdk = new NodeSDK({
  // ... 其他配置
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: `${COLLECTOR_URL}/v1/metrics`,
    }),
    exportIntervalMillis: 10000,
  }),
});
```

#### 安装依赖

```bash
cd services/service-a
npm install @opentelemetry/exporter-metrics-otlp-http @opentelemetry/sdk-metrics
```

### 2. Collector 配置

`collector-config.yaml` 已经配置好了：

```yaml
exporters:
  prometheus:
    endpoint: "0.0.0.0:8889"

service:
  pipelines:
    metrics:
      receivers: [otlp]
      processors: [batch, attributes]
      exporters: [prometheus]
```

### 3. 重启服务

```bash
# 重启 Collector
docker-compose restart otel-collector

# 重启应用程序（如果修改了代码）
# 停止并重新启动 service-a 和 service-b
```

### 4. 在 Grafana 中添加 Prometheus 数据源

1. **打开 Grafana**：
   - 访问 http://localhost:3003
   - 登录（用户名：admin，密码：admin）

2. **添加数据源**：
   - 点击左侧菜单 **⚙️ Configuration** → **Data sources**
   - 点击 **Add data source**
   - 选择 **Prometheus**

3. **配置 Prometheus**：
   - **URL**: `http://otel-collector:8889`
     - ⚠️ 注意：使用 Docker 服务名 `otel-collector`，不是 `localhost`
   - 点击 **Save & test**
   - 应该显示 "Data source is working"

### 5. 查看 Metrics

#### 方法 1：在 Explore 中查询

1. 点击左侧菜单 **🔍 Explore**
2. 选择 **Prometheus** 数据源
3. 输入查询，例如：
   ```
   # 查看所有 metrics
   {__name__=~".+"}
   
   # 查看 HTTP 请求相关的 metrics
   http_server_request_duration_seconds
   
   # 查看特定服务的 metrics
   {service_name="service-a"}
   ```

#### 方法 2：创建 Dashboard

1. 点击左侧菜单 **➕ Create** → **Dashboard**
2. 点击 **Add visualization**
3. 选择 **Prometheus** 数据源
4. 输入查询，例如：
   ```
   rate(http_server_request_duration_seconds_sum[5m])
   ```
5. 配置图表类型、标题等
6. 点击 **Apply** 保存面板
7. 点击右上角 **💾 Save dashboard**

## 📈 常见的 OpenTelemetry Metrics

OpenTelemetry 的自动 instrumentation 会生成以下 metrics：

### HTTP Metrics

- `http_server_request_duration_seconds` - HTTP 请求持续时间
- `http_server_request_size_bytes` - HTTP 请求大小
- `http_server_response_size_bytes` - HTTP 响应大小
- `http_server_active_requests` - 活跃请求数

### 系统 Metrics

- `process_cpu_seconds_total` - CPU 使用时间
- `process_memory_bytes` - 内存使用
- `process_open_fds` - 打开的文件描述符数

### 查询示例

```promql
# HTTP 请求速率（每秒请求数）
rate(http_server_request_duration_seconds_count[5m])

# 平均响应时间
rate(http_server_request_duration_seconds_sum[5m]) / rate(http_server_request_duration_seconds_count[5m])

# 按服务分组
sum(rate(http_server_request_duration_seconds_count[5m])) by (service_name)

# 错误率
sum(rate(http_server_request_duration_seconds_count{status_code=~"5.."}[5m])) / sum(rate(http_server_request_duration_seconds_count[5m]))
```

## 🔍 验证 Metrics 是否工作

### 1. 检查 Collector 端点

```bash
curl http://localhost:8889/metrics
```

应该能看到 Prometheus 格式的 metrics 数据。

### 2. 触发一些请求

```bash
# 触发 service-a 的请求
curl http://localhost:3001/api/process

# 等待几秒钟，让 metrics 收集
sleep 5
```

### 3. 在 Grafana 中查询

在 Grafana Explore 中查询：
```
{__name__=~"http.*"}
```

应该能看到 HTTP 相关的 metrics。

## 🎯 完整流程

```
应用程序 (metricReader)
  ↓ OTLP/HTTP
OpenTelemetry Collector (端口 4318/v1/metrics)
  ↓ Prometheus 格式
Prometheus Exporter (端口 8889/metrics)
  ↓
Grafana (Prometheus 数据源)
```

## 💡 提示

1. **时间范围**：确保选择正确的时间范围（Last 5 minutes 或更长时间）
2. **等待数据**：Metrics 每 10 秒导出一次，可能需要等待几秒钟才能看到数据
3. **服务名**：在 Grafana 中使用 Docker 服务名（如 `otel-collector`），而不是 `localhost`
4. **标签过滤**：使用 `{service_name="service-a"}` 来过滤特定服务的 metrics

## 🐛 故障排查

### 看不到 Metrics

1. **检查 Collector 日志**：
   ```bash
   docker logs otel-collector --tail 20
   ```
   查看是否有错误

2. **检查端点**：
   ```bash
   curl http://localhost:8889/metrics
   ```
   应该返回 Prometheus 格式的数据

3. **检查应用程序**：
   确认应用程序已配置 `metricReader` 并已重启

4. **检查 Grafana 数据源**：
   确认 Prometheus 数据源的 URL 是 `http://otel-collector:8889`

