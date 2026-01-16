# OpenTelemetry 架构理解

## 🎯 核心概念

### OpenTelemetry = 标准协议 + 数据格式定义

OpenTelemetry **不是**一个存储系统，而是一个**标准协议**，定义了：
- 数据格式（如何组织数据）
- API规范（如何收集数据）
- 传输协议（如何发送数据）

## 📊 三大支柱（Three Pillars）

OpenTelemetry定义了三种可观测性数据类型：

### 1. **Traces（追踪）**
- **作用**：追踪请求在分布式系统中的完整路径
- **数据格式**：Span、Trace、TraceContext
- **存储后端**：Jaeger、Zipkin、Tempo、Datadog等
- **在你的项目中**：使用Jaeger存储trace数据

### 2. **Metrics（指标）**
- **作用**：记录系统性能指标（CPU、内存、请求数等）
- **数据格式**：Counter、Gauge、Histogram
- **存储后端**：Prometheus、InfluxDB、Datadog等
- **示例**：每秒请求数、响应时间分布、错误率

### 3. **Logs（日志）**
- **作用**：记录应用程序的详细日志信息
- **数据格式**：LogRecord
- **存储后端**：Loki、Elasticsearch、Datadog等
- **示例**：错误日志、访问日志、调试信息

## 🏗️ 架构层次

```
┌─────────────────────────────────────────────────────────┐
│  应用程序代码 (Your Application)                        │
│  - Express服务                                          │
│  - 业务逻辑                                             │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│  OpenTelemetry SDK (数据收集层)                         │
│  - 自动Instrumentation                                  │
│  - 手动创建Span/Log/Metric                              │
│  - 数据格式化为OpenTelemetry标准格式                    │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│  OpenTelemetry Exporter (数据导出层)                     │
│  - JaegerExporter (Traces)                              │
│  - PrometheusExporter (Metrics)                         │
│  - OTLPExporter (通用导出器)                            │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│  后端存储系统 (Backend Storage)                          │
│  - Jaeger (存储Traces)                                  │
│  - Prometheus (存储Metrics)                             │
│  - Loki (存储Logs)                                      │
└─────────────────────────────────────────────────────────┘
```

## 🔍 在你的项目中的体现

### 当前项目（只使用了Traces）

```javascript
// 1. OpenTelemetry SDK - 数据收集
const sdk = new NodeSDK({
  resource: new Resource({...}),           // 定义数据格式
  instrumentations: [getNodeAutoInstrumentations()], // 自动收集
});

// 2. OpenTelemetry Exporter - 数据导出
traceExporter: new JaegerExporter({
  endpoint: 'http://localhost:14268/api/traces',
});

// 3. 后端存储 - Jaeger
// Jaeger接收OpenTelemetry格式的数据并存储
```

### 数据流程

```
1. 应用程序执行
   ↓
2. OpenTelemetry SDK自动收集trace数据
   ↓
3. 数据格式化为OpenTelemetry标准格式
   ↓
4. JaegerExporter发送到Jaeger
   ↓
5. Jaeger存储和索引数据
   ↓
6. Jaeger UI可视化展示
```

## 💡 关键理解

### 1. OpenTelemetry只定义格式，不存储数据

```
OpenTelemetry = 协议规范
├── 定义数据格式（Span、Metric、Log的结构）
├── 定义API（如何创建和操作数据）
└── 定义传输协议（如何发送数据）

后端系统 = 实际存储
├── Jaeger → 存储Traces
├── Prometheus → 存储Metrics
└── Loki → 存储Logs
```

### 2. 可以自由选择后端

```
同一个OpenTelemetry数据可以发送到多个后端：

Traces:
  OpenTelemetry → Jaeger
  OpenTelemetry → Zipkin
  OpenTelemetry → Datadog

Metrics:
  OpenTelemetry → Prometheus
  OpenTelemetry → InfluxDB
  OpenTelemetry → CloudWatch
```

### 3. 统一的数据格式

无论使用哪个后端，OpenTelemetry都使用统一的数据格式：

```javascript
// Trace数据格式（OpenTelemetry标准）
{
  traceId: "32位十六进制",
  spanId: "16位十六进制",
  name: "操作名称",
  attributes: {...},
  events: [...],
  ...
}
```

## 🔄 完整示例

### 如果添加Metrics和Logs

```javascript
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');
const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus');
const { OTLPLogExporter } = require('@opentelemetry/exporter-logs-otlp-http');

const sdk = new NodeSDK({
  resource: new Resource({
    [SEMRESATTRS_SERVICE_NAME]: 'service-a',
    [SEMRESATTRS_SERVICE_VERSION]: '1.0.0',
  }),
  
  // Traces - 发送到Jaeger
  traceExporter: new JaegerExporter({
    endpoint: 'http://localhost:14268/api/traces',
  }),
  
  // Metrics - 发送到Prometheus
  // 注意：Metrics使用metricReader，不是metricExporter
  metricReader: new PrometheusExporter({
    port: 8889, // Prometheus从这个端口拉取数据
  }),
  
  // Logs - 发送到OpenTelemetry Collector（然后转发到Loki）
  // 注意：Node.js的Logs支持需要额外配置
  // 通常通过OTLP发送到Collector，Collector再转发到Loki
  // logRecordProcessor: new BatchLogRecordProcessor(
  //   new OTLPLogExporter({
  //     url: 'http://localhost:4318/v1/logs',
  //   })
  // ),
  
  instrumentations: [getNodeAutoInstrumentations()],
});
```

### 使用OTLP统一导出（推荐）

更推荐使用OTLP导出器，统一发送到OpenTelemetry Collector：

```javascript
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-http');
const { OTLPLogExporter } = require('@opentelemetry/exporter-logs-otlp-http');

const sdk = new NodeSDK({
  // 统一发送到OpenTelemetry Collector
  traceExporter: new OTLPTraceExporter({
    url: 'http://localhost:4318/v1/traces',
  }),
  
  // 使用OTLP导出Metrics（需要PeriodicExportingMetricReader）
  // metricReader: new PeriodicExportingMetricReader({
  //   exporter: new OTLPMetricExporter({
  //     url: 'http://localhost:4318/v1/metrics',
  //   }),
  //   exportIntervalMillis: 10000,
  // }),
  
  // Logs通过Collector转发到Loki
  // logRecordProcessor: new BatchLogRecordProcessor(
  //   new OTLPLogExporter({
  //     url: 'http://localhost:4318/v1/logs',
  //   })
  // ),
});
```

## 📝 总结

| 层面 | 作用 | 示例 |
|------|------|------|
| **OpenTelemetry协议** | 定义数据格式和API | Span、Metric、Log的格式 |
| **OpenTelemetry SDK** | 收集和格式化数据 | `@opentelemetry/sdk-node` |
| **OpenTelemetry Exporter** | 导出数据到后端 | `JaegerExporter` |
| **后端存储系统** | 实际存储和查询 | Jaeger、Prometheus、Loki |

**核心思想**：OpenTelemetry是"语言"，后端系统是"字典"（存储和查询数据的地方）。

