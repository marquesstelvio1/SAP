import { createSaptmAuthFromEnv } from "@saptm/auth/server";
import { toNextJsHandler } from "better-auth/next-js";

import { extractClientIp, rateLimiter } from "@/lib/rate-limiter";

export const runtime = "nodejs";

/**
 * Rate‑limit configuration for sensitive auth endpoints.
 *
 * These limits are intentionally stricter than the global API tier
 * (200 req/min) to mitigate brute‑force and credential‑stuffing attacks.
 *
 * ── Sign‑in ─────────────────────────────────────────────────────────────
 *    5 requests per minute per IP.  Better Auth also implements an
 *    account‑level lockout (5 failures → 15 min block) as a second layer.
 *
 * ── 2FA verification ────────────────────────────────────────────────────
 *    3 requests per minute per IP.  TOTP codes change every 30 seconds,
 *    so 3 attempts per minute is generous for a human but restrictive for
 *    an automated attacker.
 *
 * ── 2FA setup ───────────────────────────────────────────────────────────
 *    3 requests per minute per IP (user ID would be better but the
 *    request must be intercepted before Better Auth resolves the session).
 */
const AUTH_RATE_LIMITS: Record<string, { windowMs: number; max: number; message: string }> = {
  "sign-in/email": {
    windowMs: 60_000,
    max: 5,
    message: "Muitas tentativas de inicio de sessao. Tente novamente mais tarde.",
  },
  "two-factor/verify": {
    windowMs: 60_000,
    max: 3,
    message: "Muitas tentativas de verificacao de dois fatores. Tente novamente mais tarde.",
  },
  "two-factor/setup": {
    windowMs: 60_000,
    max: 3,
    message: "Muitas tentativas de configuracao de dois fatores. Tente novamente mais tarde.",
  },
};

const authHandler = async (request: Request): Promise<Response> => {
  const url = new URL(request.url);

  // Map the Better Auth path to a rate‑limit key.
  // Better Auth paths are relative to the base path `/api/auth`.
  // For example: `/api/auth/sign-in/email` → `sign-in/email`
  const authPath = url.pathname.replace(/^\/api\/auth\//, "");
  const limitConfig = AUTH_RATE_LIMITS[authPath];

  if (limitConfig !== undefined) {
    const ip = extractClientIp(request);
    const result = rateLimiter.check(authPath, ip, {
      windowMs: limitConfig.windowMs,
      max: limitConfig.max,
    });

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetEpochMs - Date.now()) / 1000);
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
    return await createSaptmAuthFromEnv().handler(request);
  } catch (error) {
    return new Response(JSON.stringify({ error: error?.message || "Unknown error", stack: error?.stack }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const { GET, POST } = toNextJsHandler(authHandler);
