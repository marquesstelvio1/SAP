import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/sign-in",
  "/forgot-password",
  "/reset-password",
  "/two-factor",
  "/accept-invitation",
] as const;

const STATIC_PREFIXES = [
  "/_next/static/",
  "/__nextjs_original-stack-frame",
  "/sentry-tunnel",
  "/favicon.ico",
  "/robots.txt",
] as const;

// Additional path patterns that are always static and should bypass auth.
// These extend the prefix-based check with suffix matching for completeness.
const STATIC_SUFFIXES = [".map", ".webmanifest"] as const;

function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    pathname.startsWith("/api/")
  );
}

function isStaticAsset(pathname: string): boolean {
  return (
    STATIC_PREFIXES.some((p) => pathname.startsWith(p)) ||
    STATIC_SUFFIXES.some((s) => pathname.endsWith(s))
  );
}

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;

type IpEntry = {
  count: number;
  resetAt: number;
};

const localRateMap = new Map<string, IpEntry>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = localRateMap.get(ip);

  if (entry === undefined || now >= entry.resetAt) {
    localRateMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;

  if (entry.count > RATE_LIMIT_MAX) {
    return true;
  }

  return false;
}

function isAuthPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function buildCsp(
  nonce: string,
  origin: string,
  apiUrl: string,
  isDev: boolean,
  isAuthPath: boolean,
): string {
  const scriptSrc = isDev
    ? `'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`
    : `'nonce-${nonce}' 'strict-dynamic'`;

  const reportUri = `${origin}/api/csp-report`;
  const connectSources = [`'self'`, origin];
  if (apiUrl !== origin) {
    connectSources.push(apiUrl);
  }

  const imgSrc = isAuthPath ? `'self' data:` : `'self' data: blob: https:`;
  const workerSrc = isAuthPath ? `'none'` : `'self' blob:`;

  const directives = [
    `default-src 'self'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `object-src 'none'`,
    `img-src ${imgSrc}`,
    `font-src 'self' data:`,
    `script-src 'self' ${scriptSrc}`,
    `style-src-attr 'unsafe-inline'`,
    `style-src-elem 'self' 'nonce-${nonce}'`,
    `connect-src ${connectSources.join(" ")}`,
    `worker-src ${workerSrc}`,
    `frame-src 'none'`,
    `upgrade-insecure-requests`,
    `report-uri ${reportUri}`,
    `report-to csp-endpoint`,
  ];
  return directives.join("; ");
}

function respondWithSecurityHeaders(
  nonce: string,
  origin: string,
  apiUrl: string,
  isDev: boolean,
  request: NextRequest,
  isAuthPath: boolean = false,
) {
  const csp = buildCsp(nonce, origin, apiUrl, isDev, isAuthPath);

  // Forward nonce to React tree via request headers (needed for headers() in Server Components)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  // Create response with modified request headers upstream
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Set CSP and security headers on the response (for the browser)
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Reporting-Endpoints", `csp-endpoint="${origin}/api/csp-report"`);
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), geolocation=(), microphone=(), interest-cohort=(), payment=(), usb=()",
  );
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");

  // Only prevent caching for HTML responses; let Next.js control static asset caching
  if (request.headers.get("accept")?.includes("text/html")) {
    response.headers.set("Cache-Control", "private, no-cache, no-store");
    response.headers.set("Vary", "Cookie");
  }

  return response;
}

export function proxy(request: NextRequest) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const isDev = process.env.NODE_ENV === "development";
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? url.origin;

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  if (isPublicPath(pathname) || isStaticAsset(pathname)) {
    return respondWithSecurityHeaders(
      nonce,
      url.origin,
      apiUrl,
      isDev,
      request,
      isAuthPath(pathname),
    );
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",").at(0)?.trim() ?? "127.0.0.1";

  if (isRateLimited(ip)) {
    if (request.headers.get("accept")?.includes("text/html")) {
      return new NextResponse(null, { status: 429, statusText: "Too Many Requests" });
    }

    return respondWithSecurityHeaders(
      nonce,
      url.origin,
      apiUrl,
      isDev,
      request,
      isAuthPath(pathname),
    );
  }

  const SESSION_COOKIE_NAMES = [
    "better-auth.session_token",
    "__Secure-better-auth.session_token",
  ] as const;

  const sessionCookie = SESSION_COOKIE_NAMES.reduce<string | undefined>(
    (found, name) => found ?? request.cookies.get(name)?.value,
    undefined,
  );

  if (sessionCookie !== undefined) {
    return respondWithSecurityHeaders(
      nonce,
      url.origin,
      apiUrl,
      isDev,
      request,
      isAuthPath(pathname),
    );
  }

  const CHUNKED_PREFIXES = [
    "better-auth.session_token.chunk",
    "__Secure-better-auth.session_token.chunk",
  ] as const;
  const hasChunkedSession = Array.from(request.cookies.getAll()).some((c) =>
    CHUNKED_PREFIXES.some((p) => c.name.startsWith(p)),
  );

  if (hasChunkedSession) {
    return respondWithSecurityHeaders(
      nonce,
      url.origin,
      apiUrl,
      isDev,
      request,
      isAuthPath(pathname),
    );
  }

  const signInUrl = new URL("/sign-in", url);
  signInUrl.searchParams.set("next", pathname);

  return NextResponse.redirect(signInUrl);
}
