import nextBundleAnalyzer from "@next/bundle-analyzer";
import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withBundleAnalyzer = nextBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const staticHeaders = [
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), geolocation=(), microphone=(), payment=(), usb=()",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
] as const;

function buildCsp(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
  const apiOrigin = apiUrl ? new URL(apiUrl).origin : "";

  const connectSrc = apiOrigin && apiOrigin !== "http://localhost:3000" && apiOrigin !== "https://saptm.pt"
    ? `connect-src 'self' ${apiOrigin}`
    : "connect-src 'self'";

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "script-src 'self' 'unsafe-eval'",
    "style-src 'self'",
    connectSrc,
    "worker-src 'self' blob:",
    "frame-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  serverExternalPackages: ["@better-auth/kysely-adapter", "better-auth", "kysely"],
  typedRoutes: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: buildCsp() },
          ...staticHeaders,
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(
  withSentryConfig(withNextIntl(nextConfig), {
    ...(process.env.SENTRY_ORG ? { org: process.env.SENTRY_ORG } : {}),
    ...(process.env.SENTRY_PROJECT ? { project: process.env.SENTRY_PROJECT } : {}),
    ...(process.env.SENTRY_AUTH_TOKEN ? { authToken: process.env.SENTRY_AUTH_TOKEN } : {}),
    tunnelRoute: "/sentry-tunnel",
    silent: !process.env.CI,
    hideSourceMaps: true,
    disableLogger: true,
    automaticVercelMonitors: false,
  }),
);
