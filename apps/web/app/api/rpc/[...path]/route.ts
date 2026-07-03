import { getClientEnv } from "@saptm/config";
import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const ORG_COOKIE = "saptm_active_org";
const ORG_HEADER = "x-saptm-org-id";

/**
 * Parse a cookie string for a specific cookie value.
 * Handles both standard and URL-encoded values.
 */
function parseCookie(cookieString: string, name: string): string | undefined {
  const match = cookieString.match(
    new RegExp(`(?:^|;\\s*)${escapeRegExp(name)}=([^;]+)`),
  );
  return match ? decodeURIComponent(match[1] ?? "") : undefined;
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname.replace("/api/rpc", "/rpc");
  const search = request.nextUrl.search;
  const target = new URL(`${path}${search}`, getClientEnv().NEXT_PUBLIC_API_URL);

  const headers: Record<string, string> = {
    "x-internal-request": "true",
    "x-forwarded-for":
      request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "",
    "x-real-ip": request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for") ?? "",
    "user-agent": request.headers.get("user-agent") ?? "",
  };

  const cookie = request.headers.get("cookie");
  if (cookie) {
    headers.cookie = cookie;

    // Extract org preference from cookie and forward as header
    const activeOrg = parseCookie(cookie, ORG_COOKIE);
    if (activeOrg) {
      headers[ORG_HEADER] = activeOrg;
    }
  }

  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers["content-type"] = contentType;
  }

  const body = request.method === "GET" || request.method === "HEAD" ? null : await request.text();

  let response: Response;
  try {
    response = await fetch(target.toString(), {
      method: request.method,
      headers,
      body,
    });
  } catch {
    return NextResponse.json(
      { error: "API unavailable", message: "Falha ao conectar com API." },
      { status: 503 },
    );
  }

  const responseHeaders: Record<string, string> = {};
  responseHeaders["content-type"] = response.headers.get("content-type") ?? "application/json";
  responseHeaders["x-csrf-token"] = response.headers.get("x-csrf-token") ?? "";

  const setCookie = response.headers.get("set-cookie");
  if (setCookie) {
    responseHeaders["set-cookie"] = setCookie;
  }

  return new NextResponse(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
