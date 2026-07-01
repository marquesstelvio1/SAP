import "reflect-metadata";

import path from "node:path";
import dotenv from "dotenv";

// dotenv/config loads from CWD (apps/api), but .env is at the monorepo root.
dotenv.config({ path: path.resolve(import.meta.dirname, "../../../.env") });

import { NestFactory } from "@nestjs/core";
import { getServerEnv, getTrustedOrigins, type ServerEnv } from "@saptm/config";
import cookieParser from "cookie-parser";

import { AppModule } from "./app.module.js";
import { initOpenTelemetry } from "./observability/opentelemetry.js";
import { RpcExceptionFilter } from "./rpc/exception.filter.js";
import { createCsrfMiddleware } from "./security/csrf.middleware.js";
import { applySecurityHeaders } from "./security/security-headers.js";

async function bootstrap() {
  initOpenTelemetry();

  const env = getServerEnv();
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.enableShutdownHooks();
  // trust proxy — required for correct req.ip behind reverse proxies (rate limiting)
  app.getHttpAdapter().getInstance().set("trust proxy", 1);
  app.use(applySecurityHeaders);
  app.use(cookieParser(env.BETTER_AUTH_SECRET));
  app.use(
    createCsrfMiddleware({
      excludedPaths: ["/health", "/api/auth", "/billing/webhook"],
    }),
  );
  app.enableCors(createCorsOptions(env));
  app.useGlobalFilters(new RpcExceptionFilter());

  await app.listen(env.API_PORT);
}

await bootstrap();

function createCorsOptions(env: ServerEnv) {
  return {
    origin: getTrustedOrigins(env),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "authorization",
      "content-type",
      "cookie",
      "x-api-key",
      "x-actor-id",
      "x-actor-type",
      "x-correlation-id",
      "x-request-id",
      "x-tenant-id",
      "x-csrf-token",
    ],
  };
}
