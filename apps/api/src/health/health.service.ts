import { Injectable } from "@nestjs/common";
import { getServerEnv } from "@saptm/config";
import { getPrismaClient } from "@saptm/database";
import type {
  RuntimeEnvironment,
  RuntimeHealthCheck,
  RuntimeHealthDetails,
  RuntimeHealthReport,
  RuntimeHealthStatus,
} from "@saptm/types";

const serviceName = "@saptm/api";

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
    const checks = [this.checkEnvironment(), await this.checkDatabase()];

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
