import { Injectable } from "@nestjs/common";
import type { AuthContext, AuthorizationDecision, AuthorizationRequirement } from "@saptm/auth";
import {
  createAuditRecord,
  createConsoleLogger,
  createMetricRecord,
  createPrometheusRegistry,
  createSpanRecord,
  createTraceContext,
  type LogLevel,
  normalizeError,
  parseTraceHeaders,
  type RuntimeEnvironment,
  serializeTraceHeaders,
  type TraceContext,
} from "@saptm/observability";
import type { RpcOperationMetadata } from "@saptm/rpc";

import {
  getRequestPath,
  getRoutePath,
  normalizeHeaders,
  type RequestWithObservability,
  type ResponseWithObservability,
} from "./observability-context.js";

export type HttpTelemetryInput = {
  request: RequestWithObservability;
  response?: ResponseWithObservability;
  traceContext: TraceContext;
  startedAt: Date;
  error?: unknown;
};

export type AuthorizationTelemetryInput = {
  request: RequestWithObservability;
  authContext?: AuthContext;
  decision: AuthorizationDecision;
  requirement?: AuthorizationRequirement;
};

export type RpcAuthorizationTelemetryInput = AuthorizationTelemetryInput & {
  metadata: RpcOperationMetadata;
};

@Injectable()
export class ObservabilityService {
  private readonly serviceName = readServiceName();
  private readonly environment = readRuntimeEnvironment();
  private readonly minimumLevel = readLogLevel();
  private readonly metrics = createPrometheusRegistry();

  createHttpTraceContext(request: RequestWithObservability): TraceContext {
    const headers = normalizeHeaders(request.headers);
    const parsedContext = parseTraceHeaders(headers);
    const method = request.method ?? "UNKNOWN";
    const path = getRequestPath(request);

    return createTraceContext({
      ...parsedContext,
      operationName: parsedContext.operationName ?? `http.${method}.${path}`,
      sourceSystem: parsedContext.sourceSystem ?? "apps/api",
      resourceType: parsedContext.resourceType ?? "http.request",
      resourceId: parsedContext.resourceId ?? `${method} ${path}`,
    });
  }

  attachResponseHeaders(
    response: ResponseWithObservability | undefined,
    traceContext: TraceContext,
  ): void {
    if (!response?.setHeader) {
      return;
    }

    const headers = serializeTraceHeaders(traceContext);

    for (const [name, value] of Object.entries(headers)) {
      response.setHeader(name, value);
    }
  }

  createRequestLogger(traceContext: TraceContext, request: RequestWithObservability) {
    return createConsoleLogger({
      serviceName: this.serviceName,
      environment: this.environment,
      minimumLevel: this.minimumLevel,
      defaultContext: traceContext,
      defaultAttributes: {
        "http.method": request.method ?? "UNKNOWN",
        "http.route": getRoutePath(request),
      },
    });
  }

  recordHttpRequest(input: HttpTelemetryInput): void {
    const endedAt = new Date();
    const statusCode = input.response?.statusCode ?? 0;
    const method = input.request.method ?? "UNKNOWN";
    const path = getRequestPath(input.request);
    const route = getRoutePath(input.request);
    const attributes = {
      "http.method": method,
      "http.path": path,
      "http.route": route,
      "http.status_code": statusCode,
    };
    const metricAttributes = {
      "http.method": method,
      "http.route": route,
      "http.status_class": `${Math.trunc(statusCode / 100)}xx`,
      "http.status_code": statusCode,
    };
    const logger =
      input.request.logger ?? this.createRequestLogger(input.traceContext, input.request);
    const durationMs = endedAt.getTime() - input.startedAt.getTime();
    const span = createSpanRecord({
      serviceName: this.serviceName,
      environment: this.environment,
      context: input.traceContext,
      name: input.traceContext.operationName ?? `http.${method}`,
      status: input.error === undefined ? "ok" : "error",
      startedAt: input.startedAt,
      endedAt,
      attributes,
      events:
        input.error === undefined
          ? []
          : [
              {
                name: "exception",
                timestamp: endedAt.toISOString(),
                attributes: {
                  "exception.name": normalizeError(input.error).name,
                  "exception.message": normalizeError(input.error).message,
                },
              },
            ],
    });
    const metric = createMetricRecord({
      serviceName: this.serviceName,
      environment: this.environment,
      context: input.traceContext,
      name: "http.server.duration_ms",
      kind: "histogram",
      value: durationMs,
      unit: "ms",
      attributes: metricAttributes,
    });

    this.metrics.record(metric);

    if (input.error === undefined) {
      logger.info("HTTP request completed.", {
        attributes: {
          ...attributes,
          "http.duration_ms": durationMs,
          "telemetry.span": span.name,
          "telemetry.metric": metric.name,
        },
      });
      return;
    }

    logger.error("HTTP request failed.", {
      attributes: {
        ...attributes,
        "http.duration_ms": durationMs,
        "telemetry.span": span.name,
        "telemetry.metric": metric.name,
      },
      error: input.error,
    });
  }

  recordAuthorizationDecision(input: AuthorizationTelemetryInput): void {
    const authCtx = input.authContext;
    const traceContext =
      input.request.traceContext ??
      createTraceContext({
        operationName: "authorization.evaluate",
        sourceSystem: "apps/api",
        ...(authCtx?.correlationId !== undefined
          ? {
              correlationId: authCtx.correlationId,
              requestId: authCtx.requestId ?? authCtx.correlationId,
            }
          : {}),
        ...(authCtx !== undefined
          ? {
              actorId: authCtx.actorId,
              actorType: authActorTypeToTelemetryActorType(authCtx.actorType),
              ...(authCtx.organizationId === undefined ? {} : { tenantId: authCtx.organizationId }),
            }
          : {}),
      });
    const method = input.request.method ?? "UNKNOWN";
    const route = getRoutePath(input.request);
    const audit = createAuditRecord({
      serviceName: this.serviceName,
      environment: this.environment,
      context: traceContext,
      action: "authorization.evaluate",
      outcome: input.decision.allowed ? "success" : "failure",
      resourceType: "api.route",
      resourceId: `${method} ${route}`,
      reason: input.decision.reason,
      attributes: {
        "authorization.allowed": input.decision.allowed,
        "authorization.failed_attributes": [...input.decision.failedAttributes],
        "authorization.missing_permissions": [...input.decision.missingPermissions],
        "authorization.required_permissions": [...(input.requirement?.permissions ?? [])],
        "authorization.permission_mode": input.requirement?.permissionMode ?? "all",
        "auth.actor_type": input.authContext?.actorType ?? "anonymous",
      },
    });
    const logger = input.request.logger ?? this.createRequestLogger(traceContext, input.request);
    const metric = createMetricRecord({
      serviceName: this.serviceName,
      environment: this.environment,
      context: traceContext,
      name: "authorization.decisions",
      kind: "counter",
      value: 1,
      attributes: {
        "authorization.allowed": input.decision.allowed,
        "authorization.permission_mode": input.requirement?.permissionMode ?? "all",
        "auth.actor_type": input.authContext?.actorType ?? "anonymous",
        "audit.resource_type": audit.resourceType,
      },
    });

    this.metrics.record(metric);

    if (input.decision.allowed) {
      logger.info("Authorization decision recorded.", {
        attributes: {
          "audit.action": audit.action,
          "audit.outcome": audit.outcome,
          "audit.resource_type": audit.resourceType,
          "audit.resource_id": audit.resourceId ?? "unknown",
        },
      });
      return;
    }

    logger.warn("Authorization decision denied.", {
      attributes: {
        "audit.action": audit.action,
        "audit.outcome": audit.outcome,
        "audit.resource_type": audit.resourceType,
        "audit.resource_id": audit.resourceId ?? "unknown",
        "audit.reason": audit.reason ?? input.decision.reason,
      },
    });
  }

  recordRpcAuthorizationDecision(input: RpcAuthorizationTelemetryInput): void {
    const authCtx = input.authContext;
    const traceContext =
      input.request.traceContext ??
      createTraceContext({
        operationName: input.metadata.observability.operationName,
        sourceSystem: "apps/api",
        ...(authCtx?.correlationId !== undefined
          ? {
              correlationId: authCtx.correlationId,
              requestId: authCtx.requestId ?? authCtx.correlationId,
            }
          : {}),
        ...(authCtx !== undefined
          ? {
              actorId: authCtx.actorId,
              actorType: authActorTypeToTelemetryActorType(authCtx.actorType),
              ...(authCtx.organizationId === undefined ? {} : { tenantId: authCtx.organizationId }),
            }
          : {}),
      });
    const audit = createAuditRecord({
      serviceName: this.serviceName,
      environment: this.environment,
      context: traceContext,
      action: "rpc.authorization.evaluate",
      outcome: input.decision.allowed ? "success" : "failure",
      resourceType: "rpc.operation",
      resourceId: `${input.metadata.name}@v${input.metadata.version}`,
      reason: input.decision.reason,
      attributes: {
        "authorization.allowed": input.decision.allowed,
        "authorization.failed_attributes": [...input.decision.failedAttributes],
        "authorization.missing_permissions": [...input.decision.missingPermissions],
        "authorization.required_permissions": [...(input.requirement?.permissions ?? [])],
        "authorization.permission_mode": input.requirement?.permissionMode ?? "all",
        "auth.actor_type": input.authContext?.actorType ?? "anonymous",
        "rpc.audit": input.metadata.audit,
        "rpc.auth": input.metadata.auth,
        "rpc.kind": input.metadata.kind,
        "rpc.operation": input.metadata.name,
        "rpc.version": input.metadata.version,
      },
    });
    const logger = input.request.logger ?? this.createRequestLogger(traceContext, input.request);
    const metric = createMetricRecord({
      serviceName: this.serviceName,
      environment: this.environment,
      context: traceContext,
      name: "rpc.authorization.decisions",
      kind: "counter",
      value: 1,
      attributes: {
        "authorization.allowed": input.decision.allowed,
        "authorization.permission_mode": input.requirement?.permissionMode ?? "all",
        "auth.actor_type": input.authContext?.actorType ?? "anonymous",
        "rpc.audit": input.metadata.audit,
        "rpc.auth": input.metadata.auth,
        "rpc.kind": input.metadata.kind,
        "rpc.operation": input.metadata.name,
        "rpc.version": input.metadata.version,
      },
    });

    this.metrics.record(metric);

    if (input.decision.allowed) {
      logger.info("RPC authorization decision recorded.", {
        attributes: {
          "audit.action": audit.action,
          "audit.outcome": audit.outcome,
          "audit.resource_type": audit.resourceType,
          "audit.resource_id": audit.resourceId ?? "unknown",
        },
      });
      return;
    }

    logger.warn("RPC authorization decision denied.", {
      attributes: {
        "audit.action": audit.action,
        "audit.outcome": audit.outcome,
        "audit.resource_type": audit.resourceType,
        "audit.resource_id": audit.resourceId ?? "unknown",
        "audit.reason": audit.reason ?? input.decision.reason,
      },
    });
  }

  renderPrometheusMetrics(): string {
    const traceContext = createTraceContext({
      operationName: "observability.metrics.scrape",
      sourceSystem: "apps/api",
      resourceType: "metrics.scrape",
      resourceId: "prometheus",
    });

    this.metrics.record(
      createMetricRecord({
        serviceName: this.serviceName,
        environment: this.environment,
        context: traceContext,
        name: "process.uptime_seconds",
        kind: "gauge",
        value: process.uptime(),
        unit: "s",
        attributes: {},
      }),
    );

    return this.metrics.render();
  }
}

function readServiceName(): string {
  return process.env.OTEL_SERVICE_NAME ?? "@saptm/api";
}

function readRuntimeEnvironment(): RuntimeEnvironment {
  if (process.env.NODE_ENV === "production" || process.env.NODE_ENV === "test") {
    return process.env.NODE_ENV;
  }

  return "development";
}

function readLogLevel(): LogLevel {
  const value = process.env.LOG_LEVEL;

  if (
    value === "debug" ||
    value === "info" ||
    value === "warn" ||
    value === "error" ||
    value === "critical"
  ) {
    return value;
  }

  return "info";
}

function authActorTypeToTelemetryActorType(actorType: AuthContext["actorType"]) {
  if (actorType === "service_account") {
    return "service";
  }

  if (actorType === "platform") {
    return "system";
  }

  return "user";
}
