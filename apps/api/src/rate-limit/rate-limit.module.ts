import { type ExecutionContext, Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { seconds, ThrottlerModule } from "@nestjs/throttler";
import type { Redis } from "ioredis";

import { getAuthContextFromRequest } from "../auth/auth-context.js";
import { REDIS_CLIENT } from "../cache/cache.constants.js";
import { RedisThrottlerStorage } from "./redis-throttler-storage.js";
import { TenantThrottlerGuard } from "./tenant-throttler.guard.js";

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: [REDIS_CLIENT],
      useFactory: (redis: Redis | null) => ({
        throttlers: [
          {
            name: "api",
            ttl: seconds(60),
            limit: 600,
            getTracker: (req) => req.ip || "anonymous",
          },
          {
            name: "org",
            ttl: seconds(60),
            limit: 3000,
          },
          {
            name: "user",
            ttl: seconds(60),
            limit: 600,
            getTracker: (req) => {
              const authContext = getAuthContextFromRequest(req);
              if (authContext?.userId) {
                return `user:${authContext.userId}`;
              }
              return authContext?.organizationId
                ? `org:${authContext.organizationId}`
                : req.ip || "anonymous";
            },
          },
        ],
        ...(redis !== null ? { storage: new RedisThrottlerStorage(redis) } : {}),
        skipIf: (ctx: ExecutionContext) => {
          const req = ctx.switchToHttp().getRequest();
          if (req?.headers?.["x-internal-request"] === "true") {
            return true;
          }
          const env = process.env.NODE_ENV;
          return env === "development" || env === "test";
        },
        errorMessage: "O limite de requisicoes foi excedido. Tente novamente mais tarde.",
        setHeaders: true,
      }),
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: TenantThrottlerGuard,
    },
  ],
})
export class RateLimitModule {}
