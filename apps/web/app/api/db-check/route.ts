import { getPrismaClient } from "@saptm/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Array<{ name: string; status: string; detail: string }> = [];

  // env check
  const dbUrl = process.env.DATABASE_URL ?? "";
  const betterAuthUrl = process.env.BETTER_AUTH_URL ?? "";
  checks.push({
    name: "DATABASE_URL",
    status: dbUrl ? "set" : "missing",
    detail: dbUrl
      ? dbUrl.replace(/\/\/.*@/, "//***:***@").replace(/\?.*/, "?***")
      : "not set",
  });
  checks.push({
    name: "BETTER_AUTH_URL",
    status: betterAuthUrl ? "set" : "missing",
    detail: betterAuthUrl || "not set",
  });

  // connectivity check
  try {
    const prisma = getPrismaClient();
    await prisma.$connect();
    const result = await prisma.$queryRaw`SELECT 1 AS ok`;
    checks.push({
      name: "prisma.connect",
      status: "ok",
      detail: `query result: ${JSON.stringify(result)}`,
    });
    await prisma.$disconnect();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    checks.push({
      name: "prisma.connect",
      status: "error",
      detail: msg,
    });
  }

  const allOk = checks.every((c) => c.status === "ok" || c.status === "set");

  return Response.json({
    service: "@saptm/web",
    healthy: allOk,
    timestamp: new Date().toISOString(),
    checks,
  });
}
