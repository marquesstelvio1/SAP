import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "saptm.auth.isPublic";

/**
 * Marks a route as publicly accessible, bypassing the global AuthorizationGuard.
 *
 * Routes marked with @Public() will NOT require authentication or authorization.
 * Use this only for endpoints that are intentionally accessible without a session
 * (e.g., health checks, public metadata, CSP violation reports).
 *
 * For endpoints that need authentication but not specific permissions,
 * combine @Public() with @UseGuards(SessionRequiredGuard).
 *
 * @example
 * ```ts
 * @Public()
 * @Get("health")
 * health() { return { ok: true }; }
 * ```
 */
export function Public() {
  return SetMetadata(IS_PUBLIC_KEY, true);
}
