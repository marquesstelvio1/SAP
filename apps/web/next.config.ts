import type { NextConfig } from "next";

const webSecurityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "connect-src 'self' http: https:",
    ].join("; "),
  },
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
  reactStrictMode: true,
  serverExternalPackages: [
    "@better-auth/kysely-adapter",
    "@prisma/client",
    "@saptm/auth",
    "@saptm/database",
    "better-auth",
    "kysely",
  ],
  turbopack: {
    resolveAlias: {
      "@saptm/auth": "../../packages/auth/dist/index.js",
      "@saptm/auth/client": "../../packages/auth/dist/client.js",
      "@saptm/auth/server": "../../packages/auth/dist/server.js",
      "@saptm/config": "../../packages/config/dist/index.js",
      "@saptm/database": "../../packages/database/dist/index.js",
      "@saptm/observability": "../../packages/observability/dist/index.js",
      "@saptm/rpc": "../../packages/rpc/dist/index.js",
      "@saptm/ui": "../../packages/ui/dist/index.js",
      "@saptm/ui/styles.css": "../../packages/ui/src/styles/globals.css",
    },
  },
  typedRoutes: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [...webSecurityHeaders],
      },
    ];
  },
};

export default nextConfig;
