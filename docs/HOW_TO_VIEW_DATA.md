# 如何在Jaeger中查看请求/响应数据

## 📍 查看步骤

### 1. 确保服务已重启

**重要：** 修改代码后必须重启服务才能生效！

```bash
# 停止当前服务（Ctrl+C）
# 然后重新启动
cd services/service-a
npm run dev
```

### 2. 在Jaeger UI中查看数据

#### 步骤1：打开Jaeger UI
访问：http://localhost:16686

#### 步骤2：找到你的Trace
- 在搜索页面选择服务（service-a 或 service-b）
- 点击 "Find Traces"
- 选择最新的trace

#### 步骤3：查看Span详情
1. **点击左侧的span**（例如：`service-b GET /api/data`）
2. **在右侧面板中查看**：
   - 点击 **"Tags"** 或 **"Attributes"** 标签页
   - 向下滚动查看所有属性

#### 步骤4：查找数据属性
你应该能看到以下属性：

**请求数据：**
- `http.request.params` - 路径参数（如 `{"id":"123"}`）
- `http.request.query` - 查询参数
- `http.request.body` - 请求体（如果有）

**响应数据：**
- `http.response.body` - 完整响应体
- `response.service` - 服务名称
- `response.userId` - 用户ID（如果有）
- `response.message` - 响应消息（如果有）

## 🔍 示例

当你调用 `/api/user/123` 时，在 `service-a GET /api/user/:id` 这个span中应该能看到：

```
Tags:
  ├── http.request.params: {"id":"123"}
  ├── http.response.body: {"service":"service-a","userId":"123",...}
  ├── response.service: "service-a"
  └── response.userId: "123"
```

## ⚠️ 如果看不到数据

### 检查1：服务是否重启
```bash
# 检查服务是否在运行新代码
# 查看服务日志，应该能看到请求日志
```

### 检查2：是否有数据被记录
在代码中添加日志来验证：

```javascript
// 在中间件中添加
console.log('记录响应数据:', JSON.stringify(data).substring(0, 100));
```

### 检查3：查看正确的Span
- 确保点击的是**处理请求的span**（如 `GET /api/data`）
- 不是中间件span（如 `expressInit`）

### 检查4：数据是否太大被截断
- 如果响应体超过2000字符，会被截断
- 查看是否有 `... (truncated)` 标记

## 💡 提示

1. **Tags vs Logs**：
   - 数据在 **Tags/Attributes** 中，不在 Logs 中
   - 点击span后，查看右侧的 "Tags" 标签页

2. **展开属性**：
   - 有些属性可能需要点击展开才能看到完整内容
   - 特别是JSON格式的属性

3. **搜索属性**：
   - 在Jaeger UI中可以使用搜索框搜索特定的属性名
   - 例如搜索 `http.response.body`

