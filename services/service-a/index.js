// 必须在其他模块之前加载tracing
require('./tracing');

const express = require('express');
const axios = require('axios');
const { trace } = require('@opentelemetry/api');
const logger = require('./logger');


const app = express();
const PORT = 3001;
const SERVICE_B_URL = 'http://localhost:3002';

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
  res.json({ status: 'ok', service: 'service-a' });
});

// 主端点 - 调用服务B
// 完全零侵入：Express和Axios的auto instrumentation会自动追踪
// traceId已通过中间件自动添加到响应头和响应体
app.get('/api/process', async (req, res) => {
  logger.info('开始处理请求', { endpoint: '/api/process' });
  
  try {
    // 模拟一些处理
    await new Promise(resolve => setTimeout(resolve, 100));
    logger.debug('本地处理完成', { duration: '100ms' });
    
    // 调用服务B - Axios的auto instrumentation会自动：
    // 1. 创建span追踪这个HTTP请求
    // 2. 自动注入trace context到请求头
    // 3. 自动记录请求和响应信息
    logger.info('正在调用服务B', { url: `${SERVICE_B_URL}/api/data` });
    const response = await axios.get(`${SERVICE_B_URL}/api/data`);
    
    logger.info('服务B调用成功', {
      status: response.status,
      dataSize: JSON.stringify(response.data).length,
    });
    
    res.json({
      service: 'service-a',
      message: '处理完成',
      data: response.data,
      timestamp: new Date().toISOString()
      // traceId和spanId已由中间件自动添加
    });
  } catch (error) {
    logger.error('处理请求失败', {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      service: 'service-a',
      error: '处理失败',
      message: error.message
    });
  }
});

// 获取用户信息端点
// 完全零侵入：Express和Axios的auto instrumentation会自动追踪
// traceId已通过中间件自动添加到响应头和响应体
app.get('/api/user/:id', async (req, res) => {
  const userId = req.params.id;
  logger.info('获取用户信息', { userId });
  
  try {
    // 模拟数据库查询
    await new Promise(resolve => setTimeout(resolve, 50));
    logger.debug('本地查询完成', { userId, duration: '50ms' });
    
    // 调用服务B - 自动追踪和传播trace context
    logger.info('正在调用服务B获取用户详情', { userId, url: `${SERVICE_B_URL}/api/user/${userId}/details` });
    const response = await axios.get(`${SERVICE_B_URL}/api/user/${userId}/details`);
    
    logger.info('用户信息获取成功', { userId, status: response.status });
    
    res.json({
      service: 'service-a',
      userId: userId,
      userInfo: response.data,
      timestamp: new Date().toISOString()
      // traceId和spanId已由中间件自动添加
    });
  } catch (error) {
    logger.error('获取用户信息失败', {
      userId,
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      service: 'service-a',
      error: '获取用户信息失败',
      userId: userId,
      message: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`服务A运行在 http://localhost:${PORT}`);
  console.log(`健康检查: http://localhost:${PORT}/health`);
  console.log(`API端点: http://localhost:${PORT}/api/process`);
  logger.info('服务A启动成功', { port: PORT });
});

