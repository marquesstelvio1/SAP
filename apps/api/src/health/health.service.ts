import { Injectable } from "@nestjs/common";
import { getServerEnv } from "@saptm/config";
import { getPrismaClient } from "@saptm/database";
import { createConsoleLogger, createTraceContext } from "@saptm/observability";
import type {
  RuntimeEnvironment,
  RuntimeHealthCheck,
  RuntimeHealthDetails,
  RuntimeHealthReport,
  RuntimeHealthStatus,
} from "@saptm/types";
// biome-ignore lint/style/useImportType: NestJS DI needs runtime class reference
import { CacheService } from "../cache/cache.service.js";

const serviceName = "@saptm/api";

const healthLogger = createConsoleLogger({
  serviceName,
  environment:
    process.env.NODE_ENV === "production"
      ? "production"
      : process.env.NODE_ENV === "test"
        ? "test"
        : "development",
  defaultContext: createTraceContext({
    operationName: "health.check",
    sourceSystem: "apps/api",
  }),
  minimumLevel: "info",
});

type HealthCheckInput = {
  name: string;
  status: RuntimeHealthStatus;
  critical: boolean;
  startedAt: number;
  message?: string;
  details?: RuntimeHealthDetails;
};

@Injectable()
export class HealthService {
  constructor(private readonly cacheService: CacheService) {}

  getLiveness(): RuntimeHealthReport {
    return createHealthReport([
      createHealthCheck({
        name: "process",
        status: "ok",
        critical: true,
        startedAt: Date.now(),
        message: "API process is accepting requests.",
      }),
    ]);
  }

  async getReadiness(): Promise<RuntimeHealthReport> {
    const checks = [
      this.checkEnvironment(),
      await this.checkDatabase(),
      await this.checkRedis(),
      await this.checkRbac(),
    ];

    return createHealthReport(checks);
  }

  private checkEnvironment(): RuntimeHealthCheck {
    const startedAt = Date.now();

    try {
      const env = getServerEnv();

      return createHealthCheck({
        name: "environment",
        status: "ok",
        critical: true,
        startedAt,
        message: "Runtime environment contract is valid.",
        details: {
          corsOrigins: env.API_CORS_ORIGINS.length,
          nodeEnv: env.NODE_ENV,
        },
      });
    } catch {
      return createHealthCheck({
        name: "environment",
        status: "down",
        critical: true,
        startedAt,
        message: "Runtime environment contract is invalid.",
      });
    }
  }

  private async checkDatabase(): Promise<RuntimeHealthCheck> {
    const startedAt = Date.now();

    try {
      await getPrismaClient().$queryRaw`SELECT 1`;

      return createHealthCheck({
        name: "database",
        status: "ok",
        critical: true,
        startedAt,
        message: "PostgreSQL connection is ready.",
      });
    } catch {
      return createHealthCheck({
        name: "database",
        status: "down",
        critical: true,
        startedAt,
        message: "PostgreSQL connection is not ready.",
      });
    }
  }

  private async checkRedis(): Promise<RuntimeHealthCheck> {
    const startedAt = Date.now();

    try {
      await this.cacheService.set("health:ping", "pong", 5_000);
      const result = await this.cacheService.get<string>("health:ping");

      if (result !== "pong") {
        return createHealthCheck({
          name: "cache",
          status: "degraded",
          critical: false,
          startedAt,
          message: "Cache read/write mismatch.",
        });
      }

      return createHealthCheck({
        name: "cache",
        status: "ok",
        critical: false,
        startedAt,
        message: "Redis connection is ready.",
      });
    } catch (e) {
      const message = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
      healthLogger.error("Health check cache error.", { attributes: { message } });
      return createHealthCheck({
        name: "cache",
        status: "degraded",
        critical: false,
        startedAt,
        message: `Redis connection is not available (cache degraded): ${message}`,
      });
    }
  }

  private async checkRbac(): Promise<RuntimeHealthCheck> {
    const startedAt = Date.now();

    try {
      const prisma = getPrismaClient();
      const [permissionCount, roleCount] = await Promise.all([
        prisma.permission.count() as Promise<number>,
        prisma.role.count() as Promise<number>,
      ]);
      const seeded = permissionCount > 0 && roleCount > 0;

      return createHealthCheck({
        name: "rbac",
        status: seeded ? "ok" : "degraded",
        critical: false,
        startedAt,
        message: seeded
          ? "RBAC permissions and roles are seeded."
          : "RBAC is not seeded — permissions and roles missing.",
        details: {
          seeded,
          permissions: permissionCount,
          roles: roleCount,
        },
      });
    } catch (e) {
      const message = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
      healthLogger.error("Health check RBAC error.", { attributes: { message } });
      return createHealthCheck({
        name: "rbac",
        status: "degraded",
        critical: false,
        startedAt,
        message: `RBAC check failed: ${message}`,
      });
    }
  }
}

function createHealthReport(checks: RuntimeHealthCheck[]): RuntimeHealthReport {
  return {
    serviceName,
    environment: readRuntimeEnvironment(),
    status: aggregateStatus(checks),
    checkedAt: new Date().toISOString(),
    uptimeSeconds: Math.round(readProcessUptimeSeconds()),
    checks,
  };
}

function createHealthCheck(input: HealthCheckInput): RuntimeHealthCheck {
  const check: RuntimeHealthCheck = {
    name: input.name,
    status: input.status,
    critical: input.critical,
    checkedAt: new Date().toISOString(),
    latencyMs: Date.now() - input.startedAt,
  };

  if (input.message !== undefined) {
    check.message = input.message;
  }

  if (input.details !== undefined) {
    check.details = input.details;
  }

  return check;
}

function aggregateStatus(checks: RuntimeHealthCheck[]): RuntimeHealthStatus {
  if (checks.some((check) => check.critical && check.status === "down")) {
    return "down";
  }

  if (checks.some((check) => check.status === "down" || check.status === "degraded")) {
    return "degraded";
  }

  return "ok";
}

function readRuntimeEnvironment(): RuntimeEnvironment {
  if (process.env.NODE_ENV === "production" || process.env.NODE_ENV === "test") {
    return process.env.NODE_ENV;
  }

  return "development";
}

function readProcessUptimeSeconds(): number {
  return typeof process.uptime === "function" ? process.uptime() : 0;
}
