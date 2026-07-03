import { getClientEnv } from "@saptm/config";
import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const ORG_COOKIE = "saptm_active_org";
const ORG_HEADER = "x-saptm-org-id";
const CORRELATION_ID_HEADER = "x-correlation-id";

/** Maximum RPC request body size in bytes (10 MB). */
const MAX_RPC_BODY_SIZE = 10 * 1024 * 1024;
const RPC_TIMEOUT_MS = 15000;
const MAX_RETRIES = 2;

/**
 * Parse a cookie string for a specific cookie value.
 */
function parseCookie(cookieString: string, name: string): string | undefined {
  const match = cookieString.match(new RegExp(`(?:^|;\\s*)${escapeRegExp(name)}=([^;]+)`));
  return match ? decodeURIComponent(match[1] ?? "") : undefined;
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function fetchWithRetry(
  input: string,
  init: RequestInit,
  retries = MAX_RETRIES,
): Promise<Response> {
  try {
    const response = await fetch(input, {
      ...init,
      signal: AbortSignal.timeout(RPC_TIMEOUT_MS),
    });

    if (retries > 0 && [502, 503, 504].includes(response.status)) {
      await new Promise((resolve) => setTimeout(resolve, (MAX_RETRIES - retries + 1) * 500));
      return fetchWithRetry(input, init, retries - 1);
    }

    return response;
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, (MAX_RETRIES - retries + 1) * 500));
      return fetchWithRetry(input, init, retries - 1);
    }
    throw error;
  }
}

async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname.replace("/api/rpc", "/rpc");
  const search = request.nextUrl.search;
  const target = new URL(`${path}${search}`, getClientEnv().NEXT_PUBLIC_API_URL);

  const correlationId =
    request.headers.get("x-correlation-id") ??
    request.headers.get("x-request-id") ??
    crypto.randomUUID();

  const headers: Record<string, string> = {
    "x-internal-request": "true",
    "x-forwarded-for":
      request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "",
    "x-real-ip": request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for") ?? "",
    "user-agent": request.headers.get("user-agent") ?? "",
    [CORRELATION_ID_HEADER]: correlationId,
  };

  const cookie = request.headers.get("cookie");
  if (cookie) {
    headers.cookie = cookie;
    const activeOrg = parseCookie(cookie, ORG_COOKIE);
    if (activeOrg) headers[ORG_HEADER] = activeOrg;
  }

  const contentType = request.headers.get("content-type");
  if (contentType) headers["content-type"] = contentType;

  let body: string | null = null;
  if (!["GET", "HEAD"].includes(request.method)) {
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_RPC_BODY_SIZE) {
      return NextResponse.json(
        { error: "PAYLOAD_TOO_LARGE", message: "Payload too large", correlationId },
        { status: 413 },
      );
    }
    body = await request.text();
    if (Buffer.byteLength(body, "utf-8") > MAX_RPC_BODY_SIZE) {
      return NextResponse.json(
        { error: "PAYLOAD_TOO_LARGE", message: "Payload too large", correlationId },
        { status: 413 },
      );
    }
    headers["content-length"] = String(Buffer.byteLength(body, "utf-8"));
  }

  try {
    const response = await fetchWithRetry(target.toString(), {
      method: request.method,
      headers,
      body,
    });

    const responseHeaders: Record<string, string> = {
      "content-type": response.headers.get("content-type") ?? "application/json",
      "x-correlation-id": correlationId,
    };

    if (response.headers.has("x-csrf-token"))
      responseHeaders["x-csrf-token"] = response.headers.get("x-csrf-token")!;
    if (response.headers.has("set-cookie"))
      responseHeaders["set-cookie"] = response.headers.get("set-cookie")!;

    const rateLimitRemaining = response.headers.get("x-ratelimit-remaining");
    const rateLimitReset = response.headers.get("x-ratelimit-reset");
    const retryAfter = response.headers.get("retry-after");

    if (rateLimitRemaining !== null) responseHeaders["x-ratelimit-remaining"] = rateLimitRemaining;
    if (rateLimitReset !== null) responseHeaders["x-ratelimit-reset"] = rateLimitReset;
    if (retryAfter !== null) responseHeaders["retry-after"] = retryAfter;

    return new NextResponse(response.body, { status: response.status, headers: responseHeaders });
  } catch (error) {
    const isTimeout = error instanceof DOMException && error.name === "AbortError";

    return NextResponse.json(
      {
        error: isTimeout ? "GATEWAY_TIMEOUT" : "SERVICE_UNAVAILABLE",
        message: isTimeout ? "API gateway timeout." : "Service unavailable.",
        correlationId,
        retryAfterMs: 3000,
      },
      { status: isTimeout ? 504 : 503 },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
