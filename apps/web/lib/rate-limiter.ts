/**
 * In-memory sliding-window rate limiter for Next.js route handlers.
 *
 * This is a single-process limiter   — it works correctly when there is exactly
 * one running instance of the Next.js server (typical for SMB deployments).
 *
 * For horizontally-scaled deployments (multiple Next.js instances), this MUST
 * be replaced with a Redis-backed limiter (e.g. @upstash/ratelimit or a custom
 * Redis sliding-window implementation).
 *
 * ─── Usage ────────────────────────────────────────────────────────────
 * ```ts
 * import { rateLimiter } from "@/lib/rate-limiter";
 *
 * const result = rateLimiter.check("sign-in", clientIp, {
 *   windowMs: 60_000,
 *   max: 5,
 * });
 *
 * if (!result.allowed) {
 *   return new Response("Demasiados pedidos.", { status: 429 });
 * }
 * ```
 *
 * ─── Clean-up ─────────────────────────────────────────────────────────
 * Expired records are purged every 60 seconds via a `setInterval` handle
 * that is `unref`-ed so it does not keep the process alive.
 */

const CLEANUP_INTERVAL_MS = 60_000;

export type RateLimitConfig = {
  /** Time window in milliseconds (e.g. 60_000 for 1 minute). */
  windowMs: number;
  /** Maximum number of requests allowed within the window. */
  max: number;
};

export type RateLimitResult =
  | { allowed: true; remaining: number; resetEpochMs: number }
  | { allowed: false; remaining: 0; resetEpochMs: number };

type WindowRecord = {
  count: number;
  resetEpochMs: number;
};

class InMemoryRateLimiter {
  /** route → (trackerKey → WindowRecord) */
  private readonly stores = new Map<string, Map<string, WindowRecord>>();
  private cleanupHandle: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.cleanupHandle = setInterval(() => this.cleanup(), CLEANUP_INTERVAL_MS);
    // Do not keep the Node.js process alive just for cleanup.
    if (
      this.cleanupHandle !== null &&
      typeof this.cleanupHandle === "object" &&
      "unref" in this.cleanupHandle
    ) {
      (this.cleanupHandle as ReturnType<typeof setInterval>).unref();
    }
  }

  /**
   * Check whether a request should be allowed.
   *
   * @param route  – Logical route name (e.g. `"sign-in"`, `"2fa-verify"`).
   * @param key    – Tracker key, typically the client IP or user-id.
   * @param config – Window and limit configuration.
   */
  check(route: string, key: string, config: RateLimitConfig): RateLimitResult {
    let store = this.stores.get(route);
    if (store === undefined) {
      store = new Map();
      this.stores.set(route, store);
    }

    const now = Date.now();
    const record = store.get(key);

    if (record === undefined || now >= record.resetEpochMs) {
      // First request or window has expired — start a new window.
      const resetEpochMs = now + config.windowMs;
      store.set(key, { count: 1, resetEpochMs });
      return { allowed: true, remaining: config.max - 1, resetEpochMs };
    }

    // Within the current window — increment.
    const nextCount = record.count + 1;
    if (nextCount > config.max) {
      return { allowed: false, remaining: 0, resetEpochMs: record.resetEpochMs };
    }

    record.count = nextCount;
    return { allowed: true, remaining: config.max - nextCount, resetEpochMs: record.resetEpochMs };
  }

  /** Reset all records for a given route (useful in tests). */
  resetRoute(route: string): void {
    this.stores.delete(route);
  }

  /** Reset all records (useful in tests). */
  resetAll(): void {
    this.stores.clear();
  }

  /** Free all resources. */
  destroy(): void {
    if (this.cleanupHandle !== null) {
      clearInterval(this.cleanupHandle);
      this.cleanupHandle = null;
    }
    this.stores.clear();
  }

  // ── Private ──────────────────────────────────────────────────────────

  private cleanup(): void {
    const now = Date.now();
    for (const [route, store] of this.stores) {
      for (const [key, record] of store) {
        if (now >= record.resetEpochMs) {
          store.delete(key);
        }
      }
      if (store.size === 0) {
        this.stores.delete(route);
      }
    }
  }
}

/** Singleton shared across the application. */
export const rateLimiter = new InMemoryRateLimiter();

/**
 * Extract the client IP from a standard `Request` object.
 *
 * Respects reverse-proxy headers in order of preference.
 */
export function extractClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded !== null) {
    const ip = forwarded.split(",")[0]?.trim();
    if (ip !== undefined && ip.length > 0) return ip;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp !== null && realIp.length > 0) return realIp;

  return "unknown";
}
