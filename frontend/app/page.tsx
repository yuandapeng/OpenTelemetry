'use client';

import { useState } from 'react';
import axios from 'axios';

interface TraceInfo {
  traceId?: string;
  spanId?: string;
  service?: string;
  fullTraceId?: string; // 完整的traceId用于Jaeger链接
}

// 格式化TraceId用于显示（32位十六进制，显示前16位）
function formatTraceIdForDisplay(traceId: string): string {
  if (!traceId || traceId === '未获取到') return traceId;
  // OpenTelemetry的traceId是32位十六进制，显示时通常只显示前16位
  if (traceId.length === 32) {
    return traceId.substring(0, 16);
  }
  return traceId;
}

// 获取完整的TraceId用于Jaeger链接
function getFullTraceId(traceId: string): string {
  if (!traceId || traceId === '未获取到') return '';
  // 如果只有16位，需要补全到32位（Jaeger需要完整格式）
  // 但实际上OpenTelemetry返回的应该是32位
  return traceId;
}

// 格式化SpanId（16位十六进制）
function formatSpanId(spanId: string): string {
  if (!spanId || spanId === '未获取到') return spanId;
  // OpenTelemetry的spanId是16位十六进制
  if (spanId.length === 16) {
    return spanId;
  }
  return spanId;
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [traceInfo, setTraceInfo] = useState<TraceInfo | null>(null);

  const callServiceA = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    setTraceInfo(null);

    try {
      // 使用Next.js rewrites路径，避免CORS问题
      const response = await axios.get('/api/service-a/api/process');
      setResponse(response.data);
      
      // 从响应头或响应体中提取trace信息
      const traceId = response.headers['x-trace-id'] || response.data?.traceId || '未获取到';
      const spanId = response.headers['x-span-id'] || response.data?.spanId || '未获取到';
      
      setTraceInfo({
        traceId: traceId ? formatTraceIdForDisplay(traceId) : '未获取到',
        spanId: spanId ? formatSpanId(spanId) : '未获取到',
        service: 'service-a -> service-b',
        fullTraceId: traceId || '' // 保存完整的traceId用于Jaeger链接
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || '请求失败';
      setError(errorMessage);
      setResponse(err.response?.data || null);
    } finally {
      setLoading(false);
    }
  };

  const callUserEndpoint = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    setTraceInfo(null);

    try {
      const userId = Math.floor(Math.random() * 100) + 1;
      // 使用Next.js rewrites路径
      const response = await axios.get(`/api/service-a/api/user/${userId}`);
      setResponse(response.data);
      
      const traceId = response.headers['x-trace-id'] || response.data?.traceId || '未获取到';
      const spanId = response.headers['x-span-id'] || response.data?.spanId || '未获取到';
      
      setTraceInfo({
        traceId: traceId ? formatTraceIdForDisplay(traceId) : '未获取到',
        spanId: spanId ? formatSpanId(spanId) : '未获取到',
        service: 'service-a -> service-b (用户详情)',
        fullTraceId: traceId || '' // 保存完整的traceId用于Jaeger链接
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || '请求失败';
      setError(errorMessage);
      setResponse(err.response?.data || null);
    } finally {
      setLoading(false);
    }
  };

  const checkHealth = async (service: 'a' | 'b') => {
    setLoading(true);
    setError(null);
    setResponse(null);
    setTraceInfo(null);

    try {
      // 使用Next.js rewrites路径
      const servicePath = service === 'a' ? 'service-a' : 'service-b';
      const response = await axios.get(`/api/${servicePath}/health`);
      setResponse(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || '请求失败';
      setError(errorMessage);
      setResponse(err.response?.data || null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container">
      <div className="card">
        <h1>🔍 OpenTelemetry 分布式追踪演示</h1>
        <p style={{ color: '#666', marginTop: '0.5rem' }}>
          这个演示展示了两个服务之间的调用以及自动的trace传播。
          所有的trace数据会被发送到Jaeger进行可视化。
        </p>
      </div>

      <div className="card">
        <h2>服务调用</h2>
        <div>
          <button
            className="button"
            onClick={callServiceA}
            disabled={loading}
          >
            {loading ? '调用中...' : '调用服务A → 服务B'}
          </button>
          
          <button
            className="button"
            onClick={callUserEndpoint}
            disabled={loading}
          >
            {loading ? '调用中...' : '获取用户信息'}
          </button>
          
          <button
            className="button"
            onClick={() => checkHealth('a')}
            disabled={loading}
          >
            检查服务A健康状态
          </button>
          
          <button
            className="button"
            onClick={() => checkHealth('b')}
            disabled={loading}
          >
            检查服务B健康状态
          </button>
        </div>

        {loading && (
          <div style={{ marginTop: '1rem', color: '#666' }}>
            <span className="loading"></span>
            正在处理请求...
          </div>
        )}

        {traceInfo && (
          <div className="trace-info">
            <h3>📊 Trace 信息</h3>
            <p><strong>服务调用链:</strong> {traceInfo.service}</p>
            <p>
              <strong>Trace ID:</strong> {traceInfo.traceId}
              {traceInfo.fullTraceId && traceInfo.fullTraceId !== '未获取到' && (
                <>
                  <a
                    href={`http://localhost:16686/trace/${traceInfo.fullTraceId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      marginLeft: '0.5rem',
                      color: '#667eea',
                      textDecoration: 'none',
                      fontSize: '0.9rem'
                    }}
                  >
                    🔗 在Jaeger中查看
                  </a>
                  <a
                    href="http://localhost:16686/search"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      marginLeft: '0.5rem',
                      color: '#667eea',
                      textDecoration: 'none',
                      fontSize: '0.85rem'
                    }}
                  >
                    (或前往搜索页面)
                  </a>
                </>
              )}
            </p>
            <p><strong>Span ID:</strong> {traceInfo.spanId}</p>
            <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#888' }}>
              💡 Trace ID会在服务间自动传播。如果直接链接找不到trace，请等待2-3秒后重试，或使用搜索页面查找。
            </p>
          </div>
        )}

        {error && (
          <div className="response" style={{ background: '#fee', border: '1px solid #fcc' }}>
            <strong style={{ color: '#c00' }}>错误:</strong> {error}
            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#888' }}>
              💡 提示: 请确保服务A和服务B都已启动。如果服务未运行，请先启动它们。
            </div>
          </div>
        )}

        {response && (
          <div className="response">
            <strong>响应数据:</strong>
            <pre style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div className="card">
        <h2>📈 可视化追踪</h2>
        <p style={{ color: '#666', marginBottom: '1rem' }}>
          要查看完整的分布式追踪可视化，请访问：
        </p>
        <div>
          <a
            href="http://localhost:16686"
            target="_blank"
            rel="noopener noreferrer"
            className="link"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            🚀 打开 Jaeger UI
          </a>
        </div>
        
        <div style={{ 
          marginTop: '1.5rem', 
          padding: '1rem', 
          background: '#fff3cd', 
          borderRadius: '8px',
          border: '1px solid #ffc107'
        }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#856404' }}>
            ⚠️ 如果Jaeger UI无法打开：
          </h3>
          <ol style={{ color: '#856404', paddingLeft: '1.5rem', fontSize: '0.9rem', lineHeight: '1.6' }}>
            <li>确保Docker已安装并运行</li>
            <li>在项目根目录运行: <code style={{ background: '#fff', padding: '2px 6px', borderRadius: '4px' }}>./start-jaeger.sh</code></li>
            <li>或运行: <code style={{ background: '#fff', padding: '2px 6px', borderRadius: '4px' }}>docker-compose up -d</code></li>
            <li>检查状态: <code style={{ background: '#fff', padding: '2px 6px', borderRadius: '4px' }}>./check-jaeger.sh</code></li>
            <li>查看日志: <code style={{ background: '#fff', padding: '2px 6px', borderRadius: '4px' }}>docker logs jaeger</code></li>
          </ol>
        </div>
        
        <p style={{ color: '#888', marginTop: '1rem', fontSize: '0.9rem' }}>
          在Jaeger UI中，你可以：
        </p>
        <ul style={{ color: '#666', marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
          <li>查看完整的服务调用链</li>
          <li>分析每个span的耗时</li>
          <li>查看trace的详细信息</li>
          <li>搜索和过滤trace</li>
        </ul>
      </div>

      <div className="card">
        <h2>🔧 技术栈</h2>
        <div className="grid">
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>后端服务</h3>
            <ul style={{ color: '#666', paddingLeft: '1.5rem' }}>
              <li>Node.js + Express</li>
              <li>OpenTelemetry SDK</li>
              <li>自动instrumentation</li>
              <li>Jaeger Exporter</li>
            </ul>
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>前端</h3>
            <ul style={{ color: '#666', paddingLeft: '1.5rem' }}>
              <li>Next.js 14</li>
              <li>React 18</li>
              <li>TypeScript</li>
              <li>Axios</li>
            </ul>
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>追踪后端</h3>
            <ul style={{ color: '#666', paddingLeft: '1.5rem' }}>
              <li>Jaeger</li>
              <li>OpenTelemetry Collector</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}

