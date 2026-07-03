import { UnauthorizedException } from "@nestjs/common";
import type { AuthContext } from "@saptm/auth";
import type { TraceContext } from "@saptm/observability";

export type { AuthContext };

export type RequestWithAuthContext = {
  authContext?: AuthContext;
  authResolutionError?: unknown;
  url?: string;
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  traceContext?: TraceContext;
  ip?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function getAuthContextFromRequest(
  request: Record<string, unknown>,
): AuthContext | undefined {
  const authContext = request.authContext;
  if (!isRecord(authContext)) {
    return undefined;
  }
  return authContext as AuthContext;
}

export function getRequiredAuthContext(request: RequestWithAuthContext): AuthContext {
  if (!request.authContext) {
    throw new UnauthorizedException("Authenticated request context is required.");
  }

  return request.authContext;
}
