# 📋 标准日志收集方案

## ❌ 当前方案的问题

当前使用的方案（Collector → 文件 → Promtail → Loki）不是标准的 OpenTelemetry 方案，因为：
1. 需要额外的 Promtail 组件
2. 通过文件系统传递数据（效率低）
3. 不是 OpenTelemetry 的标准流程

## ✅ 标准方案选项

### 方案 1：使用 Grafana Alloy（推荐，最新标准）

**Grafana Alloy** 是基于 OpenTelemetry Collector 的厂商中立分发版，专门设计用于统一收集日志、指标和追踪数据。

#### 优势：
- ✅ 基于 OpenTelemetry 标准
- ✅ 原生支持 Loki exporter
- ✅ 统一收集 Traces、Logs、Metrics
- ✅ Grafana 官方推荐

#### 配置方式：

```yaml
# 替换 docker-compose.yml 中的 otel-collector
alloy:
  image: grafana/alloy:latest
  container_name: alloy
  volumes:
    - ./alloy-config.yaml:/etc/alloy/config.alloy
  ports:
    - "4317:4317"  # OTLP gRPC
    - "4318:4318"  # OTLP HTTP
  networks:
    - otel-network
```

### 方案 2：应用程序直接发送到 Loki（简化方案）

如果不需要 Collector 的中间处理，可以直接发送到 Loki：

```javascript
// 在 tracing.js 中
logRecordProcessor: new BatchLogRecordProcessor(
  new OTLPLogExporter({
    // 直接发送到 Loki（如果 Loki 支持 OTLP）
    url: 'http://localhost:3100/otlp/v1/logs',
  })
)
```

**注意**：需要 Loki 2.0+ 并启用 OTLP 支持。

### 方案 3：使用 Promtail（Loki 标准方案，非 OpenTelemetry）

虽然 Promtail 不是 OpenTelemetry 标准，但它是 Loki 的官方推荐方案：

- ✅ 与 Loki 深度集成
- ✅ 高性能
- ❌ 不是 OpenTelemetry 标准

**当前使用的就是这个方案**（虽然不是 OpenTelemetry 标准，但是 Loki 的标准方案）。

## 🎯 推荐方案对比

| 方案 | OpenTelemetry 标准 | 复杂度 | 性能 | 推荐度 |
|------|-------------------|--------|------|--------|
| **Grafana Alloy** | ✅ 是 | 中 | 高 | ⭐⭐⭐⭐⭐ |
| **OTLP → Loki** | ✅ 是 | 低 | 高 | ⭐⭐⭐⭐ |
| **Promtail** | ❌ 否 | 中 | 高 | ⭐⭐⭐ |

## 💡 建议

### 如果追求 OpenTelemetry 标准：

**使用 Grafana Alloy**：
1. 替换 Collector 为 Alloy
2. 配置 Alloy 的 Loki exporter
3. 统一收集所有数据

### 如果追求简单实用：

**保持当前方案**（Promtail）：
- 虽然不完全是 OpenTelemetry 标准
- 但是是 Loki 的标准方案
- 已经工作正常
- 性能好，集成度高

### 如果追求纯 OpenTelemetry：

**应用程序直接发送到 Loki**：
- 需要 Loki 2.0+ 并启用 OTLP
- 绕过 Collector
- 最简单，但失去 Collector 的处理能力

## 🔄 迁移到 Grafana Alloy（标准方案）

如果你想使用标准的 OpenTelemetry 方案，我可以帮你配置 Grafana Alloy。

