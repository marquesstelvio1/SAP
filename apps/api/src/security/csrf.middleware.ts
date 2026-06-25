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

export function createCsrfMiddleware(options: CsrfOptions = {}) {
  const env = getServerEnv();

  const { generateCsrfToken, doubleCsrfProtection, invalidCsrfTokenError } = doubleCsrf({
    getSecret: () => env.BETTER_AUTH_SECRET,
    getSessionIdentifier: (req) => {
      const sessionCookie = readSessionCookie(req);
      if (sessionCookie !== undefined) {
        return deriveSessionId(sessionCookie);
      }
      return deriveSessionId(env.BETTER_AUTH_SECRET);
    },
    cookieName: "__Host-saptm-csrf",
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
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    const char = value.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `sid_${Math.abs(hash).toString(36)}`;
}
