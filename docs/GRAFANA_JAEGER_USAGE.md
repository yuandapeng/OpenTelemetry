# 🔍 Grafana 中使用 Jaeger 数据源 - 正确方法

## ❌ 问题：400 Bad Request

在 Grafana Explore 中使用 Jaeger 数据源时，如果看到 400 错误，通常是因为查询格式不正确。

## ✅ 正确使用方法

### 方法 1：在 Explore 中查看 Traces（推荐）

Grafana 的 Jaeger 数据源在 Explore 中的使用方式与 Loki 不同：

1. **进入 Explore**：
   - 点击左侧菜单 **Explore** (指南针图标)
   - 选择 **Jaeger** 数据源

2. **查询方式**：
   - **不要直接输入 traceId**
   - 使用下拉菜单选择服务：
     - 在查询框中，点击下拉箭头
     - 选择服务名（如：`service-a`）
   - 或者使用搜索框搜索服务

3. **查看 Trace 列表**：
   - 选择服务后，会自动显示该服务的所有 Traces
   - 点击某个 Trace 查看详情

### 方法 2：使用 Jaeger UI（更简单）

如果 Grafana 的 Jaeger 数据源有问题，可以直接使用 Jaeger UI：

1. **访问 Jaeger UI**：
   - 地址：http://localhost:16686

2. **查看 Traces**：
   - 选择服务：`service-a` 或 `service-b`
   - 点击 "Find Traces"
   - 查看完整的调用链路

### 方法 3：在 Dashboard 中使用 Jaeger

1. **创建 Dashboard**：
   - 点击 **Dashboards** → **New** → **New Dashboard**

2. **添加 Panel**：
   - 点击 **Add visualization**
   - 选择 **Jaeger** 数据源
   - 配置查询（选择服务名）

## 🔧 故障排查

### 问题：400 Bad Request

**原因**：查询格式不正确或缺少必要参数

**解决**：
1. **不要直接输入 traceId**：Grafana 的 Jaeger 数据源不支持直接输入 traceId 查询
2. **使用服务选择器**：通过下拉菜单选择服务
3. **检查数据源配置**：确保 URL 正确（`http://jaeger:16686`）

### 问题：没有数据

**原因**：可能没有 Traces 数据

**解决**：
1. **触发服务调用**：
   - 访问前端：http://localhost:3000
   - 点击按钮触发服务调用
   - 等待几秒钟让数据到达 Jaeger

2. **检查 Jaeger UI**：
   - 直接访问 http://localhost:16686
   - 确认是否有 Traces 数据

3. **检查 Collector**：
   ```bash
   docker logs otel-collector --tail 20
   ```
   查看是否有错误

## 💡 最佳实践

### 推荐工作流

1. **查看 Traces**：使用 Jaeger UI (http://localhost:16686)
   - 更直观
   - 功能更完整
   - 支持 traceId 直接搜索

2. **查看 Logs**：使用 Grafana Explore + Loki
   - 强大的日志搜索
   - 支持 LogQL 查询
   - 可以通过 traceId 关联

3. **关联查询**：
   - 在 Jaeger 中找到 Trace，复制 traceId
   - 在 Grafana Loki 中查询：`{trace_id="你的traceId"}`

## 📊 数据源对比

| 功能 | Jaeger UI | Grafana Jaeger 数据源 |
|------|-----------|---------------------|
| 查看 Traces | ✅ 优秀 | ⚠️ 有限 |
| 搜索 traceId | ✅ 支持 | ❌ 不支持 |
| 服务选择 | ✅ 支持 | ✅ 支持 |
| 调用链路可视化 | ✅ 优秀 | ⚠️ 基础 |
| 与 Logs 关联 | ❌ 不支持 | ✅ 可在同一界面 |

## 🎯 建议

**对于 Traces**：
- ✅ **优先使用 Jaeger UI**：http://localhost:16686
- ⚠️ Grafana 的 Jaeger 数据源主要用于 Dashboard 集成

**对于 Logs**：
- ✅ **使用 Grafana + Loki**：功能强大，查询灵活

**统一查看**：
- 在 Grafana 中创建 Dashboard，同时显示：
  - Traces（通过 Jaeger 数据源，如果配置成功）
  - Logs（通过 Loki 数据源）

## 🔗 快速链接

- **Jaeger UI**: http://localhost:16686
- **Grafana**: http://localhost:3003
- **前端应用**: http://localhost:3000

