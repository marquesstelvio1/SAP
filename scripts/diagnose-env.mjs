import { env } from "node:process";

const REQUIRED = ["DATABASE_URL", "BETTER_AUTH_SECRET", "BETTER_AUTH_URL"];
const SERVER_VARS = [
  "NODE_ENV",
  "API_PORT",
  "API_CORS_ORIGINS",
  "DATABASE_URL",
  "DATABASE_POOL_SIZE",
  "REDIS_URL",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "SAPTM_INVITATION_TOKEN_TTL_HOURS",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_API_URL",
  "OTEL_SERVICE_NAME",
  "OTEL_EXPORTER_OTLP_ENDPOINT",
  "LOG_LEVEL",
  "RESEND_API_KEY",
  "EMAIL_FROM",
];

console.log("\n=== ENVIRONMENT VARIABLE DIAGNOSTIC ===\n");
console.log(`PID: ${process.pid}`);
console.log(`Node: ${process.version}`);
console.log(`Platform: ${process.platform}`);
console.log(`CWD: ${process.cwd()}`);
console.log(`NODE_ENV: ${env.NODE_ENV ?? "(not set)"}`);

console.log("\n--- Required vars ---");
let allOk = true;
for (const key of REQUIRED) {
  const value = env[key];
  const ok = typeof value === "string" && value.length > 0;
  if (!ok) allOk = false;
  console.log(`  ${key}: ${ok ? `✓ (${value.length} chars)` : "✗ MISSING"}`);
}

console.log("\n--- All server env vars ---");
for (const key of SERVER_VARS) {
  const value = env[key];
  const ok = typeof value === "string" && value.length > 0;
  console.log(
    `  ${key}: ${ok ? "✓" : "○ (not set, will use default or error)"}${ok ? ` (${value.length} chars)` : ""}`,
  );
}

console.log(
  allOk ? "\n✓ All required env vars are set." : "\n✗ Some required env vars are missing.",
);
process.exit(allOk ? 0 : 1);
