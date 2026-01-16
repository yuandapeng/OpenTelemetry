# 🔧 Grafana 配置 Loki 数据源 - 完整指南

## ❌ 常见错误

如果看到错误："Unable to connect with Loki"，通常是 URL 配置错误。

## ✅ 正确配置步骤

### 1. 进入 Grafana 数据源配置

1. 打开 http://localhost:3003
2. 登录（admin/admin）
3. 点击左侧菜单 **Configuration** (齿轮图标)
4. 选择 **Data sources**
5. 点击 **Add data source**
6. 选择 **Loki**

### 2. 配置 Loki URL（关键！）

**重要：在 Docker Compose 网络中，必须使用服务名，不能使用 localhost！**

#### ✅ 正确配置：
```
URL: http://loki:3100
```

#### ❌ 错误配置：
```
URL: http://localhost:3100  ← 这会失败！
```

### 3. 其他配置

保持默认设置即可：
- **Timeout**: 默认值
- **Alerting**: 可以开启（如果需要告警）
- **Maximum lines**: 1000（默认）

### 4. 保存并测试

1. 滚动到页面底部
2. 点击 **Save & test**
3. 应该看到绿色提示："Data source connected and labels found"

## 🔍 验证连接

### 方法一：在 Grafana 中测试

1. 进入 **Explore** (左侧菜单，指南针图标)
2. 选择 **Loki** 数据源（顶部下拉菜单）
3. 输入查询：`{job="varlogs"}` 或 `{service_name="service-a"}`
4. 点击 **Run query**

### 方法二：检查服务状态

```bash
# 检查 Loki 是否运行
docker ps | grep loki

# 检查 Loki 日志
docker logs loki --tail 20

# 测试 Loki API
curl http://localhost:3100/ready
```

## 📝 查看应用程序日志

### 基本查询

在 Grafana Explore 中：

1. **查看所有日志**：
   ```
   {service_name="service-a"}
   ```

2. **查看特定服务的日志**：
   ```
   {service_name="service-b"}
   ```

3. **通过 traceId 查询**（关联 Traces）：
   ```
   {trace_id="你的traceId"}
   ```

4. **搜索日志内容**：
   ```
   {service_name="service-a"} |= "error"
   ```

### 时间范围

- 在 Explore 页面右上角选择时间范围
- 默认是 "Last 1 hour"
- 可以自定义时间范围

## 🔗 关联 Traces 和 Logs

### 从 Trace 找 Logs

1. 在 **Jaeger UI** (http://localhost:16686) 中找到 Trace
2. 复制 `traceId`（32位十六进制字符串）
3. 在 **Grafana Explore** 中选择 Loki
4. 输入查询：`{trace_id="粘贴你的traceId"}`
5. 查看该 Trace 对应的所有日志

### 从 Logs 找 Trace

1. 在 Grafana 中查看日志
2. 查看日志的标签（Labels），找到 `trace_id`
3. 复制 `trace_id` 的值
4. 在 Jaeger UI 中搜索该 traceId

## 🎨 创建 Dashboard

### 创建日志 Dashboard

1. 点击左侧菜单 **Dashboards**
2. 点击 **New** → **New Dashboard**
3. 点击 **Add visualization**
4. 选择 **Loki** 数据源
5. 输入查询：`{service_name="service-a"}`
6. 选择可视化类型（如：Logs）
7. 保存 Dashboard

### 同时显示 Traces 和 Logs

1. 在同一个 Dashboard 中添加多个 Panel
2. 一个 Panel 使用 Loki 数据源（显示 Logs）
3. 另一个 Panel 使用 Jaeger 数据源（显示 Traces）
4. 通过 traceId 关联两个 Panel

## 🐛 故障排查

### 问题 1: "Unable to connect with Loki"

**原因**：URL 配置错误

**解决**：
1. 检查 URL 是否为 `http://loki:3100`（不是 localhost）
2. 确认 Loki 容器正在运行：`docker ps | grep loki`
3. 确认两个容器在同一网络：`docker network inspect study-opentelemetry_otel-network`

### 问题 2: "No data"

**原因**：没有日志数据或查询条件不正确

**解决**：
1. 确认应用程序正在发送日志到 Collector
2. 检查 Collector 日志：`docker logs otel-collector`
3. 尝试更宽泛的查询：`{}`（查看所有日志）

### 问题 3: 看不到 traceId 标签

**原因**：Collector 没有正确添加关联标签

**解决**：
1. 检查 `collector-config.yaml` 中的 `attributes` processor
2. 确认 `trace.trace_id` 和 `trace.span_id` 已配置
3. 重启 Collector：`docker-compose restart otel-collector`

## 🔍 配置 Jaeger 数据源

### 步骤

1. 在 Grafana 中点击 **Add data source** → 选择 **Jaeger**
2. 配置 URL：
   ```
   URL: http://jaeger:16686
   ```
   **注意**：
   - 使用服务名 `jaeger`，不是 `localhost`
   - 端口是 `16686`（Jaeger UI 和 API 端口）
   - 不需要添加 `/api` 路径
3. **Authentication**: 选择 "No Authentication"
4. 点击 **Save & test**

### 如果仍然报错 "Please enter a valid URL"

尝试以下方法：

**方法 1：检查 URL 格式**
- 确保 URL 是 `http://jaeger:16686`（没有尾部斜杠）
- 确保没有多余的空格

**方法 2：使用 IP 地址**
如果服务名不工作，可以查找 Jaeger 容器的 IP：
```bash
docker inspect jaeger | grep IPAddress
```
然后使用：`http://容器IP:16686`

**方法 3：检查网络连接**
```bash
# 从 Grafana 容器测试连接
docker exec grafana curl -s http://jaeger:16686/api/services
```
应该返回服务列表的 JSON

## 📊 快速参考

| 项目 | 值 |
|------|-----|
| **Grafana URL** | http://localhost:3003 |
| **Grafana 用户名** | admin |
| **Grafana 密码** | admin |
| **Loki URL (在 Grafana 中)** | http://loki:3100 |
| **Loki API (外部访问)** | http://localhost:3100 |
| **Jaeger URL (在 Grafana 中)** | http://jaeger:16686 |
| **Jaeger UI (外部访问)** | http://localhost:16686 |

## 💡 提示

1. **首次配置**：如果 Loki 数据源已存在但连接失败，可以删除后重新添加
2. **查询语法**：Loki 使用 LogQL 查询语言，类似 PromQL
3. **标签过滤**：使用 `{}` 选择器过滤日志，如 `{service_name="service-a", level="error"}`
4. **日志搜索**：使用 `|=` 搜索包含特定文本的日志，如 `|= "error"`

