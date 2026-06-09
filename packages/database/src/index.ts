import { createRequire } from "node:module";

export {
  type AuditJsonValue,
  type AuditRecordCreateDelegate,
  type AuditSeverity,
  type AuditTrailClient,
  type AuditTrailWriter,
  auditSeverities,
  type CreateAuditRecordFromTelemetryInput,
  type CreateAuditRecordInput,
  createAuditRecordFromTelemetry,
  createAuditTrailWriter,
  createPersistableAuditRecord,
  createPrismaMutationAuditRecord,
  type DatabaseActorType,
  databaseActorTypes,
  isPrismaMutationOperation,
  type PersistableAuditRecord,
  type PrismaMutationAuditInput,
  type PrismaMutationOperation,
  prismaMutationOperations,
  telemetryActorTypeToDatabaseActorType,
} from "./audit";
export {
  type RbacBootstrapClient,
  type RbacBootstrapPermissionKey,
  type RbacBootstrapRoleTemplate,
  rbacBootstrapPermissions,
  rbacBootstrapRoleTemplates,
  type SeedRbacBootstrapInput,
  type SeedRbacBootstrapResult,
  seedRbacBootstrap,
} from "./rbac-bootstrap";

const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client") as typeof import("@prisma/client");

export const databaseProvider = "postgresql" as const;

export const auditActions = [
  "auth.session.created",
  "auth.session.revoked",
  "identity.role.assigned",
  "identity.permission.changed",
  "tenant.organization.created",
  "tenant.membership.changed",
  "integration.api_key.created",
  "integration.api_key.rotated",
  "integration.event.received",
  "tracking.shipment.created",
  "tracking.event.recorded",
  "tracking.exception.managed",
  "tracking.exception.resolved",
  "tracking.exception.updated",
  "audit.record.created",
] as const;

export type AuditAction = (typeof auditActions)[number];

export const outboxEventStatuses = ["pending", "processing", "published", "failed"] as const;

export type OutboxEventStatus = (typeof outboxEventStatuses)[number];

type PrismaGlobal = typeof globalThis & {
  __saptmPrismaClient?: InstanceType<typeof PrismaClient>;
};

type RuntimeGlobal = typeof globalThis & {
  process?: {
    env?: Record<string, string | undefined>;
  };
};

function getRuntimeEnv() {
  return (globalThis as RuntimeGlobal).process?.env ?? {};
}

export function createPrismaClient() {
  const env = getRuntimeEnv();

  return new PrismaClient({
    log: env.NODE_ENV === "production" ? ["error"] : ["query", "warn", "error"],
  });
}

export function getPrismaClient() {
  const globalStore = globalThis as PrismaGlobal;

  if (!globalStore.__saptmPrismaClient) {
    globalStore.__saptmPrismaClient = createPrismaClient();
  }

  return globalStore.__saptmPrismaClient;
}

export type SaptmPrismaClient = ReturnType<typeof getPrismaClient>;
