import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import type { OnModuleDestroy } from "@nestjs/common";
import { Global, Inject, Logger, Module } from "@nestjs/common";
import { getServerEnv } from "@saptm/config";
import type { Redis } from "ioredis";
import { Redis as IORedis } from "ioredis";

import { REDIS_CLIENT } from "./cache.constants.js";
import { CacheService } from "./cache.service.js";

@Global()
@Module({
  providers: [
    CacheService,
    {
      provide: REDIS_CLIENT,
      useFactory: () => {
        const env = getServerEnv();
        const redisUrl = env.REDIS_URL;

        if (redisUrl === undefined) {
          return null;
        }

        const client: Redis = new IORedis(redisUrl, {
          maxRetriesPerRequest: 3,
          retryStrategy(times: number) {
            if (times > 10) return null;
            return Math.min(times * 100, 3000);
          },
          enableReadyCheck: true,
          lazyConnect: true,
        });

        client.connect().catch((err: Error) => {
          new Logger("RedisModule").error("Redis initial connection failed", err.message);
        });

        return client;
      },
    },
    {
      provide: CACHE_MANAGER,
      useFactory: (cacheService: CacheService) => ({
        get: <T>(key: string) => cacheService.get<T>(key),
        set: <T>(key: string, value: T, ttl?: number) => cacheService.set<T>(key, value, ttl),
        del: (key: string) => cacheService.del(key),
        clear: () => cacheService.reset(),
      }),
      inject: [CacheService],
    },
    {
      provide: Cache,
      useExisting: CACHE_MANAGER,
    },
  ],
  exports: [CACHE_MANAGER, Cache, CacheService, REDIS_CLIENT],
})
export class CacheModule implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis | null) {}

  async onModuleDestroy(): Promise<void> {
    if (this.redis !== null) {
      await this.redis.quit();
    }
  }
}
