import { DiagConsoleLogger, DiagLogLevel, diag } from "@opentelemetry/api";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { NodeSDK } from "@opentelemetry/sdk-node";

let sdk: NodeSDK | null = null;

export function initOpenTelemetry(): void {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!endpoint) {
    diag.info("OTEL_EXPORTER_OTLP_ENDPOINT not set, skipping OTel initialization");
    return;
  }

  sdk = new NodeSDK({
    traceExporter: new OTLPTraceExporter({
      url: `${endpoint}/v1/traces`,
    }),
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start();

  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

  process.on("SIGTERM", () => {
    sdk?.shutdown().catch((err) => {
      diag.error("Error shutting down OTel SDK", err);
    });
  });
}

export async function shutdownOpenTelemetry(): Promise<void> {
  if (sdk) {
    await sdk.shutdown();
    sdk = null;
  }
}
