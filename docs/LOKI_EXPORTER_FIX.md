# 🔧 Loki Exporter 配置问题 - 解决方案

## ❌ 问题

Collector 不支持 `loki` exporter，导致 Collector 一直重启。

## ✅ 解决方案

### 方案 1：使用 Promtail 收集日志（推荐）

由于 OpenTelemetry Collector 的某些版本可能不包含 Loki exporter，可以使用 Promtail 作为替代：

1. **添加 Promtail 到 docker-compose.yml**：

```yaml
promtail:
  image: grafana/promtail:latest
  container_name: promtail
  volumes:
    - ./promtail-config.yaml:/etc/promtail/config.yml
    - /var/log:/var/log:ro  # 如果需要读取系统日志
  command: -config.file=/etc/promtail/config.yml
  depends_on:
    - loki
  networks:
    - otel-network
```

2. **配置 Promtail** 从 Collector 的文件输出读取日志

### 方案 2：应用程序直接发送到 Loki（当前方案）

由于我们已经配置了应用程序直接发送日志到 Collector，可以：

1. **暂时禁用 Collector 的日志管道**（已做）
2. **应用程序日志会发送到 Collector，但不会转发到 Loki**
3. **需要配置应用程序直接发送到 Loki**

### 方案 3：使用 OTLP HTTP 导出

如果 Loki 支持 OTLP，可以配置：

```yaml
exporters:
  otlphttp/loki:
    endpoint: http://loki:3100/otlp
```

但需要确认 Loki 是否支持 OTLP 协议。

## 🎯 当前状态

- ✅ 应用程序已配置日志记录
- ✅ 日志会发送到 Collector (http://localhost:4318/v1/logs)
- ❌ Collector 无法转发到 Loki（缺少 exporter）
- ⚠️ 需要配置替代方案

## 💡 临时解决方案

### 方案 A：直接发送到 Loki（绕过 Collector）

修改应用程序配置，直接发送到 Loki：

```javascript
// 在 tracing.js 中
logRecordProcessor: new BatchLogRecordProcessor(
  new OTLPLogExporter({
    // 直接发送到 Loki（如果 Loki 支持 OTLP）
    url: 'http://localhost:3100/otlp/v1/logs',
  })
)
```

### 方案 B：使用 Promtail

1. 配置 Collector 输出日志到文件
2. 使用 Promtail 读取文件并发送到 Loki

### 方案 C：暂时跳过日志收集

如果主要关注 Traces，可以：
- 先使用 Jaeger 查看 Traces
- 日志收集可以后续配置

## 📝 下一步

建议：
1. **先使用 Jaeger 查看 Traces**（已正常工作）
2. **日志收集可以后续配置**（需要额外的组件或配置）
3. **或者使用 Promtail 作为替代方案**

