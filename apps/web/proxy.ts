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

function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    pathname.startsWith("/api/")
  );
}

function isStaticAsset(pathname: string): boolean {
  return STATIC_PREFIXES.some((p) => pathname.startsWith(p));
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

function buildCsp(nonce: string, origin: string, apiUrl: string, isDev: boolean): string {
  const scriptSrc = isDev
    ? `'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`
    : `'nonce-${nonce}' 'strict-dynamic'`;

  const reportUri = `${origin}/api/csp-report`;
  const connectSources = [`'self'`, origin];
  if (apiUrl !== origin) {
    connectSources.push(apiUrl);
  }

  const directives = [
    `default-src 'self'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `object-src 'none'`,
    `img-src 'self' data: blob: https:`,
    `font-src 'self' data:`,
    `script-src 'self' ${scriptSrc}`,
    `style-src 'self' 'unsafe-inline'`,
    `connect-src ${connectSources.join(" ")}`,
    `worker-src 'self' blob:`,
    `frame-src 'none'`,
    `upgrade-insecure-requests`,
    `report-uri ${reportUri}`,
    `report-to csp-endpoint`,
  ];
  return directives.join("; ");
}

function respondWithSecurityHeaders(nonce: string, origin: string, apiUrl: string, isDev: boolean) {
  const csp = buildCsp(nonce, origin, apiUrl, isDev);
  const response = NextResponse.next();
  response.headers.set("x-nonce", nonce);
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Reporting-Endpoints", `csp-endpoint="${origin}/api/csp-report"`);
  response.headers.set("X-Nonce", nonce);
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  );
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  response.headers.set("Cache-Control", "private, no-cache, no-store");
  response.headers.set("Vary", "Cookie");
  return response;
}

export function proxy(request: NextRequest) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const isDev = process.env.NODE_ENV === "development";
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? url.origin;

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  if (isPublicPath(pathname) || isStaticAsset(pathname)) {
    return respondWithSecurityHeaders(nonce, url.origin, apiUrl, isDev);
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",").at(0)?.trim() ?? "127.0.0.1";

  if (isRateLimited(ip)) {
    if (request.headers.get("accept")?.includes("text/html")) {
      return new NextResponse(null, { status: 429, statusText: "Too Many Requests" });
    }

    return respondWithSecurityHeaders(nonce, url.origin, apiUrl, isDev);
  }

  const sessionCookie = request.cookies.get("better-auth.session_token")?.value;

  if (sessionCookie !== undefined) {
    return respondWithSecurityHeaders(nonce, url.origin, apiUrl, isDev);
  }

  const chunkedPrefix = "better-auth.session_token.chunk";
  const hasChunkedSession = Array.from(request.cookies.getAll()).some((c) =>
    c.name.startsWith(chunkedPrefix),
  );

  if (hasChunkedSession) {
    return respondWithSecurityHeaders(nonce, url.origin, apiUrl, isDev);
  }

  const signInUrl = new URL("/sign-in", url);
  signInUrl.searchParams.set("next", pathname);

  return NextResponse.redirect(signInUrl);
}
