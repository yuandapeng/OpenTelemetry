# 🤔 为什么 Prometheus 需要两个组件，而其他的只需要一个？

## 📊 对比分析

### Jaeger 和 Loki：完整的后端服务

```
┌─────────────────┐
│   Jaeger        │  ← 完整的服务
│   (一个服务)     │
│                 │
│  ✅ 接收数据     │
│  ✅ 存储数据     │
│  ✅ 提供 API     │
│  ✅ 提供 UI      │
└─────────────────┘

┌─────────────────┐
│   Loki          │  ← 完整的服务
│   (一个服务)     │
│                 │
│  ✅ 接收数据     │
│  ✅ 存储数据     │
│  ✅ 提供 API     │
│  ✅ 支持查询     │
└─────────────────┘
```

### Prometheus：需要两个组件

```
┌─────────────────┐         ┌─────────────────┐
│ Prometheus      │         │ Prometheus      │
│ Exporter        │   →     │ Server          │
│ (Collector 内)  │         │ (独立服务)      │
│                 │         │                 │
│ ✅ 暴露端点      │         │ ✅ 拉取数据     │
│ ❌ 不存储        │         │ ✅ 存储数据     │
│ ❌ 不提供 API    │         │ ✅ 提供 API     │
└─────────────────┘         └─────────────────┘
```

## 🔍 根本原因

### 原因 1：设计模式不同

#### Jaeger 和 Loki：推送模式（Push）

```
应用程序 → Collector → Jaeger/Loki
              ↓
        直接推送数据
        后端接收并存储
```

**特点：**
- 应用程序主动推送数据
- 后端直接接收并存储
- 一个服务完成所有功能

#### Prometheus：拉取模式（Pull）

```
应用程序 → Collector → Prometheus Exporter
                              ↓
                        暴露 /metrics 端点
                              ↓
                    Prometheus Server 定期拉取
```

**特点：**
- Prometheus Server 主动拉取数据
- Exporter 只负责暴露数据
- 需要两个组件配合

### 原因 2：Prometheus 的设计理念

**Prometheus 的设计哲学：**
- 使用"拉取"（Pull）模式，而不是"推送"（Push）
- 这样可以：
  - ✅ 控制拉取频率
  - ✅ 避免数据丢失（如果服务重启，可以重新拉取）
  - ✅ 更容易发现服务（服务发现）

**因此：**
- Exporter 只负责"暴露数据"（像水龙头）
- Server 负责"拉取数据"（像取水的人）

### 原因 3：Collector 的 Exporter 限制

**OpenTelemetry Collector 的 Prometheus Exporter：**
- 只是 Collector 的一个组件
- 只暴露 `/metrics` 端点
- 不提供完整的 Prometheus API
- 不存储数据

**对比 Jaeger 和 Loki：**
- Jaeger 是完整的服务，可以直接接收数据并提供 API
- Loki 是完整的服务，可以直接接收数据并提供 API
- 它们不需要额外的组件

## 📋 详细对比

### Jaeger 配置

```yaml
# collector-config.yaml
exporters:
  zipkin:
    endpoint: http://jaeger:9411/api/v2/spans
    # ↑ 直接发送到 Jaeger，Jaeger 自己处理一切
```

**Jaeger 做什么：**
- ✅ 接收 Traces 数据
- ✅ 存储 Traces
- ✅ 提供查询 API
- ✅ 提供 UI

**一个服务完成所有功能！**

### Loki 配置

```yaml
# collector-config.yaml
exporters:
  otlphttp:
    endpoint: http://loki:3100/otlp
    # ↑ 直接发送到 Loki，Loki 自己处理一切
```

**Loki 做什么：**
- ✅ 接收 Logs 数据
- ✅ 存储 Logs
- ✅ 提供查询 API
- ✅ 支持 LogQL 查询

**一个服务完成所有功能！**

### Prometheus 配置

```yaml
# collector-config.yaml
exporters:
  prometheus:
    endpoint: "0.0.0.0:8889"
    # ↑ 只暴露端点，不提供 API
```

**Prometheus Exporter 做什么：**
- ✅ 暴露 `/metrics` 端点
- ❌ 不存储数据
- ❌ 不提供 API

**需要 Prometheus Server 配合：**

```yaml
# prometheus-config.yaml
scrape_configs:
  - job_name: 'otel-collector'
    static_configs:
      - targets: ['otel-collector:8889']
        # ↑ Prometheus Server 从这里拉取数据
```

**Prometheus Server 做什么：**
- ✅ 拉取数据（从 Exporter）
- ✅ 存储数据
- ✅ 提供 API
- ✅ 支持 PromQL 查询

**两个组件配合完成功能！**

## 🎯 为什么 Prometheus 这样设计？

### 1. 历史原因

Prometheus 最初设计就是"拉取"模式：
- 每个服务暴露 `/metrics` 端点
- Prometheus Server 定期拉取
- 这是 Prometheus 的核心设计理念

### 2. 灵活性

拉取模式的优势：
- 可以控制拉取频率
- 可以配置多个拉取目标
- 可以动态发现服务
- 如果服务重启，可以重新拉取历史数据

### 3. 标准化

Prometheus 格式已经成为标准：
- 很多工具都暴露 `/metrics` 端点
- Prometheus Server 可以拉取任何符合格式的端点
- 不需要每个服务都实现推送逻辑

## 💡 类比理解

### Jaeger/Loki：像"邮局"

```
你寄信 → 邮局接收 → 邮局存储 → 邮局提供查询
         ↑
    一个地方完成所有事情
```

### Prometheus：像"水龙头 + 水库"

```
水龙头（Exporter）→ 提供水 → 水库（Server）→ 存储水 → 提供查询
     ↑                        ↑
  只负责提供              负责存储和查询
```

## 🔄 如果 Prometheus 也像 Jaeger/Loki 一样？

理论上可以，但需要：

1. **Prometheus Remote Write**：
   ```yaml
   exporters:
     prometheusremotewrite:
       endpoint: http://prometheus:9090/api/v1/write
   ```
   这样可以直接推送，但需要 Prometheus Server 支持 Remote Write

2. **但当前配置使用的是标准 Prometheus Exporter**：
   - 它只暴露 `/metrics` 端点
   - 遵循 Prometheus 的标准拉取模式
   - 这是更常见和标准的做法

## ✅ 总结

**为什么 Prometheus 需要两个组件：**

1. **设计模式不同**：
   - Jaeger/Loki：推送模式，一个服务完成所有功能
   - Prometheus：拉取模式，需要 Exporter 暴露 + Server 拉取

2. **Exporter 的限制**：
   - Collector 的 Prometheus Exporter 只是暴露端点
   - 不提供完整的 Prometheus API
   - 不存储数据

3. **Prometheus 的设计理念**：
   - 标准做法是"拉取"模式
   - 更灵活、更标准化

**简单理解：**
- Jaeger/Loki = 完整的服务（接收+存储+查询）
- Prometheus Exporter = 只暴露数据
- Prometheus Server = 拉取+存储+查询

**所以 Prometheus 需要两个组件配合！**

