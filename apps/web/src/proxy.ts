import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const url = new URL(request.url);
  const isDev = process.env.NODE_ENV === "development";
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? url.origin;
  const csp = buildCsp(nonce, url.origin, apiUrl, isDev);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Reporting-Endpoints", `csp-endpoint="${url.origin}/api/csp-report"`);
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
    `style-src 'self' 'nonce-${nonce}'`,
    `connect-src ${connectSources.join(" ")}`,
    `worker-src 'self' blob:`,
    `frame-src 'none'`,
    `upgrade-insecure-requests`,
    `report-uri ${reportUri}`,
    `report-to csp-endpoint`,
  ];
  return directives.join("; ");
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
