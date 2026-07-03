import { Injectable } from "@nestjs/common";
import { getPrismaClient, type PrismaTx, type SaptmPrismaClient } from "@saptm/database";

import type {
  ActiveEndpointRecord,
  CreateWebhookData,
  CreateWebhookDeliveryInput,
  PrismaAuditRecordCreateInput,
  PrismaOutboxEventCreateInput,
  UpdateWebhookData,
  WebhookDeliveryRecord,
  WebhookEndpointRecord,
  WebhooksRepository,
} from "../domain/webhooks.repository.js";

@Injectable()
export class PrismaWebhooksRepository implements WebhooksRepository {
  private readonly database: SaptmPrismaClient = getPrismaClient();

  async createWebhook(data: CreateWebhookData): Promise<WebhookEndpointRecord> {
    return this.database.webhookEndpoint.create({ data });
  }

  async findWebhookByIdAndOrg(
    webhookId: string,
    organizationId: string,
  ): Promise<WebhookEndpointRecord | null> {
    return this.database.webhookEndpoint.findFirst({
      where: { id: webhookId, organizationId },
    });
  }

  async updateWebhook(webhookId: string, data: UpdateWebhookData): Promise<WebhookEndpointRecord> {
    return this.database.webhookEndpoint.update({
      where: { id: webhookId },
      data,
    });
  }

  async deleteWebhook(webhookId: string): Promise<void> {
    await this.database.webhookEndpoint.update({
      where: { id: webhookId },
      data: { deletedAt: new Date() },
    });
  }

  async listWebhooks(
    organizationId: string,
    limit: number,
    offset: number,
  ): Promise<[WebhookEndpointRecord[], number]> {
    const where = { organizationId };
    const [webhooks, totalCount] = await Promise.all([
      this.database.webhookEndpoint.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      this.database.webhookEndpoint.count({ where }),
    ]);

    return [webhooks, totalCount];
  }

  async listWebhookDeliveries(
    webhookId: string,
    limit: number,
    offset: number,
  ): Promise<[WebhookDeliveryRecord[], number]> {
    const where = { webhookId };
    const [deliveries, totalCount] = await Promise.all([
      this.database.webhookDelivery.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      this.database.webhookDelivery.count({ where }),
    ]);

    return [deliveries, totalCount];
  }

  async findActiveEndpointsByEvent(
    organizationId: string,
    eventType: string,
  ): Promise<ActiveEndpointRecord[]> {
    return this.database.webhookEndpoint.findMany({
      where: {
        organizationId,
        isActive: true,
        events: { has: eventType },
      },
      select: {
        id: true,
        url: true,
        secret: true,
      },
    }) as unknown as Promise<ActiveEndpointRecord[]>;
  }

  async createWebhookDelivery(data: CreateWebhookDeliveryInput): Promise<void> {
    await this.database.webhookDelivery.create({
      data: {
        webhookId: data.webhookId,
        eventType: data.eventType,
        payload: data.payload as never,
        status: data.status,
        statusCode: data.statusCode,
        responseBody: data.responseBody,
        attemptCount: data.attemptCount,
        deliveredAt: data.deliveredAt,
        nextRetryAt: data.nextRetryAt,
      },
    });
  }

  async updateEndpointSuccess(webhookId: string): Promise<void> {
    await this.database.webhookEndpoint.update({
      where: { id: webhookId },
      data: {
        lastTriggeredAt: new Date(),
        failureCount: 0,
      },
    });
  }

  async updateEndpointFailure(webhookId: string): Promise<void> {
    await this.database.webhookEndpoint.update({
      where: { id: webhookId },
      data: {
        failureCount: { increment: 1 },
      },
    });
  }

  async createAuditRecord(tx: PrismaTx, input: PrismaAuditRecordCreateInput): Promise<void> {
    await tx.auditRecord.create({ data: input as never });
  }

  async createOutboxEvent(tx: PrismaTx, input: PrismaOutboxEventCreateInput): Promise<void> {
    await tx.outboxEvent.create({ data: input as never });
  }

  async transaction<T>(fn: (tx: PrismaTx) => Promise<T>): Promise<T> {
    return this.database.$transaction(fn);
  }
}
