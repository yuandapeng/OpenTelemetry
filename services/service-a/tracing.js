// 完整的OpenTelemetry配置示例（包含Traces、Logs、Metrics）
// 使用OTLP统一导出到OpenTelemetry Collector，实现三合一配置

const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { Resource } = require('@opentelemetry/resources');
const { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } = require('@opentelemetry/semantic-conventions');

// ========== OTLP统一配置 ==========
// 所有三种数据类型都使用OTLP协议，统一发送到OpenTelemetry Collector
// 需要先安装依赖：
// npm install @opentelemetry/exporter-trace-otlp-http
// npm install @opentelemetry/exporter-metrics-otlp-http
// npm install @opentelemetry/exporter-logs-otlp-http
// npm install @opentelemetry/sdk-metrics

const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-http');
const { OTLPLogExporter } = require('@opentelemetry/exporter-logs-otlp-http');
const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');
const { BatchLogRecordProcessor } = require('@opentelemetry/sdk-logs');

// ========== 统一配置Collector地址 ==========
// 只需要配置一个Collector地址，所有数据都发送到这里
const COLLECTOR_URL = process.env.OTEL_COLLECTOR_URL || 'http://localhost:4318';

// 创建统一的OTLP导出器配置函数
function createOTLPConfig(baseUrl) {
  return {
    // Traces导出器
    traceExporter: new OTLPTraceExporter({
      url: `${baseUrl}/v1/traces`,
    }),
    
    // Metrics导出器（需要包装在PeriodicExportingMetricReader中）
    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({
        url: `${baseUrl}/v1/metrics`,
      }),
      exportIntervalMillis: 10000, // 每10秒导出一次
    }),
    
    // Logs导出器（需要包装在BatchLogRecordProcessor中）
    logRecordProcessor: new BatchLogRecordProcessor(
      new OTLPLogExporter({
        url: `${baseUrl}/v1/logs`,
      })
    ),
  };
}

// ========== 配置OpenTelemetry SDK ==========
// 使用统一配置，所有三种数据类型都发送到同一个Collector
const otlpConfig = createOTLPConfig(COLLECTOR_URL);

const sdk = new NodeSDK({
  // Resource - 定义服务信息
  resource: new Resource({
    [SEMRESATTRS_SERVICE_NAME]: 'service-a',
    [SEMRESATTRS_SERVICE_VERSION]: '1.0.0',
  }),

  // ========== 三合一配置 ==========
  // 所有数据统一发送到OpenTelemetry Collector
  ...otlpConfig,

  // ========== Instrumentations ==========
  instrumentations: [getNodeAutoInstrumentations()],
});

// 启动SDK
sdk.start();

console.log('OpenTelemetry已启动 - Service A');
console.log('  ✅ 三合一配置：所有数据统一发送到 OpenTelemetry Collector');
console.log(`  📍 Collector地址: ${COLLECTOR_URL}`);
console.log('  - Traces:  → /v1/traces');
console.log('  - Metrics: → /v1/metrics');
console.log('  - Logs:    → /v1/logs');
console.log('');
console.log('  💡 Collector会分别转发到：');
console.log('     - Traces  → Jaeger');
console.log('     - Metrics → Prometheus');
console.log('     - Logs    → Loki');
console.log('     - 并自动添加关联Tag（traceId、spanId）');

// 优雅关闭
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('OpenTelemetry已关闭'))
    .catch((error) => console.log('关闭时出错', error))
    .finally(() => process.exit(0));
});

module.exports = sdk;
