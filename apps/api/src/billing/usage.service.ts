import { Inject, Injectable } from "@nestjs/common";

import type { BillingRepository } from "./domain/billing.repository.js";
import { BILLING_REPOSITORY } from "./domain/billing.repository.js";

export type UsageLimitResult = {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
};

export type UsageLimitsResult = UsageLimitResult & { metric: string };

@Injectable()
export class UsageService {
  constructor(
    @Inject(BILLING_REPOSITORY)
    private readonly billingRepo: BillingRepository,
  ) {}

  async trackUsage(organizationId: string, metric: string, delta: number): Promise<void> {
    const record = await this.billingRepo.findUsageRecord(organizationId, metric);

    if (!record) {
      const planLimits = this.getPlanLimits("free");
      const limit = planLimits[metric as keyof typeof planLimits] ?? 0;

      await this.billingRepo.createUsageRecord({
        organizationId,
        metric,
        current: delta,
        limit,
        periodStart: new Date(),
        periodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59),
      });
      return;
    }

    await this.billingRepo.incrementUsageRecord(organizationId, metric, delta);
  }

  async checkLimit(organizationId: string, metric: string): Promise<UsageLimitResult> {
    const record = await this.billingRepo.findUsageRecord(organizationId, metric);

    if (!record) {
      return { allowed: true, current: 0, limit: 0, remaining: 0 };
    }

    return {
      allowed: record.current < record.limit,
      current: record.current,
      limit: record.limit,
      remaining: Math.max(0, record.limit - record.current),
    };
  }

  async checkLimits(organizationId: string): Promise<UsageLimitsResult[]> {
    const records = await this.billingRepo.findUsageRecords(organizationId);
    const defaultMetrics = ["members", "cargo_shipments", "tracking_events"];

    return defaultMetrics.map((metric) => {
      const record = records.find((r) => r.metric === metric);
      if (!record) {
        return { metric, allowed: true, current: 0, limit: 0, remaining: 0 };
      }
      return {
        metric,
        allowed: record.current < record.limit,
        current: record.current,
        limit: record.limit,
        remaining: Math.max(0, record.limit - record.current),
      };
    });
  }

  async resetPeriodicUsage(): Promise<void> {
    await this.billingRepo.resetExpiredUsageRecords();
  }

  async ensureUsageRecords(organizationId: string, plan: string): Promise<void> {
    const defaults: Array<{ metric: string; limit: number }> = [
      { metric: "members", limit: 5 },
      { metric: "cargo_shipments", limit: 50 },
      { metric: "tracking_events", limit: 1000 },
    ];

    const planLimits = this.getPlanLimits(plan);

    for (const { metric } of defaults) {
      await this.billingRepo.upsertUsageRecord(
        organizationId,
        metric,
        planLimits[metric as keyof typeof planLimits] ?? 0,
      );
    }
  }

  // TODO: migrate to use Plan model when available
  private getPlanLimits(plan: string): Record<string, number> {
    switch (plan) {
      case "pro":
        return { members: 50, cargo_shipments: 500, tracking_events: 10000 };
      case "enterprise":
        return { members: 9999, cargo_shipments: 99999, tracking_events: 999999 };
      default:
        return { members: 5, cargo_shipments: 50, tracking_events: 1000 };
    }
  }
}
