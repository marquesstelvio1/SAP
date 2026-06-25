import { getClientEnv } from "@saptm/config";
import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname.replace("/api/rpc", "/rpc");
  const search = request.nextUrl.search;
  const target = new URL(`${path}${search}`, getClientEnv().NEXT_PUBLIC_API_URL);

  const headers: Record<string, string> = {
    "x-internal-request": "true",
  };

  const cookie = request.headers.get("cookie");
  if (cookie) {
    headers.cookie = cookie;
  }

  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers["content-type"] = contentType;
  }

  const body = request.method === "GET" || request.method === "HEAD"
    ? undefined
    : await request.text();

  let response: Response;
  try {
    response = await fetch(target, {
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
