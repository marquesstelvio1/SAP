import type { ActorType as TelemetryActorType, TraceContext } from "@saptm/observability";

import type { PlatformPermission } from "./permissions.js";

export const authActorTypes = ["user", "service_account", "platform"] as const;

export type AuthActorType = (typeof authActorTypes)[number];

export type AuthContext = {
  actorId: string;
  actorType: AuthActorType;
  organizationId?: string;
  permissions: readonly PlatformPermission[];
  correlationId: string;
  requestId?: string;
  sessionId?: string;
  userId?: string;
  serviceAccountId?: string;
  apiKeyId?: string;
  supportGrantId?: string;
  twoFactorEnabled?: boolean;
  authenticatedAt?: string;
  expiresAt?: string;
};

export type CreateAuthContextInput = {
  actorId: string;
  actorType: AuthActorType;
  organizationId?: string;
  permissions?: readonly PlatformPermission[];
  traceContext: Pick<TraceContext, "correlationId" | "requestId">;
  sessionId?: string;
  userId?: string;
  serviceAccountId?: string;
  apiKeyId?: string;
  supportGrantId?: string;
  twoFactorEnabled?: boolean;
  authenticatedAt?: Date;
  expiresAt?: Date;
};

export function createAuthContext(input: CreateAuthContextInput): AuthContext {
  return {
    actorId: input.actorId,
    actorType: input.actorType,
    correlationId: input.traceContext.correlationId,
    requestId: input.traceContext.requestId,
    permissions: input.permissions ?? [],
    ...(input.organizationId === undefined ? {} : { organizationId: input.organizationId }),
    ...(input.sessionId === undefined ? {} : { sessionId: input.sessionId }),
    ...(input.userId === undefined ? {} : { userId: input.userId }),
    ...(input.serviceAccountId === undefined ? {} : { serviceAccountId: input.serviceAccountId }),
    ...(input.apiKeyId === undefined ? {} : { apiKeyId: input.apiKeyId }),
    ...(input.supportGrantId === undefined ? {} : { supportGrantId: input.supportGrantId }),
    ...(input.twoFactorEnabled === undefined ? {} : { twoFactorEnabled: input.twoFactorEnabled }),
    ...(input.authenticatedAt === undefined
      ? {}
      : { authenticatedAt: input.authenticatedAt.toISOString() }),
    ...(input.expiresAt === undefined ? {} : { expiresAt: input.expiresAt.toISOString() }),
  };
}

export function authActorTypeToTelemetryActorType(actorType: AuthActorType): TelemetryActorType {
  if (actorType === "service_account") {
    return "service";
  }

  if (actorType === "platform") {
    return "system";
  }

  return "user";
}

export function enrichTraceContextWithAuth(
  traceContext: TraceContext,
  authContext: AuthContext,
): TraceContext {
  const tenantId = authContext.organizationId ?? traceContext.tenantId;

  return {
    ...traceContext,
    correlationId: authContext.correlationId,
    requestId: authContext.requestId ?? traceContext.requestId,
    actorType: authActorTypeToTelemetryActorType(authContext.actorType),
    actorId: authContext.actorId,
    ...(tenantId === undefined ? {} : { tenantId }),
  };
}

export function hasPlatformPermission(
  authContext: Pick<AuthContext, "permissions">,
  permission: PlatformPermission,
): boolean {
  return authContext.permissions.includes(permission);
}
