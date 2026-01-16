# 🎯 4318 统一接收，然后分发 - 详细说明

## ✅ 你的理解完全正确！

**4318 端口统一接收所有数据，然后 Collector 根据数据类型分发到不同的后端。**

## 📊 完整流程

```
┌─────────────────────────────────────────┐
│  应用程序 (service-a/service-b)         │
│                                         │
│  发送所有数据到同一个地址：              │
│  http://localhost:4318                 │
│                                         │
│  ├─ Traces  → /v1/traces               │
│  ├─ Logs    → /v1/logs                 │
│  └─ Metrics → /v1/metrics              │
└─────────────────────────────────────────┘
              ↓
        [端口 4318]
              ↓
┌─────────────────────────────────────────┐
│  OpenTelemetry Collector               │
│                                         │
│  Receivers (接收器):                    │
│  ┌───────────────────────────────────┐ │
│  │ otlp:                             │ │
│  │   http:                           │ │
│  │     endpoint: 0.0.0.0:4318       │ │ ← 统一接收端口
│  └───────────────────────────────────┘ │
│                                         │
│  Processors (处理器):                   │
│  ┌───────────────────────────────────┐ │
│  │ - batch: 批量处理                 │ │
│  │ - attributes: 添加 traceId         │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Exporters (导出器 - 分发):            │
│  ┌───────────────────────────────────┐ │
│  │ Traces  → zipkin → Jaeger         │ │
│  │ Logs    → otlphttp → Loki         │ │
│  │ Metrics → prometheus → Prometheus │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
    ↓              ↓              ↓
┌────────┐    ┌────────┐    ┌──────────┐
│ Jaeger │    │  Loki  │    │Prometheus│
│ :16686 │    │ :3100  │    │  :9090   │
└────────┘    └────────┘    └──────────┘
```

## 🔍 详细步骤

### 步骤 1：应用程序发送数据

所有数据都发送到 **同一个端口 4318**，只是路径不同：

```javascript
// 应用程序配置
const COLLECTOR_URL = 'http://localhost:4318';

// Traces - 发送到 4318/v1/traces
traceExporter: new OTLPTraceExporter({
  url: `${COLLECTOR_URL}/v1/traces`,  // ← http://localhost:4318/v1/traces
}),

// Logs - 发送到 4318/v1/logs
logRecordProcessor: new BatchLogRecordProcessor(
  new OTLPLogExporter({
    url: `${COLLECTOR_URL}/v1/logs`,  // ← http://localhost:4318/v1/logs
  })
),

// Metrics - 发送到 4318/v1/metrics
metricReader: new PeriodicExportingMetricReader({
  exporter: new OTLPMetricExporter({
    url: `${COLLECTOR_URL}/v1/metrics`,  // ← http://localhost:4318/v1/metrics
  }),
}),
```

**关键点：**
- ✅ 所有数据都发送到 `localhost:4318`
- ✅ 只是路径不同（`/v1/traces`、`/v1/logs`、`/v1/metrics`）
- ✅ 使用统一的 OTLP 协议

### 步骤 2：Collector 在 4318 端口接收

```yaml
receivers:
  otlp:
    protocols:
      http:
        endpoint: 0.0.0.0:4318  # ← 统一接收端口
```

**Collector 监听 4318 端口，接收：**
- `POST http://localhost:4318/v1/traces` → Traces 数据
- `POST http://localhost:4318/v1/logs` → Logs 数据
- `POST http://localhost:4318/v1/metrics` → Metrics 数据

### 步骤 3：Collector 处理数据

```yaml
processors:
  batch:  # 批量处理，提高性能
  attributes:  # 添加关联标签
    actions:
      - key: trace.trace_id
        from_attribute: trace_id
        action: insert
```

**处理内容：**
- 批量处理：将多个数据点合并
- 添加标签：确保所有数据都有 `traceId`，方便关联

### 步骤 4：Collector 分发数据（关键！）

根据数据类型，分发到不同的后端：

```yaml
service:
  pipelines:
    # Traces 管道
    traces:
      receivers: [otlp]      # 从 4318 接收 Traces
      processors: [batch, attributes]
      exporters: [zipkin]     # → 发送到 Jaeger:9411
    
    # Logs 管道
    logs:
      receivers: [otlp]       # 从 4318 接收 Logs
      processors: [batch, attributes]
      exporters: [otlphttp]  # → 发送到 Loki:3100/otlp
    
    # Metrics 管道
    metrics:
      receivers: [otlp]       # 从 4318 接收 Metrics
      processors: [batch, attributes]
      exporters: [prometheus] # → 暴露在 8889/metrics，Prometheus 拉取
```

## 🎯 实际例子

### 场景：一个 HTTP 请求

```
1. 用户访问 http://localhost:3001/api/process
   ↓
2. service-a 处理请求，OpenTelemetry SDK 自动捕获：
   ├─ Trace: 创建 Span，记录请求链路
   ├─ Log: 记录 "收到请求"、"调用服务B"
   └─ Metric: 记录请求数、响应时间
   ↓
3. 所有数据发送到 Collector:4318
   ├─ POST http://localhost:4318/v1/traces  (Trace 数据)
   ├─ POST http://localhost:4318/v1/logs    (Log 数据)
   └─ POST http://localhost:4318/v1/metrics (Metric 数据)
   ↓
4. Collector 在 4318 端口接收所有数据
   ↓
5. Collector 处理数据（批量、添加 traceId）
   ↓
6. Collector 分发数据：
   ├─ Traces → Jaeger:9411
   │   └─ 你可以在 Jaeger UI (http://localhost:16686) 看到
   ├─ Logs → Loki:3100/otlp
   │   └─ 你可以在 Grafana 中查询日志
   └─ Metrics → Prometheus Exporter (8889/metrics)
       └─ Prometheus 拉取 → 你可以在 Grafana 中查看指标
```

## 💡 关键理解

### 1. 统一入口

```
应用程序只需要知道一个地址：
  http://localhost:4318

不需要知道后端是什么：
  ❌ 不需要知道 Jaeger 地址
  ❌ 不需要知道 Loki 地址
  ❌ 不需要知道 Prometheus 地址
```

### 2. 智能分发

```
Collector 就像一个智能路由器：
  收到 Traces → 路由到 Jaeger
  收到 Logs   → 路由到 Loki
  收到 Metrics → 路由到 Prometheus
```

### 3. 格式转换

```
Collector 还会转换格式：
  OTLP Traces → Zipkin 格式 → Jaeger
  OTLP Logs   → Loki 格式 → Loki
  OTLP Metrics → Prometheus 格式 → Prometheus
```

## 📋 端口总结

| 端口 | 用途 | 说明 |
|------|------|------|
| **4318** | **统一接收** | Collector 接收所有 OTLP 数据 |
| 4317 | gRPC 接收 | Collector 接收 gRPC 格式的 OTLP 数据 |
| 9411 | Jaeger 接收 | Collector 发送 Traces 到 Jaeger |
| 3100 | Loki 接收 | Collector 发送 Logs 到 Loki |
| 8889 | Prometheus 端点 | Collector 暴露 Metrics 供 Prometheus 拉取 |
| 9090 | Prometheus API | Prometheus 服务器提供查询 API |
| 16686 | Jaeger UI | 查看 Traces |
| 3003 | Grafana | 统一可视化 |

## ✅ 总结

你的理解完全正确：

1. **4318 统一接收**：所有数据（Traces、Logs、Metrics）都发送到 Collector 的 4318 端口
2. **Collector 处理**：批量处理、添加关联标签
3. **智能分发**：根据数据类型分发到不同的后端
   - Traces → Jaeger
   - Logs → Loki
   - Metrics → Prometheus

**好处：**
- ✅ 应用程序简单：只需要配置一个地址
- ✅ 灵活扩展：可以轻松添加新的后端
- ✅ 统一管理：所有数据处理逻辑集中在 Collector

