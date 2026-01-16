# 🔧 Jaeger 404 错误修复

## ❌ 问题

在 Jaeger UI 中查询 Trace ID 时出现 `404 Not Found` 错误。

## 🔍 原因

**Jaeger all-in-one 默认不启用 Zipkin 端点（9411 端口）**

Collector 配置使用 Zipkin exporter 发送到 `http://jaeger:9411/api/v2/spans`，但 Jaeger 的 9411 端口没有监听。

## ✅ 解决方案

**改用 Jaeger 的 OTLP gRPC 端点**

Jaeger all-in-one 默认启用 OTLP，使用 gRPC 更高效。

### 修改配置

**之前（不工作）：**
```yaml
exporters:
  zipkin:
    endpoint: http://jaeger:9411/api/v2/spans
```

**现在（工作）：**
```yaml
exporters:
  otlp/jaeger:
    endpoint: jaeger:4317
    tls:
      insecure: true

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch, attributes]
      exporters: [otlp/jaeger]  # ← 使用 OTLP
```

## 🔄 完整流程

```
应用程序 → Collector (4318) → OTLP gRPC → Jaeger (4317)
```

## 📋 Jaeger 端口说明

| 端口 | 用途 | 协议 |
|------|------|------|
| 16686 | Jaeger UI | HTTP |
| 14268 | Jaeger HTTP Collector | HTTP |
| 14250 | Jaeger gRPC Collector | gRPC |
| 4317 | OTLP gRPC (Jaeger 内部) | gRPC |
| 9411 | Zipkin (默认不启用) | HTTP |

## ✅ 验证

修复后，应该能够：
1. ✅ Collector 成功发送 Traces 到 Jaeger
2. ✅ 在 Jaeger UI 中查询到 Traces
3. ✅ 通过 Trace ID 查看完整的调用链路

## 💡 为什么改用 OTLP？

1. **Jaeger 原生支持 OTLP**
   - Jaeger all-in-one 默认启用 OTLP
   - 使用 gRPC 更高效

2. **统一协议**
   - 所有数据都使用 OTLP
   - 更符合 OpenTelemetry 标准

3. **更稳定**
   - 不依赖 Zipkin 端点
   - 直接使用 Jaeger 的原生支持


