import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.js";
import { getCurrentOrganizationId } from "../tenant-context.js";

/**
 * Set of model names that do NOT have an `organizationId` field.
 * These models are excluded from automatic tenant scoping.
 *
 * Includes auth/internal models from Better Auth (User, Session, Account, etc.),
 * join tables (TeamMember, RolePermission, MembershipRole), and other
 * non-tenant-scoped entities (Permission, ApiKey, WebhookDelivery).
 */
const NON_TENANT_MODELS = new Set([
  "User",
  "TwoFactor",
  "Session",
  "Account",
  "Verification",
  "LoginAttempt",
  "TeamMember",
  "Permission",
  "RolePermission",
  "MembershipRole",
  "ApiKey",
  "WebhookDelivery",
  "Plan",
]);

/**
 * Operations that accept an arbitrary `where` clause (not a unique where).
 *
 * Operations like `findUnique`, `findUniqueOrThrow`, `update`, `delete`,
 * and `upsert` require a unique `where` input and adding `organizationId`
 * to them would either cause a runtime error (if `organizationId` is not
 * part of the unique constraint) or silently change semantics.
 *
 * `create` operations use `data`, not `where`.
 */
const SCOPED_OPERATIONS = new Set([
  "findMany",
  "findFirst",
  "findFirstOrThrow",
  "count",
  "aggregate",
  "updateMany",
  "deleteMany",
]);

function getRuntimeEnv() {
  return process.env as Record<string, string | undefined>;
}

/**
 * Creates a Prisma Client Extension that automatically injects `organizationId`
 * into all scoped queries based on the current tenant context.
 *
 * The extension reads the current organization ID from `AsyncLocalStorage`
 * (via `getCurrentOrganizationId()` from `tenant-context.ts`) and merges it
 * into the `where` clause of every scoped operation.
 *
 * Security properties:
 * - Skips models that don't have `organizationId` (auth models, join tables)
 * - Skips when no tenant context is active (health checks, auth flows)
 * - Does not override explicitly provided `organizationId`
 * - Does not apply to `findUnique`/`update`/`delete` (unique where) —
 *   those use the application service layer for access control
 */
const tenantScopingExtension = {
  query: {
    $allModels: {
      async $allOperations({
        args,
        query,
        model,
        operation,
      }: {
        args: unknown;
        query: (args: unknown) => Promise<unknown>;
        model: string;
        operation: string;
      }) {
        // 1. Skip models that don't belong to organizations
        if (NON_TENANT_MODELS.has(model)) {
          return query(args);
        }

        // 2. Skip if no tenant context is active
        //    (e.g., unauthenticated flows, health checks, auth operations)
        const organizationId = getCurrentOrganizationId();
        if (!organizationId) {
          return query(args);
        }

        // 3. Only scope operations that accept an arbitrary where clause
        if (!SCOPED_OPERATIONS.has(operation)) {
          return query(args);
        }

        // 4. If organizationId is already explicitly provided in where,
        //    don't override it (e.g., outbox-event-bus.ts already provides it)
        // The `args` type from Prisma is a complex union across all models;
        // we only access `where` which exists on the SCOPED_OPERATIONS above.
        type ArgsWithWhere = { where?: Record<string, unknown> };
        const operationArgs = args as ArgsWithWhere;

        if (operationArgs.where?.organizationId !== undefined) {
          return query(args);
        }

        // 5. Merge organizationId into where, preserving existing conditions
        return query({
          ...(args as Record<string, unknown>),
          where: {
            ...(operationArgs.where ?? {}),
            organizationId,
          },
        });
      },
    },
  },
};

export function createPrismaClient() {
  const env = getRuntimeEnv();
  const connectionString = env.DATABASE_URL ?? "";

  const adapter = new PrismaPg({ connectionString });

  const baseClient = new PrismaClient({
    adapter,
    log: env.NODE_ENV === "production" ? ["error"] : ["warn", "error"],
  });

  const extendedClient = baseClient.$extends(tenantScopingExtension);

  return extendedClient;
}

export function getPrismaClient() {
  const globalStore = globalThis as PrismaGlobal;

  if (!globalStore.__saptmPrismaClient) {
    globalStore.__saptmPrismaClient = createPrismaClient();
  }

  return globalStore.__saptmPrismaClient;
}

/**
 * The extended Prisma Client type with automatic tenant scoping.
 * All queries made through this client will be automatically scoped
 * to the current organization when a tenant context is active.
 */
export type SaptmPrismaClient = ReturnType<typeof createPrismaClient>;

/**
 * Prisma transaction client type for use in `$transaction` callbacks.
 *
 * The base `PrismaClient` type is compatible because the tenant scoping
 * extension only intercepts queries without adding or removing methods.
 * At runtime, the transaction client inherits the extension automatically
 * from the extended parent client.
 */
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type PrismaTx = PrismaClient;

type PrismaGlobal = typeof globalThis & {
  __saptmPrismaClient?: SaptmPrismaClient;
};
