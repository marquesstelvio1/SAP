import { type ChildProcess, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";
import { expect, type Page, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_RUNTIME_BASE_URL ?? "http://localhost:3101";
const healthUrl = new URL("/api/health", baseUrl).toString();
const runtimeUrl = new URL(baseUrl);
const runtimeHostname = runtimeUrl.hostname === "localhost" ? "127.0.0.1" : runtimeUrl.hostname;
const runtimePort = runtimeUrl.port || "3000";
const signInUrl = new URL("/sign-in", baseUrl).toString();
const startupTimeoutMs = 120_000;
const navigationTimeoutMs = 45_000;
const httpProbeTimeoutMs = 10_000;
const maxCapturedLogLength = 12_000;
const runtimeShutdownTimeoutMs = 30_000;
const webNextDevLockPath = "apps/web/.next/dev/lock";

let webRuntime: ChildProcess | undefined;
let webRuntimeLogs = "";

test.describe.configure({ mode: "serial" });
test.setTimeout(180_000);
test.use({ baseURL: baseUrl });

test.beforeAll(async () => {
  if (process.env.PLAYWRIGHT_SKIP_WEB_SERVER === "1") {
    return;
  }

  if (await isWebRuntimeHealthy()) {
    await waitForWebRuntimeReadiness();
    return;
  }

  await stopWindowsListeningPortProcesses(runtimePort);
  await waitForNextDevLockRelease();
  webRuntime = startWebRuntime();
  await waitForWebRuntimeHealth();
  await waitForWebRuntimeReadiness();
});

test.afterAll(async () => {
  if (webRuntime !== undefined) {
    await stopProcessTree(webRuntime);
    await stopWindowsListeningPortProcesses(runtimePort);
    await waitForNextDevLockRelease();
  }
});

test("web runtime health endpoint returns a valid report", async ({ request }) => {
  const response = await request.get("/api/health", { timeout: navigationTimeoutMs });
  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body).toMatchObject({
    serviceName: "@saptm/web",
    status: "ok",
  });
  expect(body.checks).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: "environment",
        status: "ok",
        critical: true,
      }),
    ]),
  );
});

test("sign-in page renders the authenticated shell entry point", async ({ page }) => {
  await gotoRuntimePage(page, "/sign-in");

  await expect(
    page.getByRole("heading", { name: /Acesso seguro antes de qualquer/i }),
  ).toBeVisible();
  await expect(page.getByLabel(/Email corporativo/i)).toBeVisible();
  await expect(page.getByLabel(/Password/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /^Entrar$/i })).toBeVisible();
});

test("invitation acceptance page handles missing tokens safely", async ({ page }) => {
  await gotoRuntimePage(page, "/accept-invitation");

  await expect(page.getByRole("heading", { name: /Convite indisponivel/i })).toBeVisible();
  await expect(page.getByText(/Token ausente/i)).toBeVisible();
});

test("sign-in page visual regression remains stable", async ({ page }) => {
  await gotoRuntimePage(page, "/sign-in");

  await expect(
    page.getByRole("heading", { name: /Acesso seguro antes de qualquer/i }),
  ).toBeVisible();
  await expect(page).toHaveScreenshot("sign-in-page.png", {
    animations: "disabled",
    caret: "hide",
    fullPage: true,
    maxDiffPixelRatio: 0.02,
  });
});

test("protected app shell redirects anonymous users to sign-in", async ({ page }) => {
  await gotoRuntimePage(page, "/app");

  await expect(page).toHaveURL(/\/sign-in\?next=%2Fapp/);
  await expect(
    page.getByRole("heading", { name: /Acesso seguro antes de qualquer/i }),
  ).toBeVisible();
});

test("protected tracking shell redirects anonymous users to sign-in", async ({ page }) => {
  await gotoRuntimePage(page, "/app/tracking");

  await expect(page).toHaveURL(/\/sign-in\?next=%2Fapp%2Ftracking/);
  await expect(
    page.getByRole("heading", { name: /Acesso seguro antes de qualquer/i }),
  ).toBeVisible();
});

test("protected cargo shell redirects anonymous users to sign-in", async ({ page }) => {
  await gotoRuntimePage(page, "/app/cargo");

  await expect(page).toHaveURL(/\/sign-in\?next=%2Fapp%2Fcargo/);
  await expect(
    page.getByRole("heading", { name: /Acesso seguro antes de qualquer/i }),
  ).toBeVisible();
});

test("protected capacity shell redirects anonymous users to sign-in", async ({ page }) => {
  await gotoRuntimePage(page, "/app/capacity");

  await expect(page).toHaveURL(/\/sign-in\?next=%2Fapp%2Fcapacity/);
  await expect(
    page.getByRole("heading", { name: /Acesso seguro antes de qualquer/i }),
  ).toBeVisible();
});

test("protected tariff shell redirects anonymous users to sign-in", async ({ page }) => {
  await gotoRuntimePage(page, "/app/tariffs");

  await expect(page).toHaveURL(/\/sign-in\?next=%2Fapp%2Ftariffs/);
  await expect(
    page.getByRole("heading", { name: /Acesso seguro antes de qualquer/i }),
  ).toBeVisible();
});

test("protected audit shell redirects anonymous users to sign-in", async ({ page }) => {
  await gotoRuntimePage(page, "/app/audit");

  await expect(page).toHaveURL(/\/sign-in\?next=%2Fapp%2Faudit/);
  await expect(
    page.getByRole("heading", { name: /Acesso seguro antes de qualquer/i }),
  ).toBeVisible();
});

test("protected reports shell redirects anonymous users to sign-in", async ({ page }) => {
  await gotoRuntimePage(page, "/app/reports");

  await expect(page).toHaveURL(/\/sign-in\?next=%2Fapp%2Freports/);
  await expect(
    page.getByRole("heading", { name: /Acesso seguro antes de qualquer/i }),
  ).toBeVisible();
});

test("protected notifications shell redirects anonymous users to sign-in", async ({ page }) => {
  await gotoRuntimePage(page, "/app/notifications");

  await expect(page).toHaveURL(/\/sign-in\?next=%2Fapp%2Fnotifications/);
  await expect(
    page.getByRole("heading", { name: /Acesso seguro antes de qualquer/i }),
  ).toBeVisible();
});

test("protected integrations shell redirects anonymous users to sign-in", async ({ page }) => {
  await gotoRuntimePage(page, "/app/integrations");

  await expect(page).toHaveURL(/\/sign-in\?next=%2Fapp%2Fintegrations/);
  await expect(
    page.getByRole("heading", { name: /Acesso seguro antes de qualquer/i }),
  ).toBeVisible();
});

test("protected security shell redirects anonymous users to sign-in", async ({ page }) => {
  await gotoRuntimePage(page, "/app/security");

  await expect(page).toHaveURL(/\/sign-in\?next=%2Fapp%2Fsecurity/);
  await expect(
    page.getByRole("heading", { name: /Acesso seguro antes de qualquer/i }),
  ).toBeVisible();
});

test("protected tracking redirect visual regression remains stable", async ({ page }) => {
  await gotoRuntimePage(page, "/app/tracking");

  await expect(page).toHaveURL(/\/sign-in\?next=%2Fapp%2Ftracking/);
  await expect(
    page.getByRole("heading", { name: /Acesso seguro antes de qualquer/i }),
  ).toBeVisible();
  await expect(page).toHaveScreenshot("tracking-protected-redirect.png", {
    animations: "disabled",
    caret: "hide",
    fullPage: true,
    maxDiffPixelRatio: 0.02,
  });
});

async function gotoRuntimePage(page: Page, path: string): Promise<void> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.goto(path, {
        timeout: navigationTimeoutMs,
        waitUntil: "domcontentloaded",
      });
      return;
    } catch (error) {
      lastError = error;
      await delay(1_000);
    }
  }

  throw lastError;
}

export function startWebRuntime(): ChildProcess {
  const isWindows = process.platform === "win32";
  const command = isWindows ? "cmd.exe" : "pnpm";
  const args = isWindows
    ? [
        "/d",
        "/s",
        "/c",
        `pnpm.cmd --filter @saptm/web dev --hostname ${runtimeHostname} --port ${runtimePort}`,
      ]
    : ["--filter", "@saptm/web", "dev", "--hostname", runtimeHostname, "--port", runtimePort];

  const runtime = spawn(command, args, {
    cwd: process.cwd(),
    detached: !isWindows,
    env: {
      ...process.env,
      API_CORS_ORIGINS: process.env.API_CORS_ORIGINS ?? baseUrl,
      BETTER_AUTH_SECRET:
        process.env.BETTER_AUTH_SECRET ?? "local-better-auth-secret-for-e2e-validation-only",
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? baseUrl,
      DATABASE_URL:
        process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:25432/saptm",
      FORCE_COLOR: "0",
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? baseUrl,
      NEXT_TELEMETRY_DISABLED: "1",
      TURBO_TELEMETRY_DISABLED: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  runtime.stdout?.on("data", captureRuntimeLog);
  runtime.stderr?.on("data", captureRuntimeLog);

  return runtime;
}

export async function stopProcessTree(runtime: ChildProcess): Promise<void> {
  if (runtime.pid === undefined || runtime.exitCode !== null || runtime.signalCode !== null) {
    return;
  }

  if (process.platform === "win32") {
    await new Promise<void>((resolve) => {
      const killer = spawn("taskkill", ["/pid", String(runtime.pid), "/t", "/f"], {
        stdio: "ignore",
        windowsHide: true,
      });

      killer.once("error", () => resolve());
      killer.once("close", () => resolve());
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

  await waitForRuntimeExit(runtime);
}

async function stopWindowsListeningPortProcesses(port: string): Promise<void> {
  if (process.platform !== "win32" || !/^\d+$/.test(port)) {
    return;
  }

  const processIds = await readWindowsListeningPortProcessIds(port);

  for (const processId of processIds) {
    if (processId === String(process.pid)) {
      continue;
    }

    await captureProcessOutput("taskkill", ["/pid", processId, "/t", "/f"]);
  }

  await waitForWindowsListeningPortRelease(port);
}

async function waitForWindowsListeningPortRelease(port: string): Promise<void> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < runtimeShutdownTimeoutMs) {
    const processIds = await readWindowsListeningPortProcessIds(port);

    if (processIds.length === 0) {
      return;
    }

    await delay(500);
  }
}

async function readWindowsListeningPortProcessIds(port: string): Promise<string[]> {
  const output = await captureProcessOutput("powershell.exe", [
    "-NoProfile",
    "-Command",
    `Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique`,
  ]);

  return Array.from(new Set(output.split(/\s+/).filter((value) => /^\d+$/.test(value))));
}

async function waitForNextDevLockRelease(): Promise<void> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < runtimeShutdownTimeoutMs) {
    if (!existsSync(webNextDevLockPath)) {
      return;
    }

    await delay(500);
  }
}

function captureProcessOutput(command: string, args: readonly string[]): Promise<string> {
  return new Promise((resolve) => {
    const runtime = spawn(command, [...args], {
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    let output = "";
    let settled = false;
    let timeout: ReturnType<typeof setTimeout>;
    const finish = () => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeout);
      resolve(output);
    };
    timeout = setTimeout(() => {
      runtime.kill();
      finish();
    }, 5_000);

    runtime.stdout?.on("data", (chunk) => {
      output = `${output}${String(chunk)}`;
    });
    runtime.stderr?.on("data", (chunk) => {
      output = `${output}${String(chunk)}`;
    });
    runtime.once("error", finish);
    runtime.once("close", finish);
  });
}

async function waitForWebRuntimeHealth(): Promise<void> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < startupTimeoutMs) {
    if (webRuntime?.exitCode !== null && webRuntime?.exitCode !== undefined) {
      throw new Error(`Web runtime exited before readiness.\n${webRuntimeLogs}`);
    }

    if (await isWebRuntimeHealthy()) {
      return;
    }

    await delay(1_000);
  }

  throw new Error(
    `Web runtime did not become healthy within ${startupTimeoutMs}ms.\n${webRuntimeLogs}`,
  );
}

async function waitForWebRuntimeReadiness(): Promise<void> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < startupTimeoutMs) {
    if (webRuntime?.exitCode !== null && webRuntime?.exitCode !== undefined) {
      throw new Error(`Web runtime exited before route readiness.\n${webRuntimeLogs}`);
    }

    if (await isWebRouteReachable(signInUrl)) {
      return;
    }

    await delay(1_000);
  }

  throw new Error(
    `Web runtime did not render /sign-in within ${startupTimeoutMs}ms.\n${webRuntimeLogs}`,
  );
}

async function isWebRuntimeHealthy(): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(healthUrl);

    if (!response.ok) {
      return false;
    }

    const body = (await response.json()) as { serviceName?: string; status?: string };

    return body.serviceName === "@saptm/web" && body.status === "ok";
  } catch {
    return false;
  }
}

async function isWebRouteReachable(url: string): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(url);

    return response.ok;
  } catch {
    return false;
  }
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), httpProbeTimeoutMs);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function waitForRuntimeExit(runtime: ChildProcess): Promise<void> {
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

function captureRuntimeLog(chunk: Buffer | string): void {
  webRuntimeLogs += chunk.toString();

  if (webRuntimeLogs.length > maxCapturedLogLength) {
    webRuntimeLogs = webRuntimeLogs.slice(-maxCapturedLogLength);
  }
}
