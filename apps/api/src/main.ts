import "reflect-metadata";

import { NestFactory } from "@nestjs/core";
import { getServerEnv, getTrustedOrigins, type ServerEnv } from "@saptm/config";

import { AppModule } from "./app.module.js";
import { applySecurityHeaders } from "./security/security-headers.js";

async function bootstrap() {
  const env = getServerEnv();
  const app = await NestFactory.create(AppModule);

  app.enableShutdownHooks();
  app.use(applySecurityHeaders);
  app.enableCors(createCorsOptions(env));

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
    ],
  };
}
