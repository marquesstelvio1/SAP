import { Injectable } from "@nestjs/common";
import { getPrismaClient, type SaptmPrismaClient } from "@saptm/database";

import type { PlanRecord, PlansRepository } from "./plans.repository.js";

@Injectable()
export class PrismaPlansRepository implements PlansRepository {
  private readonly database: SaptmPrismaClient = getPrismaClient();

  async findAll(_options?: { includeInternal?: boolean }): Promise<PlanRecord[]> {
    const records = await this.database.plan.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return records as unknown as PlanRecord[];
  }

  async findBySlug(slug: string): Promise<PlanRecord | null> {
    const record = await this.database.plan.findUnique({
      where: { slug },
    });

    return record as unknown as PlanRecord | null;
  }

  async findActivePublicPlans(): Promise<PlanRecord[]> {
    const records = await this.database.plan.findMany({
      where: {
        active: true,
        isPublic: true,
        deletedAt: null,
      },
      orderBy: { sortOrder: "asc" },
    });

    return records as unknown as PlanRecord[];
  }
}
