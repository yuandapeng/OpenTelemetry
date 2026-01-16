# 📤 数据分发到后端 - 详细解释

## 🎯 核心概念

**数据分发**指的是：OpenTelemetry Collector 接收到统一格式的数据（OTLP）后，根据数据类型（Traces、Logs、Metrics）分别发送到不同的专门存储后端。

## 📊 可视化理解

```
应用程序发送数据
      ↓
  [统一格式 OTLP]
      ↓
OpenTelemetry Collector (接收)
      ↓
  [根据类型分发]
      ├─ Traces  → Jaeger (专门存 Traces)
      ├─ Logs    → Loki (专门存 Logs)
      └─ Metrics → Prometheus (专门存 Metrics)
```

## 🔍 详细流程

### 1. 应用程序发送数据

应用程序通过 OpenTelemetry SDK 发送数据，**所有数据都使用相同的 OTLP 协议**：

```javascript
// 应用程序代码
const sdk = new NodeSDK({
  // Traces - 发送到 Collector
  traceExporter: new OTLPTraceExporter({
    url: 'http://localhost:4318/v1/traces',  // ← 统一地址
  }),
  
  // Metrics - 发送到 Collector
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: 'http://localhost:4318/v1/metrics',  // ← 统一地址
    }),
  }),
  
  // Logs - 发送到 Collector
  logRecordProcessor: new BatchLogRecordProcessor(
    new OTLPLogExporter({
      url: 'http://localhost:4318/v1/logs',  // ← 统一地址
    })
  ),
});
```

**关键点：**
- ✅ 所有数据都发送到同一个 Collector（`localhost:4318`）
- ✅ 使用统一的 OTLP 协议
- ✅ 应用程序不需要知道后端是什么

### 2. Collector 接收数据

Collector 通过 OTLP receiver 接收所有数据：

```yaml
receivers:
  otlp:
    protocols:
      http:
        endpoint: 0.0.0.0:4318  # ← 统一接收端口
```

**接收到的数据：**
- Traces：`POST /v1/traces`
- Metrics：`POST /v1/metrics`
- Logs：`POST /v1/logs`

### 3. Collector 处理数据

Collector 对数据进行处理：

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
- 批量处理：将多个数据点合并，减少网络请求
- 添加标签：确保所有数据都有 `traceId` 和 `spanId`，方便关联

### 4. Collector 分发数据（关键步骤）

这是"分发"的核心！Collector 根据数据类型，将数据发送到不同的后端：

```yaml
service:
  pipelines:
    # Traces 管道：只处理 Traces 数据
    traces:
      receivers: [otlp]      # 从 OTLP receiver 接收
      processors: [batch, attributes]  # 处理
      exporters: [zipkin]     # 导出到 Jaeger ← 分发！
    
    # Logs 管道：只处理 Logs 数据
    logs:
      receivers: [otlp]       # 从 OTLP receiver 接收
      processors: [batch, attributes]  # 处理
      exporters: [otlphttp]   # 导出到 Loki ← 分发！
    
    # Metrics 管道：只处理 Metrics 数据
    metrics:
      receivers: [otlp]       # 从 OTLP receiver 接收
      processors: [batch, attributes]  # 处理
      exporters: [prometheus] # 导出到 Prometheus ← 分发！
```

## 🎯 为什么需要分发？

### 原因 1：不同后端擅长不同场景

| 数据类型 | 后端 | 为什么选择它 |
|---------|------|------------|
| **Traces** | Jaeger | 专门设计用于分布式追踪，支持复杂的查询和可视化 |
| **Logs** | Loki | 专门设计用于日志聚合，高效存储和查询文本日志 |
| **Metrics** | Prometheus | 专门设计用于指标监控，支持 PromQL 查询语言 |

### 原因 2：数据格式不同

虽然都使用 OTLP 协议发送，但后端需要不同的格式：

```
OTLP Traces → Collector → 转换为 Zipkin 格式 → Jaeger
OTLP Logs   → Collector → 转换为 Loki 格式 → Loki
OTLP Metrics → Collector → 转换为 Prometheus 格式 → Prometheus
```

### 原因 3：查询方式不同

每个后端都有自己的查询语言和 API：

- **Jaeger**：通过 Trace ID 查询，支持时间范围、服务过滤
- **Loki**：使用 LogQL 查询，支持标签过滤、文本搜索
- **Prometheus**：使用 PromQL 查询，支持聚合、计算

## 📋 实际例子

### 场景：一个 HTTP 请求

```
1. 用户访问 http://localhost:3001/api/process
   ↓
2. service-a 处理请求
   ↓
3. OpenTelemetry SDK 自动捕获：
   ├─ Trace: 创建 Span，记录请求链路
   ├─ Log: 记录 "收到请求"、"调用服务B" 等
   └─ Metric: 记录请求数、响应时间等
   ↓
4. 所有数据发送到 Collector (localhost:4318)
   ↓
5. Collector 分发：
   ├─ Trace → Jaeger
   │   └─ 可以在 Jaeger UI 看到完整的调用链路
   ├─ Log → Loki
   │   └─ 可以在 Grafana 中查询日志
   └─ Metric → Prometheus
       └─ 可以在 Grafana 中查看指标图表
```

### 在 Grafana 中关联查询

虽然数据存储在不同的后端，但可以通过 `traceId` 关联：

```
1. 在 Jaeger 中找到 Trace
   → traceId: "abc123"
   → 看到：service-a → service-b 的调用链路

2. 在 Grafana Loki 中查询
   → {trace_id="abc123"}
   → 看到：该请求的所有日志

3. 在 Grafana Prometheus 中查询
   → http_server_request_duration_seconds{trace_id="abc123"}
   → 看到：该请求的性能指标
```

## 🔄 完整数据流

```
┌─────────────────────────────────────────┐
│  应用程序 (service-a/service-b)          │
│  - 发送 Traces                           │
│  - 发送 Logs                             │
│  - 发送 Metrics                          │
│  所有数据 → OTLP 协议 → Collector:4318   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  OpenTelemetry Collector                 │
│  ┌─────────────────────────────────────┐ │
│  │ Receivers: OTLP                     │ │
│  │  接收所有类型的数据                  │ │
│  └─────────────────────────────────────┘ │
│  ┌─────────────────────────────────────┐ │
│  │ Processors:                         │ │
│  │  - batch: 批量处理                  │ │
│  │  - attributes: 添加 traceId         │ │
│  └─────────────────────────────────────┘ │
│  ┌─────────────────────────────────────┐ │
│  │ Exporters: 分发数据                 │ │
│  │  ├─ Traces → zipkin → Jaeger        │ │
│  │  ├─ Logs → otlphttp → Loki          │ │
│  │  └─ Metrics → prometheus → Prometheus│ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
         ↓              ↓              ↓
    ┌────────┐    ┌────────┐    ┌──────────┐
    │ Jaeger │    │  Loki  │    │Prometheus│
    │ Traces │    │  Logs  │    │ Metrics  │
    └────────┘    └────────┘    └──────────┘
         ↓              ↓              ↓
    ┌─────────────────────────────────────┐
    │         Grafana (统一可视化)         │
    │  - 查询 Jaeger 的 Traces            │
    │  - 查询 Loki 的 Logs                │
    │  - 查询 Prometheus 的 Metrics       │
    └─────────────────────────────────────┘
```

## 💡 关键理解点

### 1. 统一入口，分别存储

- **入口统一**：所有数据都发送到 Collector
- **存储分离**：不同类型的数据存储在不同的后端
- **查询统一**：在 Grafana 中统一查询

### 2. Collector 的作用

Collector 就像一个"分发中心"：
- 接收统一格式的数据
- 处理数据（批量、添加标签）
- 根据类型分发到不同后端
- 转换数据格式（如果需要）

### 3. 为什么不用一个后端？

虽然可以尝试用一个后端存储所有数据，但：
- ❌ 性能问题：不同类型的数据查询方式不同
- ❌ 功能限制：每个后端都有专门优化的功能
- ❌ 扩展性差：难以针对特定类型优化

### 4. 数据关联

虽然数据存储在不同后端，但通过 `traceId` 可以关联：
- 在 Jaeger 中看到 Trace
- 通过 traceId 在 Loki 中找到相关日志
- 通过 traceId 在 Prometheus 中找到相关指标

## 🎯 总结

**"数据分发到后端"** 的含义：

1. **统一接收**：Collector 接收所有类型的数据（OTLP 格式）
2. **分类处理**：根据数据类型（Traces/Logs/Metrics）分别处理
3. **分别导出**：将不同类型的数据发送到专门的后端
4. **格式转换**：将 OTLP 格式转换为后端需要的格式
5. **关联查询**：通过 traceId 在不同后端中关联查询

这样设计的好处：
- ✅ 应用程序简单：只需要发送到 Collector
- ✅ 后端专业：每个后端都针对特定类型优化
- ✅ 易于扩展：可以轻松添加新的后端
- ✅ 统一查询：在 Grafana 中统一查看

