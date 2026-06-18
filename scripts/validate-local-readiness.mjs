import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredFiles = [
  "apps/api/src/rpc/foundation-rpc.router.ts",
  "apps/api/src/rpc/rpc-http.middleware.ts",
  "apps/api/tests/rpc-foundation.test.mjs",
  "packages/rpc/src/foundation.ts",
  "packages/rpc/tests/foundation.test.mjs",
  "packages/auth/src/local-admin-seed.ts",
  "packages/database/prisma/seed.ts",
  "tests/e2e/authenticated-platform.spec.ts",
  "tests/e2e/runtime-health.spec.ts",
  "scripts/validate-local-readiness.mjs",
  "scripts/smoke-local-runtime.mjs",
  "compose.yaml",
  "playwright.config.ts",
];

const requiredRuntimeFiles = [
  "deploy/observability/alertmanager/alertmanager.yml",
  "deploy/observability/grafana/dashboards/saptm-runtime.json",
  "deploy/observability/grafana/provisioning/dashboards/dashboards.yml",
  "deploy/observability/grafana/provisioning/datasources/datasources.yml",
  "deploy/observability/otel-collector/config.yaml",
  "deploy/observability/prometheus/prometheus.yml",
  "deploy/observability/prometheus/rules/saptm-alerts.yml",
];

const requiredComposeServices = [
  "postgres:",
  "api:",
  "web:",
  "otel-collector:",
  "alertmanager:",
  "prometheus:",
  "grafana:",
];

const forbiddenBusinessRoutes = [
  "apps/web/app/(platform)/cargo",
  "apps/web/app/(platform)/cargas",
  "apps/web/app/(platform)/ports",
  "apps/web/app/(platform)/portos",
  "apps/web/app/(platform)/rail",
  "apps/web/app/(platform)/ferrovia",
  "apps/web/app/(platform)/analytics",
];

const missing = [...requiredFiles, ...requiredRuntimeFiles].filter(
  (file) => !existsSync(join(root, file)),
);

if (missing.length > 0) {
  fail("Missing local readiness files:", missing);
}

const rootPackage = readJson("package.json");
const turbo = readJson("turbo.json");
const authPackage = readJson("packages/auth/package.json");
const rpcPackage = readJson("packages/rpc/package.json");
const apiPackage = readJson("apps/api/package.json");
const compose = read("compose.yaml");
const apiFoundationRouter = read("apps/api/src/rpc/foundation-rpc.router.ts");
const apiRpcModule = read("apps/api/src/rpc/rpc.module.ts");
const runtimeE2e = read("tests/e2e/runtime-health.spec.ts");
const authenticatedE2e = read("tests/e2e/authenticated-platform.spec.ts");
const rpcIndex = read("packages/rpc/src/index.ts");
const localAdminSeed = read("packages/auth/src/local-admin-seed.ts");
const databaseSeed = read("packages/database/prisma/seed.ts");
const platformControlCenter = read("apps/web/app/(platform)/app/page.tsx");
const playwrightConfig = read("playwright.config.ts");

assertIncludes(
  rootPackage.scripts?.["validate:local-readiness"],
  "node scripts/validate-local-readiness.mjs",
  "Root package must expose validate:local-readiness.",
);

assertIncludes(
  rootPackage.scripts?.["validate:local-production"],
  "node scripts/run-local-production-validation.mjs",
  "Root package must expose validate:local-production.",
);

assertIncludes(
  rootPackage.scripts?.["smoke:local-runtime"],
  "node scripts/smoke-local-runtime.mjs",
  "Root package must expose smoke:local-runtime.",
);

assertIncludes(
  rootPackage.scripts?.["auth:seed-local-admin"],
  "pnpm --filter @saptm/auth seed:local-admin",
  "Root package must expose auth:seed-local-admin.",
);

if (rootPackage.scripts?.["test:e2e"]?.includes("--pass-with-no-tests")) {
  fail("test:e2e must not allow an empty E2E suite.", ["package.json"]);
}

assertIncludes(
  rootPackage.scripts?.lint,
  "scripts/validate-local-readiness.mjs",
  "Lint script must cover validate-local-readiness.",
);

assertIncludes(
  rootPackage.scripts?.format,
  "scripts/validate-local-readiness.mjs",
  "Format script must cover validate-local-readiness.",
);

if (!Array.isArray(turbo.tasks?.test?.dependsOn) || !turbo.tasks.test.dependsOn.includes("build")) {
  fail("Turbo test task must depend on package build before test execution.", ["turbo.json"]);
}

assertIncludes(rpcPackage.scripts?.test, "node --test", "@saptm/rpc must have real tests.");
assertIncludes(
  rpcPackage.scripts?.test,
  "tests/foundation.test.mjs",
  "@saptm/rpc test script must execute foundation RPC tests.",
);
assertIncludes(apiPackage.scripts?.test, "node --test", "@saptm/api must have real tests.");
assertIncludes(
  apiPackage.scripts?.test,
  "tests/rpc-foundation.test.mjs",
  "@saptm/api test script must execute foundation oRPC router tests.",
);
assertIncludes(
  authPackage.scripts?.["seed:local-admin"],
  "tsx src/local-admin-seed.ts",
  "@saptm/auth must expose the local admin seed task.",
);

assertIncludes(
  localAdminSeed,
  "local-admin-seed.refuses_production",
  "Local admin seed must refuse production execution.",
);
assertIncludes(
  localAdminSeed,
  "emailVerified: true",
  "Local admin seed must create a verified Better Auth user.",
);
assertIncludes(localAdminSeed, "tenant.admin", "Local admin seed must assign a tenant admin role.");
assertIncludes(
  databaseSeed,
  "local-demo-seed.refuses_production_without_explicit_opt_in",
  "Database seed must guard local demo data in production.",
);
assertIncludes(
  databaseSeed,
  "CGO-LOCAL-RAIL-001",
  "Database seed must include deterministic cargo demo data.",
);
assertIncludes(
  databaseSeed,
  "TRK-LOCAL-RAIL-001",
  "Database seed must include deterministic tracking demo data.",
);
assertIncludes(
  databaseSeed,
  "SLOT-LOCAL-SAT-001",
  "Database seed must include deterministic capacity demo data.",
);
assertIncludes(
  databaseSeed,
  "QUOTE-LOCAL-RAIL-001",
  "Database seed must include deterministic tariff quote demo data.",
);
assertIncludes(
  databaseSeed,
  "TO-LOCAL-RESCHEDULE-001",
  "Database seed must include deterministic planning reschedule demo data.",
);
assertIncludes(
  databaseSeed,
  "TO-LOCAL-CANCEL-001",
  "Database seed must include deterministic planning cancellation demo data.",
);
assertIncludes(
  authenticatedE2e,
  "auth:seed-local-admin",
  "Authenticated E2E must seed a real local admin.",
);
assertIncludes(
  authenticatedE2e,
  "db:seed",
  "Authenticated E2E must seed deterministic local business data.",
);
assertIncludes(
  authenticatedE2e,
  'startRuntime("api")',
  "Authenticated E2E must start the local API runtime.",
);
assertIncludes(
  authenticatedE2e,
  "e2e-planning-confirm-cap-004",
  "Authenticated E2E must submit a real planning confirmation command.",
);
assertIncludes(
  authenticatedE2e,
  "e2e-planning-reschedule-seeded-001",
  "Authenticated E2E must submit a real planning reschedule command.",
);
assertIncludes(
  authenticatedE2e,
  "e2e-planning-cancel-seeded-001",
  "Authenticated E2E must submit a real planning cancellation command.",
);
assertIncludes(
  authenticatedE2e,
  "e2e-planning-dispatch-seeded-001",
  "Authenticated E2E must submit a real planning dispatch command.",
);
assertIncludes(
  authenticatedE2e,
  "cargo-business-rules",
  "Authenticated E2E must cover cargo visual regression.",
);
assertIncludes(
  authenticatedE2e,
  "capacity-optimization-policy",
  "Authenticated E2E must cover capacity visual regression.",
);
assertIncludes(
  authenticatedE2e,
  "planning-post-dispatch-rules",
  "Authenticated E2E must cover planning visual regression.",
);
assertIncludes(
  authenticatedE2e,
  "tariff-security-rules",
  "Authenticated E2E must cover tariff visual regression.",
);
assertIncludes(
  playwrightConfig,
  "fullyParallel: false",
  "Playwright must run local runtime E2E serially to avoid port races.",
);

for (const service of requiredComposeServices) {
  assertIncludes(compose, service, `compose.yaml must include ${service} service.`);
}

assertIncludes(
  apiRpcModule,
  "RpcHttpMiddleware",
  "RpcModule must register the HTTP oRPC middleware.",
);
assertIncludes(
  apiRpcModule,
  "implements NestModule",
  "RpcModule must implement NestModule for middleware registration.",
);
assertIncludes(
  apiFoundationRouter,
  "foundationRpcRouter",
  "apps/api must expose the executable foundation router.",
);
assertIncludes(
  rpcIndex,
  "foundationRpcHealthOutputSchema",
  "@saptm/rpc must export the foundation health schema.",
);
assertIncludes(
  runtimeE2e,
  "startWebRuntime",
  "Runtime health E2E must start the local web runtime explicitly.",
);
assertIncludes(
  runtimeE2e,
  "stopProcessTree",
  "Runtime health E2E must stop the local web runtime process tree.",
);
assertIncludes(
  platformControlCenter,
  "getTrackingOverview",
  "Platform Control Center must use real tracking overview data when authorized.",
);
assertIncludes(
  platformControlCenter,
  "OperationsSnapshot",
  "Platform Control Center must render explicit authenticated data states.",
);
assertIncludes(
  platformControlCenter,
  "Dashboard operacional",
  "Platform Control Center must expose dashboard readiness as a governed state.",
);

if (existsSync(join(root, "apps/web/app/page.tsx"))) {
  const rootHomePage = read("apps/web/app/page.tsx");

  assertIncludes(
    rootHomePage,
    "getCurrentPlatformSession",
    "Root app page must remain a session-aware foundation redirect.",
  );
  assertIncludes(
    rootHomePage,
    "redirect(",
    "Root app page must redirect instead of rendering product UI.",
  );
}

for (const route of forbiddenBusinessRoutes) {
  if (existsSync(join(root, route))) {
    fail("Business route exists before business feature acceptance.", [route]);
  }
}

console.log("SAPTM local readiness validation passed: runtime, RPC, and E2E gates exist.");

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function readJson(path) {
  return JSON.parse(read(path));
}

function assertIncludes(value, expected, message) {
  if (typeof value !== "string" || !value.includes(expected)) {
    fail(message, [expected]);
  }
}

function fail(message, details) {
  console.error(message);
  for (const detail of details) {
    console.error(`- ${detail}`);
  }
  process.exit(1);
}
