export const telemetrySignals = ["log", "metric", "span", "audit"] as const;
export const logLevels = ["debug", "info", "warn", "error", "critical"] as const;
export const actorTypes = [
  "anonymous",
  "user",
  "service",
  "integration",
  "system",
  "ai-agent",
] as const;
export const spanStatuses = ["unset", "ok", "error"] as const;
export const metricKinds = ["counter", "gauge", "histogram"] as const;

export type TelemetrySignal = (typeof telemetrySignals)[number];
export type LogLevel = (typeof logLevels)[number];
export type ActorType = (typeof actorTypes)[number];
export type SpanStatus = (typeof spanStatuses)[number];
export type MetricKind = (typeof metricKinds)[number];
export type RuntimeEnvironment = "development" | "test" | "production";
export type TelemetryPrimitive = string | number | boolean | null;
export type TelemetryAttributeValue = TelemetryPrimitive | TelemetryPrimitive[];
export type TelemetryAttributes = Record<string, TelemetryAttributeValue>;
export type TraceHeaderMap = Record<string, string>;

export * from "./prometheus.js";

type NullableTraceContext = {
  [Key in keyof TraceContext]?: TraceContext[Key] | undefined;
};

export type TraceContext = {
  correlationId: string;
  requestId: string;
  tenantId?: string;
  actorType?: ActorType;
  actorId?: string;
  operationName?: string;
  sourceSystem?: string;
  resourceType?: string;
  resourceId?: string;
  traceId?: string;
  spanId?: string;
  parentSpanId?: string;
  sampled?: boolean;
};

export type TraceContextInput = Partial<TraceContext> & {
  operationName: string;
  sourceSystem: string;
};

export type ObservabilityBase = {
  timestamp: string;
  serviceName: string;
  environment: RuntimeEnvironment;
  context: TraceContext;
  attributes: TelemetryAttributes;
};

export type NormalizedError = {
  name: string;
  message: string;
  stack?: string;
  code?: string;
};

export type LogRecord = ObservabilityBase & {
  signal: "log";
  level: LogLevel;
  message: string;
  error?: NormalizedError;
};

export type MetricRecord = ObservabilityBase & {
  signal: "metric";
  name: string;
  kind: MetricKind;
  value: number;
  unit?: string;
};

export type SpanEvent = {
  name: string;
  timestamp: string;
  attributes: TelemetryAttributes;
};

export type SpanRecord = ObservabilityBase & {
  signal: "span";
  name: string;
  status: SpanStatus;
  startedAt: string;
  endedAt: string;
  durationMs: number;
  events: SpanEvent[];
};

export type AuditRecord = ObservabilityBase & {
  signal: "audit";
  action: string;
  outcome: "success" | "failure";
  resourceType: string;
  resourceId?: string;
  reason?: string;
};

export type Logger = {
  debug: (message: string, input?: LogInput) => LogRecord | undefined;
  info: (message: string, input?: LogInput) => LogRecord | undefined;
  warn: (message: string, input?: LogInput) => LogRecord | undefined;
  error: (message: string, input?: LogInput) => LogRecord | undefined;
  critical: (message: string, input?: LogInput) => LogRecord | undefined;
};

export type LoggerOptions = {
  serviceName: string;
  environment: RuntimeEnvironment;
  defaultContext: TraceContext;
  defaultAttributes?: TelemetryAttributes;
  minimumLevel?: LogLevel;
  sink?: (record: LogRecord) => void;
  clock?: () => Date;
};

export type LogInput = {
  context?: Partial<TraceContext>;
  attributes?: TelemetryAttributes;
  error?: unknown;
};

export type MetricInput = {
  serviceName: string;
  environment: RuntimeEnvironment;
  context: TraceContext;
  name: string;
  kind: MetricKind;
  value: number;
  unit?: string;
  attributes?: TelemetryAttributes;
  clock?: () => Date;
};

export type SpanInput = {
  serviceName: string;
  environment: RuntimeEnvironment;
  context: TraceContext;
  name: string;
  status?: SpanStatus;
  startedAt: Date;
  endedAt?: Date;
  attributes?: TelemetryAttributes;
  events?: SpanEvent[];
  clock?: () => Date;
};

export type AuditInput = {
  serviceName: string;
  environment: RuntimeEnvironment;
  context: TraceContext;
  action: string;
  outcome: "success" | "failure";
  resourceType: string;
  resourceId?: string;
  reason?: string;
  attributes?: TelemetryAttributes;
  clock?: () => Date;
};

const logLevelRank: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  critical: 4,
};

const defaultSensitiveKeyPatterns = [
  /password/i,
  /secret/i,
  /token/i,
  /authorization/i,
  /cookie/i,
  /credential/i,
  /api[-_]?key/i,
];

export function createCorrelationId(prefix = "corr"): string {
  return createTelemetryId(prefix);
}

export function createRequestId(prefix = "req"): string {
  return createTelemetryId(prefix);
}

export function createTraceContext(input: TraceContextInput): TraceContext {
  return {
    correlationId: input.correlationId ?? createCorrelationId(),
    requestId: input.requestId ?? createRequestId(),
    ...definedTraceContext(input),
  };
}

export function mergeTraceContext(
  base: TraceContext,
  overrides: Partial<TraceContext> = {},
): TraceContext {
  return {
    ...base,
    ...definedTraceContext(overrides),
    correlationId: overrides.correlationId ?? base.correlationId,
    requestId: overrides.requestId ?? base.requestId,
  };
}

export function serializeTraceHeaders(context: TraceContext): TraceHeaderMap {
  const headers: TraceHeaderMap = {
    "x-correlation-id": context.correlationId,
    "x-request-id": context.requestId,
  };

  setHeader(headers, "x-tenant-id", context.tenantId);
  setHeader(headers, "x-actor-type", context.actorType);
  setHeader(headers, "x-actor-id", context.actorId);
  setHeader(headers, "x-operation-name", context.operationName);
  setHeader(headers, "x-source-system", context.sourceSystem);
  setHeader(headers, "x-resource-type", context.resourceType);
  setHeader(headers, "x-resource-id", context.resourceId);
  setHeader(headers, "x-trace-id", context.traceId);
  setHeader(headers, "x-span-id", context.spanId);
  setHeader(headers, "x-parent-span-id", context.parentSpanId);

  if (context.sampled !== undefined) {
    headers["x-trace-sampled"] = context.sampled ? "true" : "false";
  }

  return headers;
}

export function parseTraceHeaders(
  headers: Record<string, string | undefined>,
): Partial<TraceContext> {
  const parsed: NullableTraceContext = {
    correlationId: readHeader(headers, "x-correlation-id"),
    requestId: readHeader(headers, "x-request-id"),
    tenantId: readHeader(headers, "x-tenant-id"),
    actorType: parseActorType(readHeader(headers, "x-actor-type")),
    actorId: readHeader(headers, "x-actor-id"),
    operationName: readHeader(headers, "x-operation-name"),
    sourceSystem: readHeader(headers, "x-source-system"),
    resourceType: readHeader(headers, "x-resource-type"),
    resourceId: readHeader(headers, "x-resource-id"),
    traceId: readHeader(headers, "x-trace-id"),
    spanId: readHeader(headers, "x-span-id"),
    parentSpanId: readHeader(headers, "x-parent-span-id"),
  };

  const sampled = readHeader(headers, "x-trace-sampled");

  return {
    ...definedTraceContext(parsed),
    ...(sampled === undefined ? {} : { sampled: sampled === "true" }),
  };
}

export function redactSensitiveAttributes(
  attributes: TelemetryAttributes = {},
  patterns = defaultSensitiveKeyPatterns,
): TelemetryAttributes {
  return Object.fromEntries(
    Object.entries(attributes).map(([key, value]) => [
      key,
      patterns.some((pattern) => pattern.test(key)) ? "[REDACTED]" : value,
    ]),
  );
}

export function normalizeError(error: unknown): NormalizedError {
  if (error instanceof Error) {
    const normalized: NormalizedError = {
      name: error.name,
      message: error.message,
    };

    if (error.stack !== undefined) {
      normalized.stack = error.stack;
    }

    return normalized;
  }

  return {
    name: "UnknownError",
    message: typeof error === "string" ? error : JSON.stringify(error),
  };
}

export function createLogRecord(
  options: Omit<LoggerOptions, "sink" | "minimumLevel">,
  level: LogLevel,
  message: string,
  input: LogInput = {},
): LogRecord {
  const clock = options.clock ?? (() => new Date());
  const context = mergeTraceContext(options.defaultContext, input.context);
  const attributes = redactSensitiveAttributes({
    ...(options.defaultAttributes ?? {}),
    ...(input.attributes ?? {}),
  });
  const baseRecord: LogRecord = {
    signal: "log",
    timestamp: clock().toISOString(),
    serviceName: options.serviceName,
    environment: options.environment,
    context,
    attributes,
    level,
    message,
  };

  if (input.error === undefined) {
    return baseRecord;
  }

  return {
    ...baseRecord,
    error: normalizeError(input.error),
  };
}

export function createConsoleLogger(options: LoggerOptions): Logger {
  const minimumLevel = options.minimumLevel ?? "info";
  const sink = options.sink ?? writeLogRecordToConsole;

  function emit(level: LogLevel, message: string, input?: LogInput): LogRecord | undefined {
    if (logLevelRank[level] < logLevelRank[minimumLevel]) {
      return undefined;
    }

    const record = createLogRecord(options, level, message, input);
    sink(record);
    return record;
  }

  return {
    debug: (message, input) => emit("debug", message, input),
    info: (message, input) => emit("info", message, input),
    warn: (message, input) => emit("warn", message, input),
    error: (message, input) => emit("error", message, input),
    critical: (message, input) => emit("critical", message, input),
  };
}

export function createMetricRecord(input: MetricInput): MetricRecord {
  const clock = input.clock ?? (() => new Date());
  const baseRecord: MetricRecord = {
    signal: "metric",
    timestamp: clock().toISOString(),
    serviceName: input.serviceName,
    environment: input.environment,
    context: input.context,
    attributes: redactSensitiveAttributes(input.attributes),
    name: input.name,
    kind: input.kind,
    value: input.value,
  };

  if (input.unit === undefined) {
    return baseRecord;
  }

  return {
    ...baseRecord,
    unit: input.unit,
  };
}

export function createSpanRecord(input: SpanInput): SpanRecord {
  const endedAt = input.endedAt ?? input.clock?.() ?? new Date();

  return {
    signal: "span",
    timestamp: endedAt.toISOString(),
    serviceName: input.serviceName,
    environment: input.environment,
    context: input.context,
    attributes: redactSensitiveAttributes(input.attributes),
    name: input.name,
    status: input.status ?? "unset",
    startedAt: input.startedAt.toISOString(),
    endedAt: endedAt.toISOString(),
    durationMs: endedAt.getTime() - input.startedAt.getTime(),
    events: input.events ?? [],
  };
}

export function createAuditRecord(input: AuditInput): AuditRecord {
  const clock = input.clock ?? (() => new Date());
  const baseRecord: AuditRecord = {
    signal: "audit",
    timestamp: clock().toISOString(),
    serviceName: input.serviceName,
    environment: input.environment,
    context: input.context,
    attributes: redactSensitiveAttributes(input.attributes),
    action: input.action,
    outcome: input.outcome,
    resourceType: input.resourceType,
  };

  return {
    ...baseRecord,
    ...(input.resourceId === undefined ? {} : { resourceId: input.resourceId }),
    ...(input.reason === undefined ? {} : { reason: input.reason }),
  };
}

function createTelemetryId(prefix: string): string {
  const randomId =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

  return `${prefix}_${randomId}`;
}

function setHeader(headers: TraceHeaderMap, name: string, value: string | undefined): void {
  if (value !== undefined) {
    headers[name] = value;
  }
}

function readHeader(headers: Record<string, string | undefined>, name: string): string | undefined {
  return headers[name] ?? headers[name.toLowerCase()] ?? headers[name.toUpperCase()];
}

function parseActorType(value: string | undefined): ActorType | undefined {
  if (value === undefined) {
    return undefined;
  }

  return actorTypes.includes(value as ActorType) ? (value as ActorType) : undefined;
}

function definedTraceContext(input: NullableTraceContext): Partial<TraceContext> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  ) as Partial<TraceContext>;
}

function writeLogRecordToConsole(record: LogRecord): void {
  const payload = JSON.stringify(record);

  if (record.level === "debug") {
    console.debug(payload);
    return;
  }

  if (record.level === "warn") {
    console.warn(payload);
    return;
  }

  if (record.level === "error" || record.level === "critical") {
    console.error(payload);
    return;
  }

  console.info(payload);
}
