import { Injectable } from "@nestjs/common";
import { getPrismaClient, type SaptmPrismaClient } from "@saptm/database";

import type {
  BillingRepository,
  InvoiceCreateInput,
  InvoiceRecord,
  OrganizationWithSubscription,
  SubscriptionRecord,
  SubscriptionUpsertInput,
  UsageRecordCreateInput,
  UsageRecordRecord,
} from "../domain/billing.repository.js";

@Injectable()
export class PrismaBillingRepository implements BillingRepository {
  private readonly database: SaptmPrismaClient = getPrismaClient();

  async findOrganizationWithDetails(
    organizationId: string,
  ): Promise<OrganizationWithSubscription | null> {
    const org = await this.database.organization.findUnique({
      where: { id: organizationId },
      include: {
        subscription: true,
        memberships: { take: 1, include: { user: true } },
      },
    });

    return org as unknown as OrganizationWithSubscription | null;
  }

  async findSubscription(organizationId: string): Promise<SubscriptionRecord | null> {
    const subscription = await this.database.subscription.findUnique({
      where: { organizationId },
    });

    return subscription as unknown as SubscriptionRecord | null;
  }

  async findSubscriptionByStripeId(
    stripeSubscriptionId: string,
  ): Promise<{ organizationId: string } | null> {
    return this.database.subscription.findFirst({
      where: { stripeSubscriptionId },
      select: { organizationId: true },
    }) as unknown as { organizationId: string } | null;
  }

  async upsertSubscription(organizationId: string, data: SubscriptionUpsertInput): Promise<void> {
    await this.database.subscription.upsert({
      where: { organizationId },
      create: { organizationId, ...data },
      update: data,
    });
  }

  async updateSubscriptionStatus(organizationId: string, status: string): Promise<void> {
    await this.database.subscription.update({
      where: { organizationId },
      data: { status },
    });
  }

  async findInvoices(organizationId: string, limit: number, offset = 0): Promise<InvoiceRecord[]> {
    const invoices = await this.database.invoice.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    return invoices as unknown as InvoiceRecord[];
  }

  async countInvoices(organizationId: string): Promise<number> {
    return this.database.invoice.count({
      where: { organizationId },
    });
  }

  async createInvoice(data: InvoiceCreateInput): Promise<void> {
    await this.database.invoice.create({ data: data as never });
  }

  async findUsageRecords(organizationId: string): Promise<UsageRecordRecord[]> {
    const records = await this.database.usageRecord.findMany({
      where: { organizationId },
    });

    return records as unknown as UsageRecordRecord[];
  }

  async findUsageRecord(organizationId: string, metric: string): Promise<UsageRecordRecord | null> {
    const record = await this.database.usageRecord.findUnique({
      where: { organizationId_metric: { organizationId, metric } },
    });

    return record as unknown as UsageRecordRecord | null;
  }

  async createUsageRecord(data: UsageRecordCreateInput): Promise<void> {
    await this.database.usageRecord.create({ data: data as never });
  }

  async incrementUsageRecord(organizationId: string, metric: string, delta: number): Promise<void> {
    await this.database.usageRecord.update({
      where: { organizationId_metric: { organizationId, metric } },
      data: { current: { increment: delta } },
    });
  }

  async resetExpiredUsageRecords(): Promise<void> {
    const now = new Date();
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    await this.database.usageRecord.updateMany({
      where: { periodEnd: { lt: now } },
      data: {
        current: 0,
        periodStart: now,
        periodEnd,
      },
    });
  }

  async upsertUsageRecord(organizationId: string, metric: string, limit: number): Promise<void> {
    const periodEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59);

    await this.database.usageRecord.upsert({
      where: { organizationId_metric: { organizationId, metric } },
      create: {
        organizationId,
        metric,
        current: 0,
        limit,
        periodStart: new Date(),
        periodEnd,
      },
      update: { limit },
    });
  }
}
