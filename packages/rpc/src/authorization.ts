import type { AuthContext, AuthorizationDecision, AuthorizationRequirement } from "@saptm/auth";
import { evaluateAuthorization } from "@saptm/auth";

import type { RpcOperationMetadata } from "./metadata.js";

export function createRpcAuthorizationRequirement(
  metadata: RpcOperationMetadata,
): AuthorizationRequirement | undefined {
  if (metadata.auth === "public") {
    return undefined;
  }

  const actorTypes =
    metadata.actorTypes ??
    (metadata.auth === "service" ? (["service_account"] as const) : (["user"] as const));

  return {
    actorTypes,
    permissions: metadata.permissions,
    permissionMode: metadata.permissionMode,
    organizationRequired: metadata.organizationRequired,
    ...(metadata.organizationId === undefined ? {} : { organizationId: metadata.organizationId }),
  };
}

export function evaluateRpcAuthorization(
  authContext: AuthContext | undefined,
  metadata: RpcOperationMetadata,
): AuthorizationDecision {
  if (metadata.auth === "public") {
    return {
      allowed: true,
      reason: "rpc.authorization.public",
      missingPermissions: [],
      failedAttributes: [],
    };
  }

  if (authContext === undefined) {
    return {
      allowed: false,
      reason: "rpc.authorization.unauthenticated",
      missingPermissions: metadata.permissions,
      failedAttributes: ["auth_context"],
    };
  }

  return evaluateAuthorization(authContext, createRpcAuthorizationRequirement(metadata));
}

export function isRpcAuthenticationRequired(metadata: RpcOperationMetadata): boolean {
  return metadata.auth !== "public";
}
