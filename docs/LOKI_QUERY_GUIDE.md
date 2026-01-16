# 📝 Loki 日志查询指南

## 🎯 快速开始

你现在在 Grafana Explore 中，已经选择了 Loki 数据源。下面是使用方法：

## 📊 基本查询方法

### 方法 1：使用 Builder 模式（可视化，推荐新手）

1. **确保 "Builder" 模式已选中**（不是 "Code" 模式）

2. **添加标签过滤器（Label filters）**：
   - 点击 "Select label" 下拉菜单
   - 选择 `service_name`
   - 选择操作符 `=`
   - 选择值 `service-a` 或 `service-b`
   - 点击 "+" 可以添加更多过滤器

3. **添加文本搜索（Line contains）**（可选）：
   - 在 "Text to find" 输入框中输入要搜索的文本
   - 例如：`error`、`request` 等

4. **运行查询**：
   - 点击右上角的 **运行按钮**（▶️）或按 `Ctrl+Enter`

### 方法 2：使用 Code 模式（直接写查询，更灵活）

1. **切换到 "Code" 模式**：
   - 点击 "Builder" 旁边的 "Code" 按钮

2. **输入 LogQL 查询**：
   ```
   {service_name="service-a"}
   ```

3. **运行查询**：点击运行按钮

## 🔍 常用查询示例

### 1. 查看特定服务的所有日志

```
{service_name="service-a"}
```

### 2. 查看包含特定文本的日志

```
{service_name="service-a"} |= "error"
```

### 3. 查看不包含特定文本的日志

```
{service_name="service-a"} != "debug"
```

### 4. 通过 traceId 查询（关联 Traces）

```
{trace_id="你的traceId"}
```

例如：
```
{trace_id="e88afc31d429306d"}
```

### 5. 组合查询（多个条件）

```
{service_name="service-a", level="error"}
```

### 6. 使用正则表达式

```
{service_name="service-a"} |~ "error|exception"
```

## 🎨 界面操作说明

### 顶部工具栏

- **刷新按钮**（🔄）：手动刷新查询结果
- **时间范围选择器**：选择要查看的时间范围
  - 默认：Last 1 hour
  - 可以自定义时间范围
- **运行按钮**（▶️）：执行查询

### 查询区域

- **Builder 模式**：
  - 可视化界面，适合新手
  - 通过下拉菜单选择标签和值
  
- **Code 模式**：
  - 直接编写 LogQL 查询
  - 更灵活，适合高级用户

### 结果区域

- **日志列表**：显示匹配的日志行
- **时间轴**：显示日志的时间分布
- **展开日志**：点击日志行左侧的箭头查看详细信息

## 🔗 关联 Traces 和 Logs

### 从 Trace 找 Logs

1. **在 Jaeger UI 中找到 Trace**：
   - 访问 http://localhost:16686
   - 找到某个 Trace
   - 复制 `traceId`（32位十六进制字符串）

2. **在 Grafana Loki 中查询**：
   - 在 Code 模式下输入：
     ```
     {trace_id="粘贴你的traceId"}
     ```
   - 或使用 Builder 模式：
     - Label: `trace_id`
     - 操作符: `=`
     - 值: 粘贴 traceId

3. **查看结果**：
   - 会显示该 Trace 对应的所有日志
   - 可以看到请求的完整日志记录

### 从 Logs 找 Trace

1. **在 Loki 中查看日志**
2. **找到日志的标签**：
   - 展开日志行
   - 查看 `trace_id` 标签的值
3. **在 Jaeger UI 中搜索**：
   - 访问 http://localhost:16686
   - 在搜索框中输入 traceId
   - 查看对应的 Trace

## 📝 实际使用场景

### 场景 1：查看 service-a 的所有日志

**Builder 模式**：
1. Label: `service_name` = `service-a`
2. 点击运行

**Code 模式**：
```
{service_name="service-a"}
```

### 场景 2：查找错误日志

**Builder 模式**：
1. Label: `service_name` = `service-a`
2. Line contains: `error`
3. 点击运行

**Code 模式**：
```
{service_name="service-a"} |= "error"
```

### 场景 3：查看特定请求的日志

1. 在前端触发一个请求
2. 在响应中获取 `traceId`（前端会显示）
3. 在 Loki 中查询：
   ```
   {trace_id="你的traceId"}
   ```
4. 查看该请求的完整日志链路

## 💡 提示和技巧

### 1. 使用标签浏览器

- 点击 "Label browser" 按钮
- 查看所有可用的标签
- 了解日志的结构

### 2. 时间范围选择

- **Last 5 minutes**：查看最近的日志
- **Last 1 hour**：查看最近一小时的日志
- **Custom range**：自定义时间范围

### 3. 日志格式

日志通常包含：
- **时间戳**：日志产生的时间
- **级别**：INFO、ERROR、WARN 等
- **消息**：日志内容
- **标签**：service_name、trace_id、span_id 等

### 4. 搜索技巧

- `|= "text"`：包含文本
- `!= "text"`：不包含文本
- `|~ "regex"`：正则表达式匹配
- `| json`：解析 JSON 格式的日志

## 🐛 如果没有看到日志

### 检查步骤

1. **确认服务正在运行**：
   ```bash
   docker ps | grep service-a
   ```

2. **确认有日志产生**：
   - 访问前端：http://localhost:3000
   - 点击按钮触发服务调用
   - 等待几秒钟

3. **检查 Collector 日志**：
   ```bash
   docker logs otel-collector --tail 20
   ```

4. **检查 Loki 是否运行**：
   ```bash
   docker ps | grep loki
   ```

5. **尝试更宽泛的查询**：
   ```
   {}
   ```
   这会显示所有日志（如果有的话）

## 📚 LogQL 查询语言参考

### 基本语法

```
{label="value"} |= "text"
```

- `{}`：标签选择器
- `|=`：包含文本
- `!=`：不包含文本
- `|~`：正则匹配

### 常用操作符

| 操作符 | 说明 | 示例 |
|--------|------|------|
| `=` | 等于 | `{service_name="service-a"}` |
| `!=` | 不等于 | `{level!="debug"}` |
| `=~` | 正则匹配 | `{service_name=~"service-.*"}` |
| `!~` | 正则不匹配 | `{service_name!~"service-.*"}` |
| `\|=` | 包含文本 | `\|= "error"` |
| `\|!` | 不包含文本 | `\|! "debug"` |
| `\|~` | 正则匹配文本 | `\|~ "error\|exception"` |

## 🎯 下一步

1. **尝试基本查询**：`{service_name="service-a"}`
2. **查看日志内容**：了解日志的格式和内容
3. **尝试关联查询**：通过 traceId 关联 Traces 和 Logs
4. **创建 Dashboard**：将常用的查询保存到 Dashboard

祝你使用愉快！🎉

