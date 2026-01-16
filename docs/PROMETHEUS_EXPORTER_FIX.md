# 🔧 Prometheus Exporter 404 错误修复

## ❌ 问题

Grafana 连接 Prometheus 数据源时出现 `404 Not Found` 错误。

## 🔍 可能的原因

1. **Prometheus exporter 没有正确启动**
2. **端点路径不正确**
3. **Collector 配置格式错误**
4. **应用程序没有发送 metrics 数据**

## ✅ 解决方案

### 方案 1：检查 Prometheus Exporter 配置

OpenTelemetry Collector 的 Prometheus exporter 配置应该是：

```yaml
exporters:
  prometheus:
    endpoint: "0.0.0.0:8889"
```

### 方案 2：验证端点是否可用

```bash
# 检查端点是否监听
curl http://localhost:8889/metrics

# 如果返回 404 或连接失败，说明 exporter 没有启动
```

### 方案 3：检查应用程序是否发送 Metrics

确保应用程序配置了 `metricReader`：

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

### 方案 4：使用 OTLP HTTP 直接发送到 Prometheus（替代方案）

如果 Prometheus exporter 不工作，可以考虑：

1. **使用 Prometheus Remote Write**：
   ```yaml
   exporters:
     prometheusremotewrite:
       endpoint: http://prometheus:9090/api/v1/write
   ```

2. **或者使用 OTLP 发送到支持 OTLP 的 Prometheus**（如果可用）

## 🔍 诊断步骤

1. **检查 Collector 日志**：
   ```bash
   docker logs otel-collector --tail 50 | grep -i "prometheus\|error"
   ```

2. **检查端口监听**：
   ```bash
   docker exec otel-collector netstat -tlnp | grep 8889
   ```

3. **检查配置**：
   ```bash
   docker exec otel-collector cat /etc/otel-collector-config.yaml | grep -A 5 prometheus
   ```

4. **测试端点**：
   ```bash
   curl -v http://localhost:8889/metrics
   ```

## 💡 临时解决方案

如果 Prometheus exporter 不工作，可以：

1. **暂时跳过 Metrics**：只使用 Traces 和 Logs
2. **使用应用程序直接暴露 Prometheus 端点**：在应用程序中直接使用 Prometheus exporter
3. **等待有 Metrics 数据后再配置**：确保应用程序先发送 metrics 数据

## 🎯 下一步

1. 确认应用程序已配置 `metricReader` 并已重启
2. 触发一些请求，生成 metrics 数据
3. 等待几秒钟，让 metrics 收集
4. 再次测试 `http://localhost:8889/metrics` 端点

