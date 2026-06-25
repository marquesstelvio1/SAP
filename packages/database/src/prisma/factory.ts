import { createRequire } from "node:module";
import { PrismaPg } from "@prisma/adapter-pg";
import type { PrismaClient } from "../../generated/prisma/client";
import { createTenantScopingExtension } from "../tenant-scoping.js";

export type SaptmPrismaClient = ReturnType<typeof createPrismaClient>;

export type PrismaTx = SaptmPrismaClient;

let _require: ReturnType<typeof createRequire> | undefined;

function getCjsRequire() {
  if (!_require) {
    _require = createRequire(import.meta.url);
  }
  return _require;
}

export function createPrismaClient(poolSize?: number) {
  const { PrismaClient: PrismaClientClass } = getCjsRequire()("../../generated/prisma/client") as {
    PrismaClient: typeof PrismaClient;
  };
  const env = getRuntimeEnv();
  const connectionString = env.DATABASE_URL ?? "";

  const adapter = new PrismaPg({
    connectionString,
    max: poolSize ?? getDefaultPoolSize(),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

  const baseClient = new PrismaClientClass({
    adapter,
    log: env.NODE_ENV === "production" ? ["error"] : ["query", "warn", "error"],
  }) as PrismaClient;

  // Apply the tenant scoping extension for automatic organization scoping.
  // This is a defense-in-depth measure that injects organizationId from
  // the AsyncLocalStorage context into all queries on scoped models.
  // The type assertion is required because Prisma v7 $extends returns a
  // complex mapped type that doesn't perfectly align with PrismaClient.
  return baseClient.$extends(createTenantScopingExtension()) as unknown as PrismaClient;
}

export function getPrismaClient() {
  const globalStore = globalThis as PrismaGlobal;

  if (!globalStore.__saptmPrismaClient) {
    globalStore.__saptmPrismaClient = createPrismaClient();
  }

  return globalStore.__saptmPrismaClient;
}

type PrismaGlobal = typeof globalThis & {
  __saptmPrismaClient?: PrismaClient;
};

type RuntimeGlobal = typeof globalThis & {
  process?: {
    env?: Record<string, string | undefined>;
  };
};

function getRuntimeEnv() {
  return (globalThis as RuntimeGlobal).process?.env ?? {};
}

function getDefaultPoolSize(): number {
  const env = getRuntimeEnv();
  const configured = env.DATABASE_POOL_SIZE;
  if (configured !== undefined) {
    const parsed = Number(configured);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return 10;
}
