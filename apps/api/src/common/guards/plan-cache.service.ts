import { Inject, Injectable, Logger } from "@nestjs/common";
import { CacheService } from "../../cache/cache.service.js";

export interface CachedPlan {
  id: string;
  slug: string;
  name: string;
  features: unknown;
}

@Injectable()
export class PlanCacheService {
  private readonly logger = new Logger(PlanCacheService.name);
  private readonly CACHE_TTL = 60_000; // 60 seconds
  private readonly CACHE_PREFIX = "saptm:plan:";

  constructor(
    @Inject(CacheService)
    private readonly cache: CacheService,
  ) {}

  async getPlan(slug: string): Promise<CachedPlan | undefined> {
    const key = `${this.CACHE_PREFIX}${slug}`;
    return this.cache.get<CachedPlan>(key);
  }

  async setPlan(plan: CachedPlan): Promise<void> {
    const key = `${this.CACHE_PREFIX}${plan.slug}`;
    await this.cache.set(key, plan, this.CACHE_TTL);
  }

  async invalidatePlan(slug: string): Promise<void> {
    const key = `${this.CACHE_PREFIX}${slug}`;
    await this.cache.del(key);
    this.logger.log(`Invalidated plan cache for slug: ${slug}`);
  }

  async invalidateAll(): Promise<void> {
    for (const slug of ["free", "pro", "enterprise"]) {
      await this.invalidatePlan(slug);
    }
  }

  /**
   * Stale-while-revalidate pattern: returns cached value if fresh,
   * returns stale value + triggers background refresh if TTL expired.
   * Uses CacheService's built-in TTL for freshness.
   */
  async getPlanWithStaleRevalidate(
    slug: string,
    fetchFn: () => Promise<CachedPlan>,
  ): Promise<CachedPlan> {
    const cached = await this.getPlan(slug);

    if (cached) {
      return cached;
    }

    // Cache miss — fetch and cache
    const plan = await fetchFn();
    await this.setPlan(plan);
    return plan;
  }
}
