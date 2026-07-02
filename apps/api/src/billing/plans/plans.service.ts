import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { Plan, PlanLimits } from "@saptm/rpc";

import type { PlanRecord, PlansRepository } from "./plans.repository.js";
import { PLANS_REPOSITORY } from "./plans.repository.js";

@Injectable()
export class PlansService {
  constructor(
    @Inject(PLANS_REPOSITORY)
    private readonly plansRepo: PlansRepository,
  ) {}

  async listPlans(options?: { includeInternal?: boolean }): Promise<Plan[]> {
    const records = options?.includeInternal
      ? await this.plansRepo.findAll()
      : await this.plansRepo.findActivePublicPlans();
    return records.map((r) => this.toPlan(r));
  }

  async getPlanBySlug(slug: string): Promise<Plan> {
    const record = await this.plansRepo.findBySlug(slug);
    if (!record) throw new NotFoundException("plans.nao_encontrado");
    return this.toPlan(record);
  }

  async findPlanForOrg(organizationId: string): Promise<Plan | null> {
    const { getPrismaClient } = await import("@saptm/database");
    const client = getPrismaClient();
    const subscription = await client.subscription.findUnique({
      where: { organizationId },
    });
    if (!subscription) return null;
    const planSlug = subscription.plan as string;
    const record = await this.plansRepo.findBySlug(planSlug);
    return record ? this.toPlan(record) : null;
  }

  private toPlan(record: PlanRecord): Plan {
    const features =
      (record.features as Array<{
        key: string;
        label: string;
        included: boolean;
        limit?: string;
      }>) ?? [];
    const limitsRaw = (record.limits as Record<string, unknown>) ?? {};
    const limits: PlanLimits = {
      maxMembers: (limitsRaw.maxMembers as number) ?? 5,
      maxCargos: (limitsRaw.maxCargos as number) ?? 50,
      maxTrackingEvents: (limitsRaw.maxTrackingEvents as number) ?? 1000,
      maxApiCalls: (limitsRaw.maxApiCalls as number) ?? 1000,
      maxTeams: (limitsRaw.maxTeams as number) ?? 0,
      hasSso: (limitsRaw.hasSso as boolean) ?? false,
      hasApi: (limitsRaw.hasApi as boolean) ?? false,
      hasWebhooks: (limitsRaw.hasWebhooks as boolean) ?? false,
      hasReports: (limitsRaw.hasReports as boolean) ?? true,
      hasAuditLog: (limitsRaw.hasAuditLog as boolean) ?? false,
    };
    return {
      id: record.id,
      slug: record.slug as "free" | "pro" | "enterprise",
      name: record.name,
      description: record.description,
      price: record.price,
      currency: record.currency,
      interval: record.interval,
      features,
      limits,
      isPublic: record.isPublic,
      sortOrder: record.sortOrder,
    };
  }
}
