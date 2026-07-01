import { getCurrentOrganizationId } from "./tenant-context.js";

/**
 * Set of Prisma model names that have a required `organizationId` field.
 *
 * These models will be automatically scoped to the current organization
 * context when the tenant scoping extension is active.
 *
 * Models EXCLUDED from this list:
 * - `AuditRecord` — `organizationId` is optional, allows system-level audits
 * - `OutboxEvent` — `organizationId` is optional, allows system-level events
 * - `Organization` — the organizational entity itself (no self-reference)
 * - `User`, `Session`, `Account`, `Verification`, `TwoFactor` — auth models, no organizationId
 * - `Role` — `organizationId` is optional
 * - `Permission`, `RolePermission`, `MembershipRole` — no orgId (join/permission tables)
 * - `ApiKey` — no direct orgId, linked via `ServiceAccount`
 * - `WebhookDelivery` — no direct orgId, linked via `WebhookEndpoint`
 */
const TENANT_SCOPED_MODELS = new Set([
  "Membership",
  "ServiceAccount",
  "IntegrationEvent",
  "Notification",
  "Cargo",
  "CargoDeliveryException",
  "CargoClaimSettlement",
  "CargoOperationalHandoff",
  "CargoComplianceEvidence",
  "CapacityResource",
  "CapacitySlot",
  "CapacitySlotReservation",
  "CapacityAdvisoryDecision",
  "TransportOrder",
  "TransportOrderDispatch",
  "TransportOrderScheduleRevision",
  "TariffRateCard",
  "TariffRateRule",
  "TariffQuote",
  "TrackingShipment",
  "TrackingEvent",
  "Subscription",
  "Invoice",
  "UsageRecord",
  "WebhookEndpoint",
  "Team",
  "TeamMember",
]);

/**
 * Categorizes a Prisma operation into a kind for tenant scoping logic.
 */
type OperationKind = "read" | "write" | "update" | "upsert" | "delete" | "skip";

function getOperationKind(operation: string): OperationKind {
  switch (operation) {
    // Read operations: inject orgId into where clause
    case "findFirst":
    case "findFirstOrThrow":
    case "findMany":
    case "count":
    case "aggregate":
    case "groupBy":
      return "read";

    // findUnique/findUniqueOrThrow: cannot inject orgId into where
    // because where is restricted to unique constraint fields
    case "findUnique":
    case "findUniqueOrThrow":
      return "skip";

    // Create operations: inject orgId into data
    case "create":
    case "createMany":
      return "write";

    // Update operations: inject orgId into where
    case "update":
    case "updateMany":
      return "update";

    // Upsert: inject orgId into where and create
    case "upsert":
      return "upsert";

    // Delete operations: inject orgId into where
    case "delete":
    case "deleteMany":
      return "delete";

    default:
      return "skip";
  }
}

/**
 * Creates a Prisma client extension that automatically scopes all queries
 * to the organization ID from the current tenant context (AsyncLocalStorage).
 *
 * This is a **defense-in-depth** measure. It prevents accidental cross-tenant
 * data access even if a developer forgets to manually add `organizationId`
 * to a query filter. All repositories should still explicitly scope their
 * queries — this middleware is the last line of defense.
 *
 * @example
 * ```ts
 * import { PrismaClient } from "../generated/prisma/client";
 * import { createTenantScopingExtension } from "./tenant-scoping";
 *
 * const prisma = new PrismaClient({ adapter }).$extends(
 *   createTenantScopingExtension(),
 * );
 * ```
 */
export function createTenantScopingExtension() {
  return {
    query: {
      $allModels: {
        async $allOperations({
          model,
          operation,
          args,
          query,
        }: {
          model: string;
          operation: string;
          args: Record<string, unknown>;
          query: (args: Record<string, unknown>) => Promise<unknown>;
        }): Promise<unknown> {
          // Only apply to models that have an organizationId field
          if (!TENANT_SCOPED_MODELS.has(model)) {
            return query(args);
          }

          const orgId = getCurrentOrganizationId();

          // No tenant context active — let the query pass through.
          // The application layer should still enforce org scoping
          // for authenticated requests.
          if (orgId === undefined) {
            return query(args);
          }

          const kind = getOperationKind(operation);

          switch (kind) {
            case "read":
            case "delete": {
              // Inject organizationId into the where clause
              const where = (args.where as Record<string, unknown> | undefined) ?? {};
              args.where = { ...where, organizationId: orgId } as Record<string, unknown>;
              break;
            }

            case "update": {
              // Inject organizationId into the where clause
              const where = (args.where as Record<string, unknown> | undefined) ?? {};
              args.where = { ...where, organizationId: orgId } as Record<string, unknown>;
              break;
            }

            case "upsert": {
              // Inject organizationId into the where clause
              const where = (args.where as Record<string, unknown> | undefined) ?? {};
              args.where = { ...where, organizationId: orgId } as Record<string, unknown>;

              // Inject organizationId into the create data
              const create = (args.create as Record<string, unknown> | undefined) ?? {};
              args.create = { ...create, organizationId: orgId } as Record<string, unknown>;
              break;
            }

            case "write": {
              // Inject organizationId into the data payload
              const data = args.data;
              if (Array.isArray(data)) {
                args.data = data.map(
                  (d) =>
                    ({ ...(d as Record<string, unknown>), organizationId: orgId }) as Record<
                      string,
                      unknown
                    >,
                );
              } else if (typeof data === "object" && data !== null) {
                args.data = {
                  ...(data as Record<string, unknown>),
                  organizationId: orgId,
                } as Record<string, unknown>;
              }
              break;
            }

            case "skip": {
              // findUnique/findUniqueOrThrow cannot accept organizationId in where
              // because where is restricted to unique constraint fields.
              // Instead, verify the result belongs to the current organization.
              const result = await query(args);

              if (
                result !== null &&
                typeof result === "object" &&
                "organizationId" in (result as Record<string, unknown>)
              ) {
                const recordOrgId = (result as Record<string, unknown>).organizationId;
                if (recordOrgId !== orgId) {
                  return null;
                }
              }

              return result;
            }
          }

          return query(args);
        },
      },
    },
  } as const;
}
