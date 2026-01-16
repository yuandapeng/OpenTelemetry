# 自动埋点 vs 手动埋点

## 🎯 重要理解

**OpenTelemetry支持两种方式：自动埋点和手动埋点**

你的项目目前使用的是**自动埋点**，不需要手动写任何Span代码！

## 🔄 两种方式对比

### 方式1：自动埋点（Auto Instrumentation）✅ 你当前使用的

#### 特点
- ✅ **零侵入**：不需要修改业务代码
- ✅ **自动创建Span**：OpenTelemetry自动为常见操作创建Span
- ✅ **自动上报**：数据自动发送到Jaeger
- ✅ **开箱即用**：配置一次，自动工作

#### 你的项目配置

```javascript
// tracing.js
const sdk = new NodeSDK({
  // 自动instrumentation - 自动埋点
  instrumentations: [getNodeAutoInstrumentations()],
  // ↑ 这一行就实现了自动埋点！
});
```

#### 自动埋点的代码

```javascript
// index.js - 你的业务代码
app.get('/api/process', async (req, res) => {
  // ✅ 不需要手动创建Span
  // ✅ OpenTelemetry自动创建Span追踪这段代码
  
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const response = await axios.get(`${SERVICE_B_URL}/api/data`);
  // ✅ 自动创建Span追踪这个HTTP请求
  
  res.json(response.data);
  // ✅ Span自动结束并上报
});
```

**自动创建的Span**：
```
✅ Span 1: "GET /api/process" (Express自动创建)
✅ Span 2: "HTTP GET http://localhost:3002/api/data" (Axios自动创建)
✅ Span 3: "GET /api/data" (service-b的Express自动创建)
```

### 方式2：手动埋点（Manual Instrumentation）

#### 特点
- ⚠️ **需要修改代码**：需要在业务代码中添加Span代码
- ⚠️ **更灵活**：可以精确控制追踪哪些代码
- ⚠️ **更复杂**：需要手动管理Span的生命周期

#### 手动埋点的代码

```javascript
// 需要手动创建Span
app.get('/api/process', async (req, res) => {
  // ❌ 需要手动创建Span
  const tracer = trace.getTracer('my-tracer');
  const span = tracer.startSpan('处理请求');
  
  try {
    span.setAttribute('operation', 'process');
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // ❌ 需要手动创建子Span
    const childSpan = tracer.startSpan('调用服务B', {
      parent: span,
    });
    
    const response = await axios.get(`${SERVICE_B_URL}/api/data`);
    
    childSpan.end(); // ❌ 需要手动结束
    span.end(); // ❌ 需要手动结束
    res.json(response.data);
  } catch (error) {
    span.recordException(error);
    span.end(); // ❌ 需要手动处理错误
    throw error;
  }
});
```

## 📊 对比总结

| 方面 | 自动埋点（你当前使用） | 手动埋点 |
|------|---------------------|---------|
| **代码侵入性** | ✅ 零侵入 | ❌ 需要修改代码 |
| **配置复杂度** | ✅ 简单（一行配置） | ❌ 复杂（每个地方都要写） |
| **维护成本** | ✅ 低 | ❌ 高 |
| **灵活性** | ⚠️ 有限（只能追踪常见操作） | ✅ 高（可以追踪任何代码） |
| **适用场景** | ✅ 大多数场景 | ⚠️ 特殊需求 |

## 🔍 你的项目：完全自动埋点

### 当前实现（零侵入）

```javascript
// tracing.js - 只需要配置一次
instrumentations: [getNodeAutoInstrumentations()],
// ↑ 这一行就实现了所有自动埋点！

// index.js - 业务代码，完全不需要Span代码
app.get('/api/process', async (req, res) => {
  // 纯业务逻辑，没有任何Span代码
  await new Promise(resolve => setTimeout(resolve, 100));
  const response = await axios.get(`${SERVICE_B_URL}/api/data`);
  res.json(response.data);
});
```

### 自动埋点覆盖的操作

`getNodeAutoInstrumentations()` 自动为以下操作创建Span：

```
✅ HTTP/HTTPS请求
✅ Express路由
✅ Axios HTTP请求
✅ 文件系统操作
✅ DNS查询
✅ 等等...
```

## 💡 什么时候需要手动埋点？

### 场景1：追踪自定义业务逻辑

```javascript
// 如果自动埋点无法覆盖，需要手动创建
app.get('/api/process', async (req, res) => {
  const span = tracer.startSpan('复杂业务计算');
  
  // 复杂的业务逻辑
  const result = complexCalculation();
  
  span.end();
  res.json(result);
});
```

### 场景2：追踪第三方库（没有自动支持）

```javascript
// 如果第三方库没有自动instrumentation
const span = tracer.startSpan('调用第三方API');
const result = await thirdPartyLibrary.call();
span.end();
```

### 场景3：添加自定义属性

```javascript
// 虽然可以自动埋点，但需要添加自定义属性
app.get('/api/process', async (req, res) => {
  const activeSpan = trace.getActiveSpan(); // 获取自动创建的Span
  if (activeSpan) {
    activeSpan.setAttribute('business.order.id', orderId);
  }
  // ... 业务逻辑
});
```

## 🎯 你的项目总结

### 当前状态：完全自动埋点 ✅

```
✅ 不需要手动创建Span
✅ 不需要手动结束Span
✅ 不需要手动处理错误
✅ 业务代码完全零侵入
✅ 所有常见操作自动追踪
```

### 如果需要添加自定义属性

```javascript
// 只需要获取自动创建的Span，添加属性
const activeSpan = trace.getActiveSpan();
if (activeSpan) {
  activeSpan.setAttribute('custom.attribute', value);
}
// 不需要手动创建Span！
```

## 📝 总结

### 你的理解需要修正

❌ **错误理解**：Span只能手动埋点
✅ **正确理解**：OpenTelemetry支持自动埋点，你的项目就是自动埋点

### 关键点

1. **自动埋点**：配置一次，自动工作（你当前使用）
2. **手动埋点**：需要时才使用（特殊场景）
3. **混合使用**：可以同时使用（自动埋点 + 手动添加属性）

### 你的项目

```
✅ 使用自动埋点（零侵入）
✅ 业务代码不需要任何Span代码
✅ 所有常见操作自动追踪
✅ 只需要在中间件中添加自定义属性（可选）
```

**结论**：你的项目是**自动埋点**，不需要手动埋点！

