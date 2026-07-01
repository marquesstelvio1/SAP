export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const envStatus = checkEnvironment();

  return Response.json({
    serviceName: "@saptm/web",
    status: envStatus.status === "ok" ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    checks: [envStatus],
  });
}

function checkEnvironment(): { name: string; status: string; critical: boolean } {
  const missing: string[] = [];

  if (!process.env.BETTER_AUTH_SECRET) missing.push("BETTER_AUTH_SECRET");
  if (!process.env.BETTER_AUTH_URL) missing.push("BETTER_AUTH_URL");
  if (!process.env.NEXT_PUBLIC_API_URL) missing.push("NEXT_PUBLIC_API_URL");
  if (!process.env.NEXT_PUBLIC_APP_URL) missing.push("NEXT_PUBLIC_APP_URL");
  if (!process.env.DATABASE_URL) missing.push("DATABASE_URL");

  return {
    name: "environment",
    status: missing.length === 0 ? "ok" : `degraded: ${missing.join(", ")}`,
    critical: true,
  };
}
