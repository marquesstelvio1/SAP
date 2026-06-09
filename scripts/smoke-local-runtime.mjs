import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const apiUrl = normalizeUrl(
  process.env.SAPTM_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
);
const webUrl = normalizeUrl(
  process.env.SAPTM_WEB_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
);
const apiHealthUrl = new URL("/health/ready", apiUrl).toString();
const webHealthUrl = new URL("/api/health", webUrl).toString();
const startupTimeoutMs = Number.parseInt(process.env.SMOKE_STARTUP_TIMEOUT_MS ?? "90000", 10);
const maxCapturedLogLength = 16_000;
const shutdownTimeoutMs = 10_000;
const startedProcesses = [];
const processLogs = new Map();
let failed = false;

process.env.SAPTM_API_URL = apiUrl;
process.env.SAPTM_WEB_URL = webUrl;
process.env.NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL ?? apiUrl;
process.env.NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? webUrl;

try {
  if (!(await isRuntimeHealthy(apiHealthUrl, "@saptm/api"))) {
    const apiProcess = startRuntimeProcess("api", createApiCommand());
    startedProcesses.push(apiProcess);
    await waitForRuntimeHealth("api", apiHealthUrl, "@saptm/api");
  }

  if (!(await isRuntimeHealthy(webHealthUrl, "@saptm/web"))) {
    const webProcess = startRuntimeProcess("web", createWebCommand());
    startedProcesses.push(webProcess);
    await waitForRuntimeHealth("web", webHealthUrl, "@saptm/web");
  }

  await import("./smoke-runtime.mjs");
} catch (error) {
  failed = true;
  console.error(error);
} finally {
  try {
    await Promise.race([stopStartedProcesses(), delay(shutdownTimeoutMs)]);
  } catch (error) {
    failed = true;
    console.error(error);
  }

  process.exit(failed ? 1 : 0);
}

function startRuntimeProcess(name, commandLine) {
  const isWindows = process.platform === "win32";
  const runtime = spawn(
    isWindows ? "cmd.exe" : "sh",
    isWindows ? ["/d", "/s", "/c", commandLine] : ["-lc", commandLine],
    {
      cwd: process.cwd(),
      detached: !isWindows,
      env: createRuntimeEnv(),
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    },
  );

  processLogs.set(name, "");
  runtime.stdout?.on("data", (chunk) => captureRuntimeLog(name, chunk));
  runtime.stderr?.on("data", (chunk) => captureRuntimeLog(name, chunk));

  return { name, runtime };
}

function createRuntimeEnv() {
  return {
    ...process.env,
    API_CORS_ORIGINS: process.env.API_CORS_ORIGINS ?? webUrl,
    API_PORT: process.env.API_PORT ?? readPort(apiUrl, "4000"),
    BETTER_AUTH_SECRET:
      process.env.BETTER_AUTH_SECRET ?? "local-better-auth-secret-for-smoke-validation-only",
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? webUrl,
    DATABASE_URL:
      process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:25432/saptm",
    FORCE_COLOR: "0",
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? apiUrl,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? webUrl,
    NEXT_TELEMETRY_DISABLED: "1",
    REDIS_URL: process.env.REDIS_URL ?? "redis://127.0.0.1:26379",
    SAPTM_API_URL: apiUrl,
    SAPTM_WEB_URL: webUrl,
    TURBO_TELEMETRY_DISABLED: "1",
  };
}

function createApiCommand() {
  const packageManager = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

  return `${packageManager} --filter @saptm/api dev`;
}

function createWebCommand() {
  const packageManager = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  const webRuntimeUrl = new URL(webUrl);
  const hostname = webRuntimeUrl.hostname === "localhost" ? "127.0.0.1" : webRuntimeUrl.hostname;

  return `${packageManager} --filter @saptm/web dev --hostname ${hostname} --port ${readPort(webUrl, "3000")}`;
}

async function waitForRuntimeHealth(name, url, expectedServiceName) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < startupTimeoutMs) {
    const processInfo = startedProcesses.find((entry) => entry.name === name);

    if (processInfo?.runtime.exitCode !== null && processInfo?.runtime.exitCode !== undefined) {
      throw new Error(`${name} runtime exited before readiness.\n${processLogs.get(name) ?? ""}`);
    }

    if (await isRuntimeHealthy(url, expectedServiceName)) {
      return;
    }

    await delay(1_000);
  }

  throw new Error(
    `${name} runtime did not become healthy within ${startupTimeoutMs}ms.\n${
      processLogs.get(name) ?? ""
    }`,
  );
}

async function isRuntimeHealthy(url, expectedServiceName) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      return false;
    }

    const body = await response.json();

    return body.serviceName === expectedServiceName && body.status === "ok";
  } catch {
    return false;
  }
}

async function stopStartedProcesses() {
  for (const processInfo of [...startedProcesses].reverse()) {
    await stopProcessTree(processInfo.runtime);
  }
}

async function stopProcessTree(runtime) {
  if (runtime.pid === undefined || runtime.exitCode !== null || runtime.signalCode !== null) {
    return;
  }

  if (process.platform === "win32") {
    await new Promise((resolve) => {
      const killer = spawn("taskkill", ["/pid", String(runtime.pid), "/t", "/f"], {
        stdio: "ignore",
        windowsHide: true,
      });
      const timeout = setTimeout(() => {
        killer.kill("SIGKILL");
        resolve();
      }, 5_000);
      const finish = () => {
        clearTimeout(timeout);
        resolve();
      };

      killer.once("error", finish);
      killer.once("close", finish);
    });
  } else {
    try {
      process.kill(-runtime.pid, "SIGTERM");
    } catch {
      try {
        process.kill(runtime.pid, "SIGTERM");
      } catch {
        return;
      }
    }
  }

  runtime.stdout?.destroy();
  runtime.stderr?.destroy();
  await waitForRuntimeExit(runtime);
}

function waitForRuntimeExit(runtime) {
  if (runtime.exitCode !== null || runtime.signalCode !== null) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(resolve, 5_000);

    runtime.once("close", () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

function captureRuntimeLog(name, chunk) {
  const nextLog = `${processLogs.get(name) ?? ""}${chunk.toString()}`;

  processLogs.set(
    name,
    nextLog.length > maxCapturedLogLength ? nextLog.slice(-maxCapturedLogLength) : nextLog,
  );
}

function normalizeUrl(value) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function readPort(value, fallback) {
  return new URL(value).port || fallback;
}
