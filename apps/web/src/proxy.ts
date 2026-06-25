import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const nonce = crypto.randomUUID();
  const url = new URL(request.url);
  const csp = buildCsp(nonce, url.origin);
  const response = NextResponse.next();
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Nonce", nonce);
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  );
  response.headers.set("Vary", "Cookie");
  return response;
}

function buildCsp(nonce: string, origin: string): string {
  const directives = [
    `default-src 'self'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `object-src 'none'`,
    `img-src 'self' data: blob:`,
    `font-src 'self' data:`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'nonce-${nonce}'`,
    `connect-src 'self' ${origin}`,
    `worker-src 'self' blob:`,
    `frame-src 'none'`,
    `upgrade-insecure-requests`,
  ];
  return directives.join("; ");
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
