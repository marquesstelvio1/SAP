import { spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { Socket } from "node:net";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const playwrightBinary = resolve(
  rootDir,
  process.platform === "win32"
    ? "node_modules/.bin/playwright.cmd"
    : "node_modules/.bin/playwright",
);
const specs = ["tests/e2e/authenticated-platform.spec.ts", "tests/e2e/runtime-health.spec.ts"];
const webNextDevDir = resolve(rootDir, "apps/web/.next/dev");
const defaultPlatformApiUrl = "http://127.0.0.1:43100";
const defaultPlatformWebUrl = "http://127.0.0.1:3100";
const defaultRuntimeWebUrl = "http://127.0.0.1:3101";

if (!existsSync(playwrightBinary)) {
  console.error(`Playwright binary not found: ${playwrightBinary}`);
  process.exit(1);
}

const env = sanitizePnpmLifecycleEnv(process.env);

await assertRuntimeDependencies(env);

for (const spec of specs) {
  const specEnv = createSpecEnv(spec, env);
  const specPorts = readSpecPorts(spec, specEnv);

  await stopWindowsListeningPortProcesses(specPorts);
  cleanNextDevCache();
  const exitCode = await runPlaywrightSpec(spec, specEnv);
  await stopWindowsListeningPortProcesses(specPorts);

  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}

function createSpecEnv(spec, sourceEnv) {
  const env = { ...sourceEnv };

  if (spec.includes("authenticated-platform")) {
    const webUrl = normalizeUrl(env.PLAYWRIGHT_BASE_URL ?? defaultPlatformWebUrl);
    const apiUrl = normalizeUrl(env.PLAYWRIGHT_API_URL ?? defaultPlatformApiUrl);

    env.API_CORS_ORIGINS = webUrl;
    env.API_PORT = readPort(apiUrl, "43100");
    env.BETTER_AUTH_URL = webUrl;
    env.NEXT_PUBLIC_API_URL = apiUrl;
    env.NEXT_PUBLIC_APP_URL = webUrl;
    env.PLAYWRIGHT_API_URL = apiUrl;
    env.PLAYWRIGHT_BASE_URL = webUrl;

    return env;
  }

  if (spec.includes("runtime-health")) {
    const webUrl = normalizeUrl(env.PLAYWRIGHT_RUNTIME_BASE_URL ?? defaultRuntimeWebUrl);

    env.API_CORS_ORIGINS = webUrl;
    env.BETTER_AUTH_URL = webUrl;
    env.NEXT_PUBLIC_API_URL = normalizeUrl(
      env.PLAYWRIGHT_API_URL ?? env.NEXT_PUBLIC_API_URL ?? defaultPlatformApiUrl,
    );
    env.NEXT_PUBLIC_APP_URL = webUrl;
    env.PLAYWRIGHT_RUNTIME_BASE_URL = webUrl;

    return env;
  }

  return env;
}

function readSpecPorts(spec, env) {
  const ports = new Set();

  if (spec.includes("authenticated-platform")) {
    ports.add(readPort(env.PLAYWRIGHT_BASE_URL, "3100"));
    ports.add(readPort(env.PLAYWRIGHT_API_URL, "43100"));
  }

  if (spec.includes("runtime-health")) {
    ports.add(readPort(env.PLAYWRIGHT_RUNTIME_BASE_URL, "3101"));
  }

  return Array.from(ports);
}

async function assertRuntimeDependencies(env) {
  const dependencies = [
    {
      label: "Postgres",
      url: env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:25432/saptm",
    },
    {
      label: "Redis",
      url: env.REDIS_URL ?? "redis://127.0.0.1:26379",
    },
  ];
  const missingDependencies = [];

  for (const dependency of dependencies) {
    const endpoint = parseRuntimeEndpoint(dependency.url);

    if (!(await canOpenTcpConnection(endpoint.host, endpoint.port))) {
      missingDependencies.push(`${dependency.label} at ${endpoint.host}:${endpoint.port}`);
    }
  }

  if (missingDependencies.length > 0) {
    console.error(`E2E runtime dependencies are not reachable: ${missingDependencies.join(", ")}.`);
    console.error("Start Docker Desktop, then run `pnpm infra:up` before `pnpm test:e2e`.");
    process.exit(1);
  }
}

function parseRuntimeEndpoint(value) {
  const url = new URL(value);

  if (!url.hostname) {
    throw new Error(`Invalid runtime dependency URL: ${value}`);
  }

  return {
    host: url.hostname,
    port: Number.parseInt(url.port || readDefaultPort(url.protocol), 10),
  };
}

function readDefaultPort(protocol) {
  switch (protocol) {
    case "postgresql:":
    case "postgres:":
      return "5432";
    case "redis:":
      return "6379";
    default:
      throw new Error(`Unsupported runtime dependency protocol: ${protocol}`);
  }
}

function normalizeUrl(value) {
  return new URL(value).toString().replace(/\/$/, "");
}

function readPort(value, fallback) {
  return new URL(value).port || fallback;
}

function canOpenTcpConnection(host, port) {
  return new Promise((resolveConnection) => {
    const socket = new Socket();
    const timeout = setTimeout(() => {
      socket.destroy();
      resolveConnection(false);
    }, 2_000);
    const finish = (isReachable) => {
      clearTimeout(timeout);
      socket.destroy();
      resolveConnection(isReachable);
    };

    socket.once("connect", () => finish(true));
    socket.once("error", () => finish(false));
    socket.connect(port, host);
  });
}

function cleanNextDevCache() {
  rmSync(webNextDevDir, {
    force: true,
    recursive: true,
  });
}

function sanitizePnpmLifecycleEnv(sourceEnv) {
  const env = { ...sourceEnv };
  const exactKeys = new Set([
    "init_cwd",
    "npm_command",
    "npm_execpath",
    "npm_lifecycle_event",
    "npm_lifecycle_script",
    "npm_node_execpath",
    "pnpm_script_src_dir",
  ]);

  for (const key of Object.keys(env)) {
    const normalizedKey = key.toLowerCase();

    if (
      env[key] === undefined ||
      exactKeys.has(normalizedKey) ||
      normalizedKey.startsWith("npm_config_") ||
      normalizedKey.startsWith("npm_package_")
    ) {
      delete env[key];
    }
  }

  return env;
}

function runPlaywrightSpec(spec, env) {
  console.log(`\n> playwright test ${spec}`);
  const { args, command } = createPlaywrightCommand(spec);

  return new Promise((resolveExitCode) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      env,
      stdio: "inherit",
      windowsVerbatimArguments: process.platform === "win32",
      windowsHide: true,
    });

    child.once("error", (error) => {
      console.error(error);
      resolveExitCode(1);
    });
    child.once("close", (exitCode, signal) => {
      if (signal !== null) {
        console.error(`Playwright exited with signal ${signal}`);
        resolveExitCode(1);
        return;
      }

      resolveExitCode(exitCode ?? 1);
    });
  });
}

function createPlaywrightCommand(spec) {
  if (process.platform !== "win32") {
    return {
      command: playwrightBinary,
      args: ["test", spec],
    };
  }

  return {
    command: "cmd.exe",
    args: ["/d", "/c", `call "${playwrightBinary}" test ${spec}`],
  };
}

async function stopWindowsListeningPortProcesses(ports) {
  if (process.platform !== "win32") {
    return;
  }

  for (const port of ports) {
    const processIds = await readWindowsListeningPortProcessIds(port);

    for (const processId of processIds) {
      if (processId === String(process.pid)) {
        continue;
      }

      await captureProcessOutput("taskkill", ["/pid", processId, "/t", "/f"]);
    }
  }
}

async function readWindowsListeningPortProcessIds(port) {
  const output = await captureProcessOutput("powershell.exe", [
    "-NoProfile",
    "-Command",
    `Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique`,
  ]);

  return Array.from(new Set(output.split(/\s+/).filter((value) => /^\d+$/.test(value))));
}

function captureProcessOutput(command, args) {
  return new Promise((resolveOutput) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    let output = "";
    let settled = false;
    let timeout;
    const finish = () => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeout);
      resolveOutput(output);
    };
    timeout = setTimeout(() => {
      child.kill();
      finish();
    }, 5_000);

    child.stdout?.on("data", (chunk) => {
      output = `${output}${String(chunk)}`;
    });
    child.stderr?.on("data", (chunk) => {
      output = `${output}${String(chunk)}`;
    });
    child.once("error", finish);
    child.once("close", finish);
  });
}
