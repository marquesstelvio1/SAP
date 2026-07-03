import { createSaptmAuthFromEnv } from "@saptm/auth/server";
import { toNextJsHandler } from "better-auth/next-js";

import { extractClientIp, rateLimiter } from "@/lib/rate-limiter";

const AUTH_LOG_PREFIX = "[SAPTM:AUTH:ROUTE]";

export const runtime = "nodejs";

const AUTH_RATE_LIMITS: Record<string, { windowMs: number; max: number; message: string }> = {
  "sign-in/email": {
    windowMs: 60_000,
    max: 5,
    message: "Muitas tentativas de inicio de sessão. Tente novamente mais tarde.",
  },
  "two-factor/verify": {
    windowMs: 60_000,
    max: 3,
    message: "Muitas tentativas de verificação de dois fatores. Tente novamente mais tarde.",
  },
  "two-factor/setup": {
    windowMs: 60_000,
    max: 3,
    message: "Muitas tentativas de configuração de dois fatores. Tente novamente mais tarde.",
  },
};

const auth = createSaptmAuthFromEnv();
const baseHandlers = toNextJsHandler(auth);

const authHandler = async (request: Request): Promise<Response> => {
  const url = new URL(request.url);
  const method = request.method;
  const authPath = url.pathname.replace(/^\/api\/auth\//, "");
  const ip = extractClientIp(request);

  console.log(`${AUTH_LOG_PREFIX} ┌─ REQUEST`, { method, path: authPath, ip });

  const limitConfig = AUTH_RATE_LIMITS[authPath];

  if (limitConfig !== undefined) {
    const result = rateLimiter.check(authPath, ip, {
      windowMs: limitConfig.windowMs,
      max: limitConfig.max,
    });

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetEpochMs - Date.now()) / 1000);
      console.log(`${AUTH_LOG_PREFIX} └─ RATE_LIMITED`, { path: authPath, ip, retryAfter });
      return new Response(limitConfig.message, {
        status: 429,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(limitConfig.max),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(result.resetEpochMs / 1000)),
        },
      });
    }
  }

  try {
    let response: Response;
    if (method === "GET" && baseHandlers.GET) {
      response = await baseHandlers.GET(request);
    } else if (method === "POST" && baseHandlers.POST) {
      response = await baseHandlers.POST(request);
    } else {
      console.log(`${AUTH_LOG_PREFIX} └─ METHOD_NOT_ALLOWED`, { method });
      return new Response("Method not allowed", { status: 405 });
    }

    const setCookie = response.headers.get("set-cookie") ?? "";
    console.log(`${AUTH_LOG_PREFIX} └─ RESPONSE`, {
      status: response.status,
      ok: response.ok,
      hasSetCookie: !!setCookie,
      setCookiePreview: setCookie.slice(0, 100),
    });
    return response;
  } catch (error: unknown) {
    const isPrismaError = error != null && typeof error === "object" && "code" in error;
    const errorCode = isPrismaError ? (error as { code: string }).code : "UNKNOWN";
    const details = isPrismaError
      ? { code: errorCode, meta: (error as { meta?: unknown }).meta }
      : { stack: error instanceof Error ? error.stack : undefined };
    console.error(`${AUTH_LOG_PREFIX} └─ ERROR`, {
      errorCode,
      message: error instanceof Error ? error.message : String(error),
      details,
    });
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        code: errorCode,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

export const GET = authHandler;
export const POST = authHandler;
