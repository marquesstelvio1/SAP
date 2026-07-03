import { Inject, Injectable } from "@nestjs/common";
import {
  type AuthContext,
  type CreateAuthContextInput,
  createAuthContext,
  enrichTraceContextWithAuth,
  resolveAuthContextFromBetterAuthSession,
} from "@saptm/auth";

import type { RequestWithAuthContext } from "./auth-context.js";
import { BetterAuthSessionService } from "./better-auth-session.service.js";
import { ServiceAccountAuthService } from "./service-account-auth.service.js";
import { UserAuthorizationService } from "./user-authorization.service.js";

const ORG_HEADER = "x-saptm-org-id" as const;

@Injectable()
export class AuthContextService {
  constructor(
    @Inject(BetterAuthSessionService)
    private readonly betterAuthSession: BetterAuthSessionService,
    @Inject(ServiceAccountAuthService)
    private readonly serviceAccountAuth: ServiceAccountAuthService,
    @Inject(UserAuthorizationService)
    private readonly userAuthorization: UserAuthorizationService,
  ) {}

  createContext(input: CreateAuthContextInput): AuthContext {
    return createAuthContext(input);
  }

  async resolveSessionContext(request: RequestWithAuthContext): Promise<AuthContext | undefined> {
    if (request.authContext || !request.traceContext) {
      return request.authContext;
    }

    const authContext = await resolveAuthContextFromBetterAuthSession({
      getSession: this.betterAuthSession.getSession.bind(this.betterAuthSession),
      headers: createCookieHeaders(request.headers),
      traceContext: request.traceContext,
      disableCookieCache: true,
      disableRefresh: true,
    });

    if (!authContext) {
      return undefined;
    }

    if (authContext.userId === undefined) {
      return this.attachContext(request, authContext);
    }

    // Check for org context switching via x-saptm-org-id header
    const orgHeader = readHeader(request.headers, ORG_HEADER);

    let organizationIdHint: string | undefined;

    if (orgHeader) {
      const hasAccess = await this.userAuthorization.verifyUserOrganizationAccess(
        authContext.userId,
        orgHeader,
      );

      if (hasAccess) {
        organizationIdHint = orgHeader;
      } else {
        console.warn(
          `[AUTH] User ${authContext.userId} attempted to switch to org ${orgHeader} ` +
            `but has no active membership — falling back to default. ` +
            `correlationId=${request.traceContext?.correlationId}`,
        );
      }
    }

    const authorization = organizationIdHint
      ? await this.userAuthorization.resolveOrganizationAuthorization(
          authContext.userId,
          organizationIdHint,
        )
      : await this.userAuthorization.resolveDefaultUserAuthorization(authContext.userId);

    if (authorization.permissions.length === 0) {
      console.warn(
        `[AUTH] User ${authContext.userId} has zero permissions — ` +
          `no active membership with role assignments found. ` +
          `correlationId=${request.traceContext?.correlationId}`,
      );
    }

    return this.attachContext(request, {
      ...authContext,
      permissions: authorization.permissions,
      ...(authorization.organizationId === undefined
        ? {}
        : { organizationId: authorization.organizationId }),
    });
  }

  async resolveRequestContext(request: RequestWithAuthContext): Promise<AuthContext | undefined> {
    if (request.authContext) {
      return request.authContext;
    }

    const serviceAccountContext = await this.serviceAccountAuth.resolveContext(request);

    if (serviceAccountContext) {
      return this.attachContext(request, serviceAccountContext);
    }

    return this.resolveSessionContext(request);
  }

  attachContext(request: RequestWithAuthContext, authContext: AuthContext): AuthContext {
    request.authContext = authContext;

    if (request.traceContext) {
      request.traceContext = enrichTraceContextWithAuth(request.traceContext, authContext);
    }

    return authContext;
  }

  synchronizeTraceContext(request: RequestWithAuthContext): void {
    if (!request.authContext || !request.traceContext) {
      return;
    }

    request.traceContext = enrichTraceContextWithAuth(request.traceContext, request.authContext);
  }
}

function createCookieHeaders(headers: RequestWithAuthContext["headers"]): Headers {
  const cookieHeader = readHeader(headers, "cookie");
  const sessionHeaders = new Headers();

  if (cookieHeader !== undefined) {
    sessionHeaders.set("cookie", cookieHeader);
  }

  return sessionHeaders;
}

function readHeader(
  headers: RequestWithAuthContext["headers"] = {},
  name: string,
): string | undefined {
  const value = headers[name] ?? headers[name.toLowerCase()] ?? headers[name.toUpperCase()];

  if (Array.isArray(value)) {
    return value.at(0);
  }

  return value;
}
