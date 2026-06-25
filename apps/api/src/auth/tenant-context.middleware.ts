import { Injectable, type NestMiddleware } from "@nestjs/common";
import { runWithTenantContext } from "@saptm/database";

import type { RequestWithAuthContext } from "./auth-context.js";

type NextFunction = () => void;

/**
 * Middleware that establishes the tenant (organization) context in AsyncLocalStorage
 * for all downstream database operations.
 *
 * This must run AFTER `AuthContextMiddleware` so that `request.authContext` is
 * already resolved. The tenant context is used by the Prisma tenant scoping
 * extension to automatically inject `organizationId` into all queries.
 *
 * If no organization ID is available (unauthenticated or cross-tenant requests),
 * the middleware simply passes through — the application layer is still responsible
 * for enforcing org scoping on authenticated endpoints.
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  async use(
    request: RequestWithAuthContext,
    _response: unknown,
    next: NextFunction,
  ): Promise<void> {
    const organizationId = request.authContext?.organizationId;

    if (organizationId === undefined) {
      next();
      return;
    }

    // Run the rest of the request pipeline within the tenant context.
    // AsyncLocalStorage ensures that all async operations (Prisma queries)
    // inherit this context automatically.
    runWithTenantContext({ organizationId }, () => {
      next();
    });
  }
}
