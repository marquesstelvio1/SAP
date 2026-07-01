import { createHash } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { getServerEnv } from "@saptm/config";
import { doubleCsrf } from "csrf-csrf";

type CsrfOptions = {
  excludedPaths?: string[];
};

type NextFunction = (error?: unknown) => void;

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Header set by the internal RPC client (server-to-server requests
 * from Next.js).  CORS does not expose this header, so browser-origin
 * requests cannot set it — preventing CSRF bypass from the client.
 */
const INTERNAL_REQUEST_HEADER = "x-internal-request";

/**
 * Pepper used to derive a CSRF-specific secret from the application
 * secret. This ensures the CSRF token key is never the raw auth secret.
 */
const CSRF_SECRET_PEPPER = "saptm-csrf-v1";

/**
 * Stable identifier for unauthenticated sessions. It is derived from
 * the CSRF-specific secret (not the raw auth secret) so tokens remain
 * verifiable across generate/validate cycles without exposing the
 * authentication credential.
 */
const ANONYMOUS_SESSION_ID = "anonymous";

function deriveCsrfSecret(appSecret: string): string {
  return createHash("sha256").update(`${appSecret}:${CSRF_SECRET_PEPPER}`, "utf-8").digest("hex");
}

export function createCsrfMiddleware(options: CsrfOptions = {}) {
  const env = getServerEnv();
  const csrfSecret = deriveCsrfSecret(env.BETTER_AUTH_SECRET);

  const { generateCsrfToken, doubleCsrfProtection, invalidCsrfTokenError } = doubleCsrf({
    getSecret: () => csrfSecret,
    getSessionIdentifier: (req) => {
      const sessionCookie = readSessionCookie(req);
      if (sessionCookie !== undefined) {
        return deriveSessionId(sessionCookie);
      }
      return deriveSessionId(`${csrfSecret}:${ANONYMOUS_SESSION_ID}`);
    },
    cookieName: env.NODE_ENV === "production" ? "__Host-saptm-csrf" : "saptm-csrf",
    cookieOptions: {
      httpOnly: true,
      sameSite: "strict",
      secure: env.NODE_ENV === "production",
      path: "/",
    },
    size: 64,
    ignoredMethods: ["GET", "HEAD", "OPTIONS"],
    getCsrfTokenFromRequest: (req) => (req.headers?.["x-csrf-token"] as string) ?? "",
  });

  const excluded = options.excludedPaths ?? [];

  return function csrfMiddleware(
    request: IncomingMessage,
    response: ServerResponse,
    next: NextFunction,
  ): void {
    const url = request.url ?? "";

    const isExcluded = excluded.some((path) => url.startsWith(path));
    if (isExcluded) {
      next();
      return;
    }

    // Skip CSRF for internal server-to-server requests (Next.js → API).
    // CORS does not expose this header to browsers, so only internal
    // services can set it.
    if (request.headers?.[INTERNAL_REQUEST_HEADER] === "true") {
      next();
      return;
    }

    if (SAFE_METHODS.has(request.method ?? "")) {
      const token = generateCsrfToken(request as never, response as never);
      response.setHeader("X-CSRF-Token", token);
      response.setHeader("Vary", "Cookie");
      next();
      return;
    }

    try {
      doubleCsrfProtection(request as never, response as never, next as never);
    } catch (error) {
      if (error === invalidCsrfTokenError) {
        response.statusCode = 403;
        response.setHeader("Content-Type", "application/json");
        response.end(
          JSON.stringify({ error: "CSRF validation failed", code: "CSRF_TOKEN_INVALID" }),
        );
        return;
      }
      next(error);
    }
  };
}

function readSessionCookie(req: IncomingMessage): string | undefined {
  const cookieHeader = req.headers?.cookie;
  if (cookieHeader === undefined) return undefined;
  const cookies = Array.isArray(cookieHeader) ? cookieHeader.join("; ") : cookieHeader;
  const match = cookies.match(/(?:^|;\s*)better-auth.session_token=([^;]+)/);
  return match?.[1];
}

function deriveSessionId(value: string): string {
  const hash = createHash("sha256").update(value, "utf-8").digest("hex");
  return `sid_${hash.slice(0, 16)}`;
}
