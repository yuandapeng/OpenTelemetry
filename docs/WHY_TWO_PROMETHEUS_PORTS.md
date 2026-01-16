# 🤔 为什么需要两个 Prometheus 端口？

## 📊 两个组件的作用

```
┌─────────────────────────┐         ┌─────────────────────────┐
│ Prometheus Exporter     │         │ Prometheus Server       │
│ (端口 8889)             │         │ (端口 9090)             │
│                         │         │                         │
│ 作用：暴露 Metrics 端点  │   →     │ 作用：拉取并存储 Metrics │
│ 提供：/metrics          │         │ 提供：完整的 Prometheus │
│ 格式：Prometheus 格式    │         │        API 和查询功能   │
└─────────────────────────┘         └─────────────────────────┘
```

## 🔍 详细解释

### 1. Prometheus Exporter (端口 8889)

**位置：** OpenTelemetry Collector 内部

**作用：**
- 将 OpenTelemetry Metrics 转换为 Prometheus 格式
- 暴露一个 HTTP 端点 `/metrics`
- 提供 Prometheus 格式的数据供拉取

**配置：**
```yaml
# collector-config.yaml
exporters:
  prometheus:
    endpoint: "0.0.0.0:8889"  # ← 暴露 Metrics 端点
```

**特点：**
- ✅ 只提供 `/metrics` 端点（Prometheus 格式）
- ❌ 不提供 Prometheus API（如 `/api/v1/query`）
- ❌ 不存储数据（只是暴露当前数据）
- ❌ 不支持 PromQL 查询

**访问：**
```bash
curl http://localhost:8889/metrics
# 返回 Prometheus 格式的 metrics 数据
```

### 2. Prometheus Server (端口 9090)

**位置：** 独立的 Prometheus 服务器

**作用：**
- 定期从 Exporter 拉取 Metrics 数据
- 存储 Metrics 数据（时间序列数据库）
- 提供完整的 Prometheus API
- 支持 PromQL 查询语言

**配置：**
```yaml
# prometheus-config.yaml
scrape_configs:
  - job_name: 'otel-collector'
    static_configs:
      - targets: ['otel-collector:8889']  # ← 从 Exporter 拉取
```

**特点：**
- ✅ 提供完整的 Prometheus API
- ✅ 存储历史数据
- ✅ 支持 PromQL 查询
- ✅ 支持告警规则
- ✅ 支持服务发现

**访问：**
```bash
# Prometheus UI
http://localhost:9090

# Prometheus API
curl http://localhost:9090/api/v1/query?query=up
```

## 🔄 数据流程

```
1. 应用程序发送 Metrics
   ↓
2. OpenTelemetry Collector 接收
   ↓
3. Prometheus Exporter (8889)
   ├─ 转换格式：OTLP → Prometheus 格式
   └─ 暴露端点：http://localhost:8889/metrics
   ↓
4. Prometheus Server (9090)
   ├─ 定期拉取：从 8889/metrics 拉取数据
   ├─ 存储数据：保存到时间序列数据库
   └─ 提供 API：http://localhost:9090/api/v1/query
   ↓
5. Grafana
   └─ 连接 Prometheus Server (9090) 查询数据
```

## 💡 为什么需要两个？

### 原因 1：职责分离

| 组件 | 职责 | 类比 |
|------|------|------|
| **Prometheus Exporter** | 暴露数据端点 | 像"数据源" |
| **Prometheus Server** | 拉取、存储、查询 | 像"数据库+查询引擎" |

### 原因 2：Grafana 需要完整的 API

**问题：** Grafana 在测试 Prometheus 数据源时，会访问：
- `/api/v1/query` - 查询 API
- `/api/v1/label/__name__/values` - 标签 API
- `/api/v1/status/config` - 配置 API

**Prometheus Exporter (8889) 只提供：**
- `/metrics` - 数据端点

**Prometheus Server (9090) 提供：**
- ✅ `/api/v1/query` - 查询 API
- ✅ `/api/v1/label/__name__/values` - 标签 API
- ✅ `/api/v1/status/config` - 配置 API
- ✅ 所有 Prometheus API

### 原因 3：数据存储和查询

**Prometheus Exporter (8889)：**
- ❌ 不存储数据
- ❌ 只暴露当前时刻的数据
- ❌ 不支持历史查询

**Prometheus Server (9090)：**
- ✅ 存储历史数据
- ✅ 支持时间范围查询
- ✅ 支持聚合和计算

## 📋 实际例子

### 场景：查看过去 1 小时的请求数

**如果只有 Exporter (8889)：**
```bash
curl http://localhost:8889/metrics
# 只能看到当前时刻的数据
# 无法查询历史数据
```

**使用 Prometheus Server (9090)：**
```promql
# 查询过去 1 小时的请求速率
rate(http_server_request_duration_seconds_count[1h])
```

## 🎯 架构对比

### 方案 1：只有 Exporter（不工作）

```
应用程序 → Collector → Prometheus Exporter (8889)
                              ↓
                          Grafana
                          ❌ 404 错误（缺少 API）
```

### 方案 2：Exporter + Server（当前方案）

```
应用程序 → Collector → Prometheus Exporter (8889)
                              ↓
                          Prometheus Server (9090)
                              ↓
                          Grafana
                          ✅ 正常工作
```

## 🔧 配置说明

### Collector 配置（Exporter）

```yaml
# collector-config.yaml
exporters:
  prometheus:
    endpoint: "0.0.0.0:8889"  # 暴露 Metrics 端点
```

### Prometheus 配置（Server）

```yaml
# prometheus-config.yaml
scrape_configs:
  - job_name: 'otel-collector'
    static_configs:
      - targets: ['otel-collector:8889']  # 从 Exporter 拉取
```

### Grafana 配置

```
数据源 URL: http://prometheus:9090
           ↑
           使用 Prometheus Server，不是 Exporter
```

## ✅ 总结

**为什么需要两个端口：**

1. **8889 (Prometheus Exporter)**：
   - 作用：暴露 Metrics 数据端点
   - 提供：`/metrics` 端点（Prometheus 格式）
   - 限制：不提供 API，不存储数据

2. **9090 (Prometheus Server)**：
   - 作用：拉取、存储、查询 Metrics
   - 提供：完整的 Prometheus API
   - 功能：支持 PromQL、历史查询、告警

**关系：**
- Exporter (8889) = 数据源（提供数据）
- Server (9090) = 数据库+查询引擎（拉取、存储、查询）

**类比：**
- Exporter 像"水龙头"（提供数据流）
- Server 像"水库+水处理厂"（存储和处理数据）

