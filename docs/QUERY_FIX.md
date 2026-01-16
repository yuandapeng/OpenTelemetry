# 🔍 在 Grafana 中查询 "服务B调用成功" 日志

## 问题

你在 Grafana 中查询 `{service_name="service-a"} |= "服务B调用成功"` 但没有结果。

## 原因

OpenTelemetry 的日志是 JSON 格式，消息在嵌套的 JSON 结构中，Promtail 需要正确解析才能提取。

## 解决方案

### 方案 1：使用 JSON 解析查询（推荐）

在 Grafana 中，使用 LogQL 的 JSON 解析功能：

```
{job="otel-collector"} | json | log_message =~ ".*服务B调用成功.*"
```

或者更简单：

```
{job="otel-collector"} | json | log_message |= "服务B调用成功"
```

### 方案 2：直接搜索 JSON 内容

```
{job="otel-collector"} |= "服务B调用成功"
```

这会搜索整个 JSON 字符串，应该能找到。

### 方案 3：使用 traceId 查询

1. 在 Jaeger UI 中找到 Trace，复制 `traceId`
2. 在 Grafana 中查询：
   ```
   {job="otel-collector"} |= "你的traceId"
   ```
3. 这会显示该 Trace 的所有日志

## 在 Grafana 中的操作步骤

1. **打开 Grafana Explore**：
   - 访问 http://localhost:3003
   - 点击左侧菜单 **Explore**
   - 选择 **Loki** 数据源

2. **切换到 Code 模式**：
   - 点击 "Builder" 旁边的 "Code" 按钮

3. **输入查询**（尝试以下任一）：
   ```
   {job="otel-collector"} |= "服务B调用成功"
   ```
   或
   ```
   {job="otel-collector"} | json | log_message |= "服务B调用成功"
   ```

4. **选择时间范围**：Last 5 minutes

5. **运行查询**：点击运行按钮

## 如果还是看不到

1. **确认服务已重启**：修改代码后需要重启服务
2. **触发请求**：确保已经调用了 `/api/process` 端点
3. **检查时间范围**：选择更长时间范围（如 Last 1 hour）
4. **查看所有日志**：
   ```
   {job="otel-collector"}
   ```
   看看是否有任何日志

