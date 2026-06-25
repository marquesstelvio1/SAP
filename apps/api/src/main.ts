import "reflect-metadata";

import { NestFactory } from "@nestjs/core";
import { getServerEnv, getTrustedOrigins, type ServerEnv } from "@saptm/config";
import cookieParser from "cookie-parser";

import { AppModule } from "./app.module.js";
import { RpcExceptionFilter } from "./rpc/exception.filter.js";
import { createCsrfMiddleware } from "./security/csrf.middleware.js";
import { applySecurityHeaders } from "./security/security-headers.js";

async function bootstrap() {
  const env = getServerEnv();
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.enableShutdownHooks();
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
      "x-internal-request",
    ],
  };
}
