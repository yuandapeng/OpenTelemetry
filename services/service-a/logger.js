// OpenTelemetry 日志工具
// 提供统一的日志记录接口，自动关联 traceId 和 spanId

const { logs } = require('@opentelemetry/api-logs');
const { trace } = require('@opentelemetry/api');

// 获取 Logger 实例
const logger = logs.getLogger('service-a', '1.0.0');

/**
 * 记录日志
 * @param {string} severity - 日志级别: 'INFO', 'WARN', 'ERROR', 'DEBUG'
 * @param {string} message - 日志消息
 * @param {object} attributes - 额外的属性
 */
function log(severity, message, attributes = {}) {
  // 获取当前 trace context
  const activeSpan = trace.getActiveSpan();
  const logAttributes = { ...attributes };
  
  if (activeSpan) {
    const spanContext = activeSpan.spanContext();
    // 自动添加 traceId 和 spanId 到日志属性
    logAttributes.trace_id = spanContext.traceId;
    logAttributes.span_id = spanContext.spanId;
  }
  
  logger.emit({
    severityText: severity,
    body: message,
    attributes: logAttributes,
  });
}

// 便捷方法
const loggerUtil = {
  info: (message, attributes) => log('INFO', message, attributes),
  warn: (message, attributes) => log('WARN', message, attributes),
  error: (message, attributes) => log('ERROR', message, attributes),
  debug: (message, attributes) => log('DEBUG', message, attributes),
};

module.exports = loggerUtil;

