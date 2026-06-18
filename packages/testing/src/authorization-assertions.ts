import type { AuthContext, AuthorizationDecision, AuthorizationRequirement } from "@saptm/auth";
import { evaluateAuthorization } from "@saptm/auth";

export function assertAuthorizationAllowed(
  authContext: AuthContext,
  requirement: AuthorizationRequirement = {},
): AuthorizationDecision {
  const decision = evaluateAuthorization(authContext, requirement);

  if (!decision.allowed) {
    throw new Error(`Expected authorization to be allowed, received ${decision.reason}`);
  }

  return decision;
}

export function assertAuthorizationDenied(
  authContext: AuthContext,
  requirement: AuthorizationRequirement = {},
  expectedReason?: string,
): AuthorizationDecision {
  const decision = evaluateAuthorization(authContext, requirement);

  if (decision.allowed) {
    throw new Error("Expected authorization to be denied, received authorization.allowed");
  }

  if (expectedReason !== undefined && decision.reason !== expectedReason) {
    throw new Error(
      `Expected authorization denial reason ${expectedReason}, received ${decision.reason}`,
    );
  }

  return decision;
}
