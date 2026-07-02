import path from "node:path";
import nextBundleAnalyzer from "@next/bundle-analyzer";
import { withSentryConfig } from "@sentry/nextjs";
import dotenv from "dotenv";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Next.js auto-loads .env* from its project root (apps/web). Since .env
// lives at the monorepo root, load it explicitly.
dotenv.config({ path: path.resolve(import.meta.dirname, "../../.env") });

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

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(import.meta.dirname, "../../"),
  reactStrictMode: true,
  serverExternalPackages: ["@better-auth/kysely-adapter", "better-auth", "kysely"],
  typedRoutes: true,
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 86_400,
  },
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [...staticHeaders],
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
