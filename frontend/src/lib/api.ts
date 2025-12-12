import axios from 'axios'
import * as Sentry from '@sentry/react'
import { trace, SpanStatusCode, Span } from '@opentelemetry/api'
import { recordAPICall } from './metrics'

// Extend axios metadata type to include OTEL span
declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    metadata?: {
      span?: Span
      startTime?: number
    }
  }
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 35000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Get OTEL tracer for manual instrumentation
const tracer = trace.getTracer('frontend-api-client', '1.0.0')

// Request interceptor for OTEL trace propagation and performance tracking
api.interceptors.request.use((config) => {
  // Start OTEL span for this API call
  const span = tracer.startSpan(`HTTP ${config.method?.toUpperCase()} ${config.url}`, {
    kind: 1, // SpanKind.CLIENT
    attributes: {
      'http.method': config.method?.toUpperCase(),
      'http.url': `${API_BASE_URL}${config.url}`,
      'http.target': config.url,
    },
  })

  // Get W3C trace ID from span context
  const spanContext = span.spanContext()
  const traceId = spanContext.traceId
  const spanId = spanContext.spanId

  // Store trace ID for display in UI
  sessionStorage.setItem('current-trace-id', traceId)

  // Set x-request-id for backward compatibility (use trace ID)
  config.headers['x-request-id'] = traceId

  // Manually inject traceparent header for W3C Trace Context propagation
  // Format: 00-{trace-id}-{span-id}-{trace-flags}
  const traceFlags = spanContext.traceFlags.toString(16).padStart(2, '0')
  config.headers['traceparent'] = `00-${traceId}-${spanId}-${traceFlags}`

  // Tag Sentry with OTEL trace ID for correlation
  Sentry.setTag('trace_id', traceId)
  Sentry.setTag('span_id', spanId)

  // Store span and metadata for response/error handling
  ;(config as any).metadata = { span, startTime: Date.now() }
  
  return config
})

// Response interceptor
api.interceptors.response.use(
  (response) => {
    const duration = Date.now() - (response.config.metadata?.startTime || Date.now())
    recordAPICall(duration, true)
    
    const traceId = response.headers['x-request-id']
    if (traceId) {
      console.log(`✅ Trace ID: ${traceId}`)
    }
    
    // End OTEL span with success status
    const span = response.config.metadata?.span
    if (span) {
      span.setStatus({ code: SpanStatusCode.OK })
      span.setAttribute('http.status_code', response.status)
      span.setAttribute('http.response.size', response.headers['content-length'] || 0)
      span.end()
    }
    
    return response
  },
  (error) => {
    const duration = Date.now() - (error.config?.metadata?.startTime || Date.now())
    recordAPICall(duration, false)
    
    const traceId = error.response?.headers['x-request-id']
    if (traceId) {
      console.error(`❌ Error with Trace ID: ${traceId}`)
    }
    
    // End OTEL span with error status
    const span = error.config?.metadata?.span
    if (span) {
      span.setStatus({ 
        code: SpanStatusCode.ERROR,
        message: error.message || 'Request failed'
      })
      span.setAttribute('http.status_code', error.response?.status || 500)
      span.recordException(error)
      span.end()
    }

    // Capture error in Sentry (already tagged with trace_id/span_id)
    Sentry.captureException(error)
    
    return Promise.reject(error)
  }
)

// API endpoints
export const apiClient = {
  getHealth: () => api.get('/health'),
  startDownload: (fileId: number) =>
    api.post('/v1/download/start', { file_id: fileId }),
  checkAvailability: (fileId: number) =>
    api.post('/v1/download/check', { file_id: fileId }),
  triggerSentryTest: (fileId: number) =>
    api.post('/v1/download/check?sentry_test=true', { file_id: fileId }),
}
