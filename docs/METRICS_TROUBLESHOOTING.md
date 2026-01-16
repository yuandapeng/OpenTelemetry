# 🔧 Metrics 404 错误排查指南

## ❌ 当前问题

Grafana 连接 Prometheus 数据源时出现 `404 Not Found` 错误。

## 🔍 可能的原因

### 1. 应用程序没有配置 Metrics

**检查**：确认 `service-a` 和 `service-b` 的 `tracing.js` 是否包含 `metricReader`。

**解决方案**：
- 如果使用 `tracing-full-example.js`，它已经包含 metrics 配置
- 如果使用 `tracing.js`，需要添加 metrics 支持

### 2. Prometheus Exporter 没有启动

**检查**：
```bash
curl http://localhost:8889/metrics
```

**如果返回 404 或连接失败**：
- Prometheus exporter 可能没有正确配置
- 或者没有 metrics 数据，exporter 没有启动

### 3. 没有 Metrics 数据

**检查**：
- 确认应用程序已配置 `metricReader`
- 确认应用程序已重启
- 触发一些请求生成 metrics

## ✅ 解决步骤

### 步骤 1：确认应用程序配置

检查 `services/service-a/tracing.js` 是否包含：

```javascript
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-http');
const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');

metricReader: new PeriodicExportingMetricReader({
  exporter: new OTLPMetricExporter({
    url: `${COLLECTOR_URL}/v1/metrics`,
  }),
  exportIntervalMillis: 10000,
}),
```

### 步骤 2：安装依赖

```bash
cd services/service-a
npm install @opentelemetry/exporter-metrics-otlp-http @opentelemetry/sdk-metrics
```

### 步骤 3：重启应用程序

```bash
# 停止并重新启动 service-a 和 service-b
```

### 步骤 4：触发请求生成 Metrics

```bash
curl http://localhost:3001/api/process
```

### 步骤 5：等待并测试

```bash
# 等待 10-15 秒，让 metrics 收集
sleep 15

# 测试端点
curl http://localhost:8889/metrics
```

### 步骤 6：在 Grafana 中配置

如果端点可用，在 Grafana 中：
- URL: `http://otel-collector:8889`
- 点击 "Save & test"

## 💡 临时解决方案

如果 Prometheus exporter 仍然不工作：

1. **暂时跳过 Metrics**：只使用 Traces 和 Logs
2. **使用 `tracing-full-example.js`**：它包含完整的 metrics 配置
3. **检查 Collector 日志**：查看是否有错误信息

## 🎯 验证

成功配置后，应该能够：
1. 访问 `http://localhost:8889/metrics` 看到 Prometheus 格式的数据
2. 在 Grafana 中成功连接 Prometheus 数据源
3. 在 Grafana Explore 中查询 metrics

