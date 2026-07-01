import { AsyncLocalStorage } from "node:async_hooks";

/**
 * The value stored in the async local storage for the current tenant context.
 * Holds the organization ID to scope all database queries to.
 */
export type TenantContextValue = {
  organizationId: string;
};

/**
 * AsyncLocalStorage instance for tenant (organization) context.
 * Used by the Prisma tenant scoping extension to automatically inject
 * `organizationId` into all queries within the scope of a request.
 */
export const tenantContext = new AsyncLocalStorage<TenantContextValue>();

/**
 * Returns the current organization ID from the async local storage context.
 * Returns `undefined` if no tenant context is active (e.g., for unauthenticated
 * flows or operations that span organizations).
 */
export function getCurrentOrganizationId(): string | undefined {
  return tenantContext.getStore()?.organizationId;
}

/**
 * Runs a function within a tenant context.
 * All Prisma queries executed within `fn` will be automatically scoped
 * to the given `organizationId` by the tenant scoping middleware.
 *
 * @example
 * ```ts
 * const result = runWithTenantContext({ organizationId: "org_123" }, () => {
 *   return prisma.cargo.findMany(); // auto-scoped to org_123
 * });
 * ```
 */
export function runWithTenantContext<T>(value: TenantContextValue, fn: () => T): T {
  return tenantContext.run(value, fn);
}
