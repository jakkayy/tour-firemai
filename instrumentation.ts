import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchLogRecordProcessor, LoggerProvider } from "@opentelemetry/sdk-logs";

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
const configured = Boolean(key && host);

export const loggerProvider = new LoggerProvider({
  resource: resourceFromAttributes({ "service.name": "tour-firemai-web" }),
  processors: configured
    ? [
        new BatchLogRecordProcessor({
          exporter: new OTLPLogExporter({
            url: `${host!.replace(/\/$/, "")}/i/v1/logs`,
            headers: {
              Authorization: `Bearer ${key!}`,
              "Content-Type": "application/json",
            },
            timeoutMillis: 2000,
          }),
        }),
      ]
    : [],
});

export const posthogLogger = loggerProvider.getLogger("tour-firemai.posthog");

export function register() {
  if (!configured && process.env.NODE_ENV !== "production") {
    const missingVariable = key
      ? "NEXT_PUBLIC_POSTHOG_HOST"
      : "NEXT_PUBLIC_POSTHOG_KEY";
    console.warn(
      `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`,
    );
  }
}
