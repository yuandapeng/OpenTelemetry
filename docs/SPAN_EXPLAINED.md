# Span 详解

## 🎯 Span是什么？

**Span = 一个工作单元（Unit of Work）**

Span代表一个操作或一段代码的执行，记录了：
- 这个操作是什么（名称）
- 什么时候开始和结束（时间）
- 花了多长时间（耗时）
- 是否成功（状态）
- 相关的上下文信息（属性）

## 📊 类比理解

### 类比1：快递包裹追踪

```
快递包裹 = Trace（整个请求）
包裹里的每个节点 = Span（每个操作）

Trace: 从北京到上海的快递
├── Span 1: 北京仓库打包 (10:00-10:05, 5分钟)
├── Span 2: 北京到上海运输 (10:05-14:00, 3小时55分钟)
├── Span 3: 上海分拣中心 (14:00-14:10, 10分钟)
└── Span 4: 派送到用户 (14:10-14:30, 20分钟)
```

### 类比2：做菜的步骤

```
做一道菜 = Trace
每个步骤 = Span

Trace: 做红烧肉
├── Span 1: 准备食材 (5分钟)
├── Span 2: 切肉 (3分钟)
├── Span 3: 炒制 (15分钟)
└── Span 4: 收汁 (5分钟)
```

## 🔍 在你的项目中的实际例子

### 一个完整的请求流程

```
用户请求: GET /api/process
  ↓
Trace: 完整的请求追踪
  ├── Span 1: service-a GET /api/process (主span)
  │   ├── 开始时间: 10:00:00.000
  │   ├── 结束时间: 10:00:00.350
  │   ├── 耗时: 350ms
  │   └── 子操作:
  │       ├── Span 2: 处理业务逻辑 (100ms)
  │       └── Span 3: HTTP GET http://localhost:3002/api/data
  │           ├── 开始时间: 10:00:00.100
  │           ├── 结束时间: 10:00:00.330
  │           ├── 耗时: 230ms
  │           └── 包含:
  │               └── Span 4: service-b GET /api/data
  │                   ├── 开始时间: 10:00:00.150
  │                   ├── 结束时间: 10:00:00.300
  │                   └── 耗时: 150ms
```

## 📝 Span的结构

### Span包含什么信息？

```javascript
{
  // 标识信息
  traceId: "abc123...",      // 属于哪个Trace
  spanId: "def456...",        // 自己的ID
  parentSpanId: "xyz789...", // 父Span的ID（如果有）
  
  // 基本信息
  name: "GET /api/process",   // Span的名称
  kind: "server",             // Span的类型（server/client/internal）
  
  // 时间信息
  startTime: 1234567890,      // 开始时间戳
  endTime: 1234567891,        // 结束时间戳
  duration: 1ms,              // 耗时
  
  // 状态信息
  status: "ok",                // 状态（ok/error）
  
  // 属性信息
  attributes: {
    "http.method": "GET",
    "http.url": "/api/process",
    "http.status_code": 200,
    "service.name": "service-a"
  },
  
  // 事件信息（可选）
  events: [
    {
      name: "处理完成",
      timestamp: 1234567890.5
    }
  ]
}
```

## 🎯 Span的作用

### 1. 记录操作的时间

```
Span告诉你：
- 这个操作什么时候开始
- 什么时候结束
- 花了多长时间

例如：
Span: "调用数据库查询"
开始: 10:00:00.100
结束: 10:00:00.250
耗时: 150ms
```

### 2. 记录操作的上下文

```
Span记录：
- 操作的类型（HTTP请求、数据库查询等）
- 操作的参数（URL、查询语句等）
- 操作的结果（状态码、返回数据等）

例如：
attributes: {
  "http.method": "GET",
  "http.url": "/api/user/123",
  "http.status_code": 200,
  "user.id": "123"
}
```

### 3. 构建调用关系

```
Span的父子关系：
- 父Span包含子Span
- 子Span继承父Span的traceId
- 形成完整的调用树

例如：
Trace (traceId: abc123)
└── Span 1: service-a处理请求 (parent: null)
    └── Span 2: 调用service-b (parent: Span 1)
        └── Span 3: service-b处理请求 (parent: Span 2)
```

### 4. 定位性能问题

```
通过Span的耗时，可以快速定位：
- 哪个操作最慢
- 哪个服务是瓶颈
- 整个请求的耗时分布

例如：
总耗时: 500ms
├── service-a处理: 100ms (20%)
├── 网络传输: 50ms (10%)
└── service-b处理: 350ms (70%) ← 瓶颈在这里！
```

## 🔄 Span的生命周期

### 自动创建的Span（Auto Instrumentation）

```javascript
// 你的代码
app.get('/api/process', async (req, res) => {
  const response = await axios.get('http://localhost:3002/api/data');
  res.json(response.data);
});

// OpenTelemetry自动创建Span：
// 1. Express自动创建: "GET /api/process"
// 2. Axios自动创建: "HTTP GET http://localhost:3002/api/data"
// 3. 服务B的Express自动创建: "GET /api/data"
```

### Span的创建和结束

```
1. 请求到达 → 创建Span
   span.start()
   
2. 处理请求 → Span记录信息
   span.setAttribute('http.method', 'GET')
   span.setAttribute('http.url', '/api/process')
   
3. 请求完成 → 结束Span
   span.end()
   
4. Span发送到Jaeger
   → 在Jaeger UI中可以看到
```

## 📊 在Jaeger UI中看到的Span

### Span的层级结构

```
Trace视图：
┌─────────────────────────────────────────┐
│ Trace: abc123 (总耗时: 350ms)           │
├─────────────────────────────────────────┤
│ service-a GET /api/process (350ms)     │ ← Span 1
│   ├─ 处理业务逻辑 (100ms)               │ ← Span 2 (子span)
│   └─ HTTP GET service-b (230ms)        │ ← Span 3 (子span)
│       └─ service-b GET /api/data (150ms)│ ← Span 4 (子span)
└─────────────────────────────────────────┘
```

### 点击Span查看详情

```
Span详情：
┌─────────────────────────────────────────┐
│ Span: GET /api/process                  │
├─────────────────────────────────────────┤
│ 基本信息:                                │
│   - Trace ID: abc123                    │
│   - Span ID: def456                     │
│   - 耗时: 350ms                         │
│   - 状态: OK                            │
├─────────────────────────────────────────┤
│ 属性 (Attributes):                      │
│   - http.method: GET                    │
│   - http.url: /api/process             │
│   - http.status_code: 200              │
│   - service.name: service-a             │
│   - http.response.body: {...}          │
└─────────────────────────────────────────┘
```

## 💡 实际应用场景

### 场景1：性能分析

```
问题：API响应很慢

通过Span分析：
├── service-a处理: 50ms (正常)
├── 网络传输: 20ms (正常)
└── service-b处理: 2000ms (太慢了！) ← 找到问题

结论：service-b是瓶颈，需要优化
```

### 场景2：错误追踪

```
问题：请求失败

通过Span分析：
├── service-a处理: OK
├── 调用service-b: ERROR
│   └── 错误信息: "Connection timeout"
└── service-b: 未执行

结论：service-b连接超时
```

### 场景3：调用链分析

```
问题：请求经过了哪些服务？

通过Span分析：
Trace: abc123
├── service-a (入口)
├── service-b (被调用)
├── service-c (被service-b调用)
└── database (被service-c调用)

结论：完整的调用链一目了然
```

## 🎯 总结

### Span的核心作用

1. **记录时间**：操作什么时候开始、结束、耗时
2. **记录上下文**：操作的参数、结果、状态
3. **构建关系**：父子关系形成调用树
4. **性能分析**：找出慢操作和瓶颈
5. **错误追踪**：定位错误发生在哪里

### 简单理解

```
Span = 一个操作的"快照"
- 什么时候做的（时间）
- 做了什么（名称）
- 花了多久（耗时）
- 结果如何（状态）
- 相关的信息（属性）

多个Span组成一个Trace（完整的请求追踪）
```

### 在你的项目中

```
一个API请求 = 一个Trace
  ├── Span 1: Express处理请求
  ├── Span 2: 业务逻辑处理
  ├── Span 3: HTTP调用其他服务
  └── Span 4: 其他服务处理请求

每个Span都记录了详细的信息，帮助分析和调试
```

