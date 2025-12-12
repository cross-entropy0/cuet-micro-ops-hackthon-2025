import { WebTracerProvider, BatchSpanProcessor } from '@opentelemetry/sdk-trace-web'
import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch'
import { ZoneContextManager } from '@opentelemetry/context-zone'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'

export function initializeOTEL() {
  // Create provider with service name
  const provider = new WebTracerProvider({
    // Service name can be set via span attributes instead
  })

  // Configure OTLP exporter to send traces to Jaeger
  const exporter = new OTLPTraceExporter({
    url: import.meta.env.VITE_OTEL_EXPORTER_URL || 'http://localhost:4318/v1/traces',
  })

  // Add span processor for batch export
  provider.addSpanProcessor(new BatchSpanProcessor(exporter))

  // Register provider with zone context manager for async context propagation
  provider.register({
    contextManager: new ZoneContextManager(),
  })

  // Auto-instrument fetch API for automatic trace propagation
  registerInstrumentations({
    instrumentations: [
      new FetchInstrumentation({
        propagateTraceHeaderCorsUrls: [
          /http:\/\/localhost:3000\/.*/,  // Backend API
          new RegExp(import.meta.env.VITE_API_URL || ''),
        ].filter(Boolean),
        clearTimingResources: true,
        applyCustomAttributesOnSpan: (span: any, request: any, response: any) => {
          span.setAttribute('http.request.method', request.method)
          span.setAttribute('http.url', request.url)
          if (response) {
            span.setAttribute('http.status_code', response.status)
          }
        },
      }),
    ],
  })

  console.log('✅ OpenTelemetry initialized with W3C Trace Context propagation')
  
  return provider
}
