import type { Logger, TraceContext } from "@saptm/observability";

export type HeaderValue = string | string[] | undefined;

export type RequestWithObservability = {
  headers?: Record<string, HeaderValue>;
  method?: string;
  originalUrl?: string;
  url?: string;
  route?: {
    path?: string;
  };
  traceContext?: TraceContext;
  logger?: Logger;
};

export type ResponseWithObservability = {
  statusCode?: number;
  setHeader?: (name: string, value: string) => void;
};

export function getRequiredTraceContext(request: RequestWithObservability): TraceContext {
  if (!request.traceContext) {
    throw new Error("Trace context is required.");
  }

  return request.traceContext;
}

export function getRequestPath(request: RequestWithObservability): string {
  return request.originalUrl ?? request.url ?? "unknown";
}

export function getRoutePath(request: RequestWithObservability): string {
  return request.route?.path ?? getRequestPath(request);
}

export function normalizeHeaders(
  headers: Record<string, HeaderValue> = {},
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers)
      .map(([key, value]) => [key, normalizeHeaderValue(value)] as const)
      .filter((entry): entry is readonly [string, string] => entry[1] !== undefined),
  );
}

function normalizeHeaderValue(value: HeaderValue): string | undefined {
  if (Array.isArray(value)) {
    return value.at(0);
  }

  return value;
}
