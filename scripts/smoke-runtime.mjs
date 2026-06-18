const apiUrl = readRuntimeUrl("SAPTM_API_URL", "NEXT_PUBLIC_API_URL", "http://localhost:4000");
const webUrl = readRuntimeUrl("SAPTM_WEB_URL", "NEXT_PUBLIC_APP_URL", "http://localhost:3000");
const timeoutMs = Number.parseInt(process.env.SMOKE_TIMEOUT_MS ?? "10000", 10);

const checks = [
  {
    name: "api liveness",
    url: new URL("/health/live", apiUrl),
    expectBody: (body) => assertJsonHealth(body, "ok"),
  },
  {
    name: "api readiness",
    url: new URL("/health/ready", apiUrl),
    expectBody: (body) => assertJsonHealth(body, "ok"),
  },
  {
    name: "api metrics",
    url: new URL("/metrics", apiUrl),
    expectBody: (body) => {
      if (!body.includes("process_uptime_seconds")) {
        throw new Error("metrics response does not include process_uptime_seconds");
      }
    },
  },
  {
    name: "web health",
    url: new URL("/api/health", webUrl),
    expectBody: (body) => assertJsonHealth(body, "ok"),
  },
];

for (const check of checks) {
  await runCheck(check);
}

console.log(`SAPTM runtime smoke passed: ${checks.length} endpoints validated.`);

async function runCheck(check) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(check.url, {
      signal: controller.signal,
      headers: {
        "x-source-system": "scripts/smoke-runtime",
        "x-operation-name": `smoke.${check.name.replace(/\s+/g, ".")}`,
      },
    });
    const body = await response.text();

    if (!response.ok) {
      throw new Error(`${check.name} returned HTTP ${response.status}: ${body.slice(0, 200)}`);
    }

    check.expectBody(body);
    console.log(`ok - ${check.name} ${check.url}`);
  } finally {
    clearTimeout(timeout);
  }
}

function assertJsonHealth(body, expectedStatus) {
  const payload = JSON.parse(body);

  if (payload.status !== expectedStatus) {
    throw new Error(`expected health status ${expectedStatus}, received ${payload.status}`);
  }
}

function readRuntimeUrl(primaryName, fallbackName, defaultValue) {
  const value = process.env[primaryName] ?? process.env[fallbackName] ?? defaultValue;

  return value.endsWith("/") ? value : `${value}/`;
}
