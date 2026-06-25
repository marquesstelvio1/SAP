import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { seconds, ThrottlerModule } from "@nestjs/throttler";
import type { Redis } from "ioredis";

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
            limit: 200,
            getTracker: (req) => req.ip || "anonymous",
          },
          {
            name: "org",
            ttl: seconds(60),
            limit: 1000,
          },
          {
            name: "user",
            ttl: seconds(60),
            limit: 100,
            getTracker: (req) => {
              const authContext = (req as any).authContext;
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
        skipIf: (_ctx) => {
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
