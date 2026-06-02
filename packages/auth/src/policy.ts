import type { AuthActorType, AuthContext } from "./context.js";
import { hasPlatformPermission } from "./context.js";
import type { PlatformPermission } from "./permissions.js";

export const authorizationModes = ["all", "any"] as const;

export type AuthorizationMode = (typeof authorizationModes)[number];

export type AuthorizationRequirement = {
  permissions?: readonly PlatformPermission[];
  permissionMode?: AuthorizationMode;
  actorTypes?: readonly AuthActorType[];
  organizationRequired?: boolean;
  organizationId?: string;
};

export type AuthorizationDecision = {
  allowed: boolean;
  reason: string;
  missingPermissions: readonly PlatformPermission[];
  failedAttributes: readonly string[];
};

export function evaluateAuthorization(
  authContext: AuthContext,
  requirement: AuthorizationRequirement = {},
): AuthorizationDecision {
  const failedAttributes = evaluateAttributes(authContext, requirement);
  const missingPermissions = evaluateMissingPermissions(authContext, requirement);
  const allowed = failedAttributes.length === 0 && missingPermissions.length === 0;

  return {
    allowed,
    reason: allowed
      ? "authorization.allowed"
      : buildDeniedReason(failedAttributes, missingPermissions),
    missingPermissions,
    failedAttributes,
  };
}

function evaluateAttributes(
  authContext: AuthContext,
  requirement: AuthorizationRequirement,
): string[] {
  const failedAttributes: string[] = [];

  if (
    requirement.actorTypes !== undefined &&
    !requirement.actorTypes.includes(authContext.actorType)
  ) {
    failedAttributes.push("actor_type");
  }

  if (requirement.organizationRequired === true && authContext.organizationId === undefined) {
    failedAttributes.push("organization");
  }

  if (
    requirement.organizationId !== undefined &&
    authContext.organizationId !== requirement.organizationId
  ) {
    failedAttributes.push("organization_scope");
  }

  return failedAttributes;
}

function evaluateMissingPermissions(
  authContext: AuthContext,
  requirement: AuthorizationRequirement,
): PlatformPermission[] {
  const permissions = requirement.permissions ?? [];

  if (permissions.length === 0) {
    return [];
  }

  if (requirement.permissionMode === "any") {
    return permissions.some((permission) => hasPlatformPermission(authContext, permission))
      ? []
      : [...permissions];
  }

  return permissions.filter((permission) => !hasPlatformPermission(authContext, permission));
}

function buildDeniedReason(
  failedAttributes: readonly string[],
  missingPermissions: readonly PlatformPermission[],
): string {
  if (failedAttributes.length > 0 && missingPermissions.length > 0) {
    return "authorization.denied.attributes_and_permissions";
  }

  if (failedAttributes.length > 0) {
    return "authorization.denied.attributes";
  }

  return "authorization.denied.permissions";
}
