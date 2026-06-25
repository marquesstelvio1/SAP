import { UnauthorizedException } from "@nestjs/common";
import type { AuthContext } from "@saptm/auth";
import type { TraceContext } from "@saptm/observability";

export type { AuthContext };

export type RequestWithAuthContext = {
  authContext?: AuthContext;
  authResolutionError?: unknown;
  headers?: Record<string, string | string[] | undefined>;
  traceContext?: TraceContext;
};

export function getRequiredAuthContext(request: RequestWithAuthContext): AuthContext {
  if (!request.authContext) {
    throw new UnauthorizedException("Authenticated request context is required.");
  }

  return request.authContext;
}
