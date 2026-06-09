import {
  type AuthActorType,
  type AuthContext,
  createAuthContext,
  type PlatformPermission,
} from "@saptm/auth";
import type { TraceContext } from "@saptm/observability";

import { createTestTraceContext } from "./trace-fixtures.js";

export type CreateTestAuthContextInput = {
  actorId?: string;
  actorType?: AuthActorType;
  organizationId?: string;
  permissions?: readonly PlatformPermission[];
  traceContext?: TraceContext;
  userId?: string;
  serviceAccountId?: string;
  apiKeyId?: string;
};

export function createTestAuthContext(input: CreateTestAuthContextInput = {}): AuthContext {
  const actorType = input.actorType ?? "user";
  const actorId = input.actorId ?? defaultActorId(actorType);

  return createAuthContext({
    actorId,
    actorType,
    traceContext: input.traceContext ?? createTestTraceContext(),
    permissions: input.permissions ?? [],
    ...(input.organizationId === undefined ? {} : { organizationId: input.organizationId }),
    ...(input.userId === undefined ? {} : { userId: input.userId }),
    ...(input.serviceAccountId === undefined ? {} : { serviceAccountId: input.serviceAccountId }),
    ...(input.apiKeyId === undefined ? {} : { apiKeyId: input.apiKeyId }),
  });
}

export function createTestUserAuthContext(
  input: Omit<CreateTestAuthContextInput, "actorType" | "serviceAccountId" | "apiKeyId"> = {},
): AuthContext {
  return createTestAuthContext({
    ...input,
    actorType: "user",
    userId: input.userId ?? input.actorId ?? "test-user-id",
  });
}

export function createTestServiceAccountAuthContext(
  input: Omit<CreateTestAuthContextInput, "actorType" | "userId"> = {},
): AuthContext {
  return createTestAuthContext({
    ...input,
    actorType: "service_account",
    serviceAccountId: input.serviceAccountId ?? input.actorId ?? "test-service-account-id",
    apiKeyId: input.apiKeyId ?? "test-api-key-id",
  });
}

export function createTestPlatformAuthContext(
  input: Omit<CreateTestAuthContextInput, "actorType" | "userId" | "serviceAccountId"> = {},
): AuthContext {
  return createTestAuthContext({
    ...input,
    actorType: "platform",
  });
}

function defaultActorId(actorType: AuthActorType): string {
  if (actorType === "service_account") {
    return "test-service-account-id";
  }

  if (actorType === "platform") {
    return "test-platform-actor";
  }

  return "test-user-id";
}
