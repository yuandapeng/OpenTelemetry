# 🔍 如何查看特定日志 - "服务B调用成功"

## 📝 场景

当你触发 `service-a` 的 `/api/process` 端点时，会记录 "服务B调用成功" 这条日志。下面是如何在 Grafana 中查看它。

## 🎯 在 Grafana 中查看

### 方法 1：使用 Builder 模式（可视化）

1. **打开 Grafana Explore**：
   - 访问 http://localhost:3003
   - 点击左侧菜单 **Explore** (指南针图标)
   - 选择 **Loki** 数据源

2. **添加标签过滤器**：
   - 确保 "Builder" 模式已选中
   - 在 "Label filters" 区域：
     - Label: `service_name` = `service-a`
   - 在 "Line contains" 区域：
     - Text to find: `服务B调用成功`

3. **运行查询**：
   - 点击右上角的运行按钮（▶️）

### 方法 2：使用 Code 模式（直接写查询）

1. **切换到 Code 模式**：
   - 点击 "Builder" 旁边的 "Code" 按钮

2. **输入查询**：
   ```
   {service_name="service-a"} |= "服务B调用成功"
   ```

3. **运行查询**：点击运行按钮

## 🔍 查询示例

### 1. 查看所有 "服务B调用成功" 的日志

```
{service_name="service-a"} |= "服务B调用成功"
```

### 2. 查看包含特定状态的日志

```
{service_name="service-a"} |= "服务B调用成功" | json | status = 200
```

### 3. 通过 traceId 查看完整请求链路的所有日志

1. 在 Jaeger UI 中找到 Trace，复制 `traceId`
2. 在 Grafana 中查询：
   ```
   {trace_id="你的traceId"}
   ```
3. 这会显示该请求的所有日志，包括：
   - "收到请求"
   - "开始处理请求"
   - "正在调用服务B"
   - **"服务B调用成功"** ← 你要找的这条
   - "响应已发送"

## 📊 查看日志详情

在 Grafana 中查看日志时：

1. **点击日志行左侧的箭头**，展开查看详细信息
2. **你会看到**：
   - **时间戳**：日志记录的时间
   - **日志级别**：INFO
   - **消息内容**：服务B调用成功
   - **属性（Attributes）**：
     - `status`: 200（HTTP 状态码）
     - `dataSize`: 197（响应数据大小）
     - `trace_id`: 关联的 traceId
     - `span_id`: 关联的 spanId

## 🎯 完整查询流程

### 步骤 1：触发请求

```bash
# 触发 service-a 的 /api/process 端点
curl http://localhost:3001/api/process
```

或者在前端页面点击按钮。

### 步骤 2：在 Grafana 中查询

1. 打开 Grafana：http://localhost:3003
2. 进入 Explore
3. 选择 Loki 数据源
4. 切换到 Code 模式
5. 输入查询：
   ```
   {service_name="service-a"} |= "服务B调用成功"
   ```
6. 选择时间范围：Last 5 minutes
7. 点击运行

### 步骤 3：查看结果

你应该能看到：
- 日志消息："服务B调用成功"
- 属性：status=200, dataSize=197
- traceId 和 spanId（用于关联 Traces）

## 🔗 关联查看

### 从日志找 Trace

1. 在日志详情中找到 `trace_id` 属性
2. 复制 traceId
3. 在 Jaeger UI (http://localhost:16686) 中搜索
4. 查看完整的调用链路

### 从 Trace 找日志

1. 在 Jaeger UI 中找到 Trace
2. 复制 traceId
3. 在 Grafana 中查询：
   ```
   {trace_id="你的traceId"}
   ```
4. 查看该 Trace 的所有日志

## 💡 提示

- **时间范围**：确保选择正确的时间范围（Last 5 minutes 或更长时间）
- **刷新**：如果看不到日志，点击刷新按钮
- **等待**：日志可能需要几秒钟才能到达 Loki

## 🐛 如果看不到日志

1. **确认服务已重启**：修改代码后需要重启服务
2. **触发请求**：确保已经调用了 `/api/process` 端点
3. **检查时间范围**：选择更长时间范围（如 Last 1 hour）
4. **尝试更宽泛的查询**：
   ```
   {service_name="service-a"}
   ```
   查看 service-a 的所有日志

