import { Inject, Injectable, Logger } from "@nestjs/common";
import type { Redis } from "ioredis";

import { REDIS_CLIENT } from "./cache.constants.js";

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly fallback = new Map<string, CacheEntry>();
  private readonly redis: Redis | null;
  private connected = false;

  constructor(@Inject(REDIS_CLIENT) redis: Redis | null) {
    this.redis = redis;
    if (this.redis !== null) {
      this.redis.on("connect", () => {
        this.connected = true;
        this.logger.log("Redis connected");
      });
      this.redis.on("error", (err: Error) => {
        this.connected = false;
        this.logger.error("Redis connection error, falling back to in-memory", err.message);
      });
      this.redis.on("close", () => {
        this.connected = false;
        this.logger.warn("Redis connection closed");
      });
      this.redis.on("reconnecting", () => {
        this.logger.log("Redis reconnecting");
      });
    } else {
      this.logger.warn("No Redis configured, using in-memory cache (single-instance only)");
    }
  }

  get isConnected(): boolean {
    return this.connected;
  }

  async get<T>(key: string): Promise<T | undefined> {
    if (this.redis !== null && this.connected) {
      try {
        const raw = await this.redis.get(key);
        if (raw === null) return undefined;
        return JSON.parse(raw) as T;
      } catch {
        return this.fallbackGet<T>(key);
      }
    }
    return this.fallbackGet<T>(key);
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (this.redis !== null && this.connected) {
      try {
        const serialized = JSON.stringify(value);
        if (ttl !== undefined) {
          await this.redis.setex(key, Math.ceil(ttl / 1000), serialized);
        } else {
          await this.redis.set(key, serialized);
        }
        return;
      } catch {
        this.fallbackSet(key, value, ttl);
        return;
      }
    }
    this.fallbackSet(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    if (this.redis !== null && this.connected) {
      try {
        await this.redis.del(key);
        return;
      } catch {
        this.fallback.delete(key);
        return;
      }
    }
    this.fallback.delete(key);
  }

  async reset(): Promise<void> {
    if (this.redis !== null && this.connected) {
      try {
        await this.redis.flushdb();
        return;
      } catch {}
    }
    this.fallback.clear();
  }

  private fallbackGet<T>(key: string): T | undefined {
    const entry = this.fallback.get(key);
    if (entry === undefined) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.fallback.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  private fallbackSet<T>(key: string, value: T, ttl?: number): void {
    this.fallback.set(key, {
      value,
      expiresAt: Date.now() + (ttl ?? 60_000),
    });
  }
}
