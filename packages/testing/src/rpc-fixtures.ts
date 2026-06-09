import type { AuthContext, AuthorizationDecision } from "@saptm/auth";
import {
  type CreateRpcOperationMetadataInput,
  createRpcOperationMetadata,
  evaluateRpcAuthorization,
  type RpcOperationMetadata,
} from "@saptm/rpc";

export type CreateTestRpcOperationMetadataInput = Partial<CreateRpcOperationMetadataInput>;

export function createTestRpcOperationMetadata(
  input: CreateTestRpcOperationMetadataInput = {},
): RpcOperationMetadata {
  return createRpcOperationMetadata({
    name: input.name ?? "test.operation",
    auth: input.auth ?? "session",
    kind: input.kind ?? "query",
    permissions: input.permissions ?? [],
    permissionMode: input.permissionMode ?? "all",
    organizationRequired: input.organizationRequired ?? false,
    audit: input.audit ?? "standard",
    idempotency: input.idempotency ?? "none",
    ...(input.version === undefined ? {} : { version: input.version }),
    ...(input.actorTypes === undefined ? {} : { actorTypes: input.actorTypes }),
    ...(input.organizationId === undefined ? {} : { organizationId: input.organizationId }),
    ...(input.criticality === undefined ? {} : { criticality: input.criticality }),
    ...(input.signals === undefined ? {} : { signals: input.signals }),
  });
}

export function assertRpcAuthorizationAllowed(
  authContext: AuthContext | undefined,
  metadata: RpcOperationMetadata,
): AuthorizationDecision {
  const decision = evaluateRpcAuthorization(authContext, metadata);

  if (!decision.allowed) {
    throw new Error(`Expected RPC authorization to be allowed, received ${decision.reason}`);
  }

  return decision;
}

export function assertRpcAuthorizationDenied(
  authContext: AuthContext | undefined,
  metadata: RpcOperationMetadata,
  expectedReason?: string,
): AuthorizationDecision {
  const decision = evaluateRpcAuthorization(authContext, metadata);

  if (decision.allowed) {
    throw new Error("Expected RPC authorization to be denied, received authorization.allowed");
  }

  if (expectedReason !== undefined && decision.reason !== expectedReason) {
    throw new Error(
      `Expected RPC authorization denial reason ${expectedReason}, received ${decision.reason}`,
    );
  }

  return decision;
}
