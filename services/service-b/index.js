// 必须在其他模块之前加载tracing
require('./tracing');

const express = require('express');
const { trace } = require('@opentelemetry/api');
const logger = require('./logger');

const app = express();
const PORT = 3002;

// 添加CORS支持
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, traceparent, tracestate');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());

// 中间件：统一处理traceId，并记录请求/响应数据到span
app.use((req, res, next) => {
  // 获取当前span
  const activeSpan = trace.getActiveSpan();
  
  if (activeSpan) {
    const spanContext = activeSpan.spanContext();
    const traceId = spanContext.traceId;
    const spanId = spanContext.spanId;
    
    // 检查traceId是否有效（不是全0）
    if (traceId && traceId !== '00000000000000000000000000000000') {
      // 将traceId添加到响应头
      res.setHeader('X-Trace-Id', traceId);
      res.setHeader('X-Span-Id', spanId);
      
      // 将traceId保存到res.locals，方便在路由处理函数中使用（如果需要）
      res.locals.traceId = traceId;
      res.locals.spanId = spanId;
    }
    
    // 记录请求开始日志
    logger.info('收到请求', {
      method: req.method,
      path: req.path,
      url: req.url,
      ip: req.ip,
    });
    
    // 记录请求数据到span attributes
    // 记录请求参数
    if (Object.keys(req.query).length > 0) {
      activeSpan.setAttribute('http.request.query', JSON.stringify(req.query));
    }
    
    // 记录路径参数
    if (Object.keys(req.params).length > 0) {
      activeSpan.setAttribute('http.request.params', JSON.stringify(req.params));
    }
    
    // 记录请求体（如果有，且不是太大）
    if (req.body && Object.keys(req.body).length > 0) {
      const bodyStr = JSON.stringify(req.body);
      // 限制大小，避免记录过大的数据
      if (bodyStr.length < 1000) {
        activeSpan.setAttribute('http.request.body', bodyStr);
      } else {
        activeSpan.setAttribute('http.request.body', bodyStr.substring(0, 1000) + '... (truncated)');
      }
    }
    
    // 拦截响应，记录响应数据
    const originalJson = res.json.bind(res);
    res.json = function(data) {
      // 记录响应数据到span attributes
      if (data && typeof data === 'object') {
        const responseStr = JSON.stringify(data);
        // 限制大小，避免记录过大的数据
        if (responseStr.length < 2000) {
          activeSpan.setAttribute('http.response.body', responseStr);
        } else {
          activeSpan.setAttribute('http.response.body', responseStr.substring(0, 2000) + '... (truncated)');
        }
        
        // 记录响应中的关键字段（如果有）
        if (data.service) {
          activeSpan.setAttribute('response.service', data.service);
        }
        if (data.userId) {
          activeSpan.setAttribute('response.userId', data.userId);
        }
        if (data.message) {
          activeSpan.setAttribute('response.message', data.message);
        }
        
        // 记录响应日志
        logger.info('响应已发送', {
          statusCode: res.statusCode,
          responseSize: responseStr.length,
        });
      }
      
      return originalJson(data);
    };
  }
  
  next();
});

// 健康检查端点
app.get('/health', (req, res) => {
  logger.info('健康检查请求');
  res.json({ status: 'ok', service: 'service-b' });
});

// 数据端点 - 被服务A调用
// 完全零侵入：Express的auto instrumentation会自动追踪
// 无需任何追踪代码，纯业务逻辑
app.get('/api/data', async (req, res) => {
  logger.info('开始处理数据请求', { endpoint: '/api/data' });
  
  try {
    // 模拟数据库查询
    logger.debug('模拟数据库查询', { duration: '150ms' });
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // 模拟一些业务逻辑
    logger.debug('执行业务逻辑', { duration: '80ms' });
    await new Promise(resolve => setTimeout(resolve, 80));
    
    const data = {
      items: [
        { id: 1, name: '项目1', value: 100 },
        { id: 2, name: '项目2', value: 200 },
        { id: 3, name: '项目3', value: 300 }
      ],
      total: 600,
      processedAt: new Date().toISOString()
    };
    
    logger.info('数据查询成功', { itemCount: data.items.length, total: data.total });
    
    res.json({
      service: 'service-b',
      data: data
    });
  } catch (error) {
    logger.error('数据查询失败', {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      service: 'service-b',
      error: '数据查询失败',
      message: error.message
    });
  }
});

// 用户详情端点
// 完全零侵入：Express的auto instrumentation会自动追踪
// 无需任何追踪代码，纯业务逻辑
app.get('/api/user/:id/details', async (req, res) => {
  const userId = req.params.id;
  logger.info('获取用户详情', { userId });
  
  try {
    // 模拟数据库查询
    logger.debug('模拟数据库查询用户信息', { userId, duration: '100ms' });
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 模拟获取用户详细信息
    const userDetails = {
      id: userId,
      name: `用户${userId}`,
      email: `user${userId}@example.com`,
      role: 'member',
      createdAt: new Date().toISOString()
    };
    
    logger.info('用户详情查询成功', { userId, email: userDetails.email });
    
    res.json({
      service: 'service-b',
      userDetails: userDetails
    });
  } catch (error) {
    logger.error('获取用户详情失败', {
      userId,
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      service: 'service-b',
      error: '获取用户详情失败',
      userId: userId,
      message: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`服务B运行在 http://localhost:${PORT}`);
  console.log(`健康检查: http://localhost:${PORT}/health`);
  console.log(`API端点: http://localhost:${PORT}/api/data`);
  logger.info('服务B启动成功', { port: PORT });
});

