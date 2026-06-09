import { parseServerEnv } from "@saptm/config";
import type {
  RuntimeEnvironment,
  RuntimeHealthCheck,
  RuntimeHealthReport,
  RuntimeHealthStatus,
} from "@saptm/types";

export const runtime = "nodejs";

const serviceName = "@saptm/web";

export function GET(): Response {
  const report = createHealthReport([checkEnvironment()]);

  return Response.json(report, {
    status: report.status === "ok" ? 200 : 503,
  });
}

function checkEnvironment(): RuntimeHealthCheck {
  const startedAt = Date.now();

  try {
    const env = parseServerEnv(process.env);

    return createHealthCheck({
      name: "environment",
      status: "ok",
      critical: true,
      startedAt,
      message: "Web runtime environment contract is valid.",
      details: {
        apiUrl: env.NEXT_PUBLIC_API_URL,
        appUrl: env.NEXT_PUBLIC_APP_URL,
        nodeEnv: env.NODE_ENV,
      },
    });
  } catch {
    return createHealthCheck({
      name: "environment",
      status: "down",
      critical: true,
      startedAt,
      message: "Web runtime environment contract is invalid.",
    });
  }
}

type HealthCheckInput = {
  name: string;
  status: RuntimeHealthStatus;
  critical: boolean;
  startedAt: number;
  message?: string;
  details?: Record<string, string | number | boolean | null>;
};

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
