import type { ThrottlerStorage } from "@nestjs/throttler";
import { Redis } from "ioredis";

type ThrottlerStorageRecord = {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
};

export class RedisThrottlerStorage implements ThrottlerStorage {
  constructor(private readonly redis: Redis) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const redisKey = `saptm:throttler:${throttlerName}:${key}`;
    const blockKey = `saptm:throttler:block:${throttlerName}:${key}`;

    const isBlockedVal = await this.redis.get(blockKey);
    if (isBlockedVal !== null) {
      const timeToBlockExpire = await this.redis.ttl(blockKey);
      return {
        totalHits: limit + 1,
        timeToExpire: Math.ceil(ttl / 1000),
        isBlocked: true,
        timeToBlockExpire: Math.max(timeToBlockExpire, 0),
      };
    }

    const current = await this.redis.incr(redisKey);

    if (current === 1) {
      await this.redis.pexpire(redisKey, ttl);
    }

    if (current > limit) {
      await this.redis.setex(blockKey, Math.ceil(blockDuration / 1000), "1");

      return {
        totalHits: current,
        timeToExpire: Math.ceil(ttl / 1000),
        isBlocked: true,
        timeToBlockExpire: Math.ceil(blockDuration / 1000),
      };
    }

    const pttl = await this.redis.pttl(redisKey);

    return {
      totalHits: current,
      timeToExpire: Math.ceil(Math.max(pttl, 0) / 1000),
      isBlocked: false,
      timeToBlockExpire: 0,
    };
  }
}
