import { createSaptmAuthFromEnv } from "@saptm/auth/server";
import { getServerEnv } from "@saptm/config";
import { getPrismaClient } from "@saptm/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const checks: Array<{ name: string; status: string; detail: string }> = [];
  const env = loadEnv();

  // env
  for (const [key, value] of Object.entries(env)) {
    checks.push({
      name: `env.${key}`,
      status: value ? "set" : "missing",
      detail: key.includes("SECRET") || key.includes("KEY")
        ? value ? "*** (set)" : "missing"
        : value || "not set",
    });
  }

  // cookies
  const cookieHeader = request.headers.get("cookie") ?? "";
  const hasSessionCookie = cookieHeader.includes("better-auth.session_token");
  checks.push({
    name: "cookies.better-auth.session_token",
    status: hasSessionCookie ? "present" : "absent",
    detail: hasSessionCookie ? "found in request" : "not sent in request",
  });

  // Better Auth session check
  try {
    const auth = createSaptmAuthFromEnv();
    const session = await auth.api.getSession({
      headers: request.headers,
      query: { disableCookieCache: true, disableRefresh: true },
    });
    checks.push({
      name: "auth.getSession",
      status: session ? "authenticated" : "no_session",
      detail: session
        ? `user=${session.user.email} session=${session.session.id.slice(0, 8)}...`
        : "no valid session found",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    checks.push({
      name: "auth.getSession",
      status: "error",
      detail: msg,
    });
  }

  // DB connectivity via Prisma
  // NOTE: do NOT call prisma.$disconnect() — the pool is a singleton shared
  // across all requests. Disconnecting would leave a stale dead pool in the
  // global __saptmPrismaClient, breaking subsequent requests.
  try {
    const prisma = getPrismaClient();
    const result = await prisma.$queryRaw`SELECT 1 AS ok`;
    checks.push({
      name: "prisma.query",
      status: "ok",
      detail: `SELECT 1 → ${JSON.stringify(result)}`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    checks.push({
      name: "prisma.query",
      status: "error",
      detail: msg,
    });
  }

  const allOk = checks.every(
    (c) => c.status === "ok" || c.status === "set" || c.status === "present" || c.status === "no_session",
  );

  return Response.json({
    service: "@saptm/web",
    healthy: allOk,
    timestamp: new Date().toISOString(),
    checks,
  });
}

function loadEnv(): Record<string, string | undefined> {
  try {
    const parsed = getServerEnv();
    return {
      NODE_ENV: parsed.NODE_ENV,
      BETTER_AUTH_URL: parsed.BETTER_AUTH_URL,
      NEXT_PUBLIC_APP_URL: parsed.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_API_URL: parsed.NEXT_PUBLIC_API_URL,
      DATABASE_URL: process.env.DATABASE_URL,
      REDIS_URL: process.env.REDIS_URL,
      LOG_LEVEL: parsed.LOG_LEVEL,
      API_CORS_ORIGINS: parsed.API_CORS_ORIGINS.length > 0 ? parsed.API_CORS_ORIGINS.join(", ") : "(none)",
    };
  } catch (error: unknown) {
    return { PARSE_ERROR: error instanceof Error ? error.message : String(error) };
  }
}
