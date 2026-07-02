import { type NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/sign-in",
  "/forgot-password",
  "/reset-password",
  "/two-factor",
  "/accept-invitation",
] as const;

function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    pathname.startsWith("/api/")
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

export function middleware(request: NextRequest) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",").at(0)?.trim() ?? "127.0.0.1";

  if (isRateLimited(ip)) {
    if (request.headers.get("accept")?.includes("text/html")) {
      return new NextResponse(null, { status: 429, statusText: "Too Many Requests" });
    }

    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get("better-auth.session_token")?.value;

  if (sessionCookie !== undefined) {
    return NextResponse.next();
  }

  const chunkedPrefix = "better-auth.session_token.chunk";
  const hasChunkedSession = Array.from(request.cookies.getAll()).some((c) =>
    c.name.startsWith(chunkedPrefix),
  );

  if (hasChunkedSession) {
    return NextResponse.next();
  }

  const signInUrl = new URL("/sign-in", url);
  signInUrl.searchParams.set("next", pathname);

  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon|robots|sitemap).*)"],
};
