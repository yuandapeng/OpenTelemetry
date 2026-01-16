# ✅ 标准 OTLP 日志方案

## 🎯 标准配置

现在使用的是**标准的 OpenTelemetry OTLP/HTTP 协议**，直接发送日志到 Loki，无需 Promtail 转换。

## 📋 架构

```
应用程序 (service-a/service-b)
  ↓ OTLP/HTTP
OpenTelemetry Collector (端口 4318)
  ↓ OTLP/HTTP (标准协议)
Loki (端口 3100/otlp)
  ↓
Grafana (可视化)
```

## 🔧 配置说明

### 1. OpenTelemetry Collector 配置

```yaml
exporters:
  # 标准 OTLP HTTP 导出器
  otlphttp:
    endpoint: http://loki:3100/otlp
    tls:
      insecure: true

service:
  pipelines:
    logs:
      receivers: [otlp]
      processors: [batch, attributes]
      exporters: [otlphttp]  # 直接发送到 Loki
```

### 2. Loki 支持

- **Loki 3.0+** 原生支持 OTLP/HTTP 协议
- 无需额外配置，默认启用
- 自动解析 OpenTelemetry 日志格式

## 🔍 在 Grafana 中查询

### 查询 "服务B调用成功" 日志

1. **打开 Grafana Explore**：
   - 访问 http://localhost:3003
   - 选择 **Loki** 数据源

2. **输入查询**：
   ```
   {service_name="service-a"} |= "服务B调用成功"
   ```

3. **查看结果**：
   - 日志消息会显示在 Logs 面板
   - 点击日志行可以查看详细信息
   - 包括 `trace_id`、`span_id` 等属性

### 通过 traceId 查询完整链路

```
{trace_id="你的traceId"}
```

这会显示该 Trace 的所有日志。

## ✅ 优势

1. **标准协议**：使用 OpenTelemetry 标准 OTLP/HTTP
2. **零转换**：无需 Promtail 或文件转换
3. **自动关联**：日志自动包含 `trace_id` 和 `span_id`
4. **高性能**：直接传输，减少中间环节

## 🎉 完成

现在你的日志系统使用的是**标准的 OpenTelemetry OTLP 方案**！

