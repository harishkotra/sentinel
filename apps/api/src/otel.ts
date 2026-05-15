import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { Resource } from '@opentelemetry/resources';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';

export function setupTelemetry() {
  const provider = new NodeTracerProvider({
    resource: new Resource({
      'service.name': 'sentinel-api',
      'service.version': '0.1.0'
    })
  });

  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (endpoint) {
    provider.addSpanProcessor(new SimpleSpanProcessor(new OTLPTraceExporter({ url: endpoint })));
  }

  provider.register();
}
