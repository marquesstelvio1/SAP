export const runtimeEnvironments = ["development", "test", "production"] as const;
export const runtimeHealthStatuses = ["ok", "degraded", "down"] as const;

export type RuntimeEnvironment = (typeof runtimeEnvironments)[number];
export type RuntimeHealthStatus = (typeof runtimeHealthStatuses)[number];
export type RuntimeHealthDetail = string | number | boolean | null;
export type RuntimeHealthDetails = Record<string, RuntimeHealthDetail>;

export type RuntimeHealthCheck = {
  name: string;
  status: RuntimeHealthStatus;
  critical: boolean;
  checkedAt: string;
  latencyMs: number;
  message?: string;
  details?: RuntimeHealthDetails;
};

export type RuntimeHealthReport = {
  serviceName: string;
  environment: RuntimeEnvironment;
  status: RuntimeHealthStatus;
  checkedAt: string;
  uptimeSeconds: number;
  checks: RuntimeHealthCheck[];
};
