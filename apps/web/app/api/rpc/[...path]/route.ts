import { getClientEnv } from "@saptm/config";
import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const ORG_COOKIE = "saptm_active_org";
const ORG_HEADER = "x-saptm-org-id";

/** Maximum RPC request body size in bytes (10 MB). */
const MAX_RPC_BODY_SIZE = 10 * 1024 * 1024;
void MAX_RPC_BODY_SIZE;

/**
 * Parse a cookie string for a specific cookie value.
 * Handles both standard and URL-encoded values.
 */
function parseCookie(cookieString: string, name: string): string | undefined {
  const match = cookieString.match(new RegExp(`(?:^|;\\s*)${escapeRegExp(name)}=([^;]+)`));
  return match ? decodeURIComponent(match[1] ?? "") : undefined;
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Read the request body with a size limit to prevent memory exhaustion.
 * Returns null for methods that do not support a body (GET, HEAD).
 */
async function readRequestBody(request: NextRequest): Promise<string | null> {
  if (request.method === "GET" || request.method === "HEAD") {
    return null;
  }

  // Check Content-Length header first for early rejection
  const contentLength = request.headers.get("content-length");
  if (contentLength !== null && Number.parseInt(contentLength, 10) > MAX_RPC_BODY_SIZE) {
    throw new BodyTooLargeError();
  }

  const text = await request.text();

  if (Buffer.byteLength(text, "utf-8") > MAX_RPC_BODY_SIZE) {
    throw new BodyTooLargeError();
  }

  return text;
}

class BodyTooLargeError extends Error {
  constructor() {
    super("Request body exceeds maximum allowed size.");
    this.name = "BodyTooLargeError";
  }
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

  const body =
    request.method === "GET" || request.method === "HEAD" ? null : await readRequestBody(request);

  // Forward Content-Length explicitly to help the backend allocate buffers
  if (body !== null) {
    headers["content-length"] = String(Buffer.byteLength(body, "utf-8"));
  }

  let response: Response;
  try {
    response = await fetch(target.toString(), {
      method: request.method,
      headers,
      body,
    });
  } catch (error) {
    if (error instanceof BodyTooLargeError) {
      return NextResponse.json({ error: "Payload demasiado grande." }, { status: 413 });
    }

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
