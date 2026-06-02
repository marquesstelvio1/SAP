import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: [
    "@better-auth/kysely-adapter",
    "@prisma/client",
    "@saptm/auth",
    "@saptm/database",
    "better-auth",
    "kysely",
  ],
  typedRoutes: true,
};

export default nextConfig;
