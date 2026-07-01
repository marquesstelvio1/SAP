import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { DatabaseActorType, PrismaTx } from "@saptm/database";
import type {
  CreateWebhookInput,
  CreateWebhookOutput,
  DeleteWebhookInput,
  DeleteWebhookOutput,
  GetWebhookDeliveryLogInput,
  GetWebhookDeliveryLogOutput,
  ListWebhooksInput,
  ListWebhooksOutput,
  UpdateWebhookInput,
  UpdateWebhookOutput,
  WebhookDeliverySummary,
} from "@saptm/rpc";
import type {
  WebhookDeliveryRecord,
  WebhookEndpointRecord,
  WebhooksRepository,
} from "./domain/webhooks.repository.js";
import { WEBHOOKS_REPOSITORY } from "./domain/webhooks.repository.js";

export type CreateWebhookServiceInput = CreateWebhookInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
};

export type UpdateWebhookServiceInput = UpdateWebhookInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
};

export type DeleteWebhookServiceInput = DeleteWebhookInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
};

export type ListWebhooksServiceInput = ListWebhooksInput & {
  organizationId: string;
};

export type GetDeliveryLogServiceInput = GetWebhookDeliveryLogInput & {
  organizationId: string;
};

@Injectable()
export class WebhooksService {
  constructor(@Inject(WEBHOOKS_REPOSITORY) private readonly repository: WebhooksRepository) {}

  async create(input: CreateWebhookServiceInput): Promise<CreateWebhookOutput> {
    const webhook = await this.repository.transaction(async (tx: PrismaTx) => {
      const created = await this.repository.createWebhook({
        organizationId: input.organizationId,
        name: input.name.trim(),
        url: input.url.trim(),
        events: input.events,
      });

      await this.repository.createAuditRecord(tx, {
        organizationId: input.organizationId,
        actorType: input.actorType,
        actorId: input.actorId,
        action: "webhook.created",
        subjectType: "webhook",
        subjectId: created.id,
        severity: "low",
        after: {
          name: created.name,
          url: created.url,
          events: created.events,
        },
        reason: "Webhook endpoint created.",
        correlationId: input.correlationId,
      });

      await this.repository.createOutboxEvent(tx, {
        organizationId: input.organizationId,
        eventType: "webhook.created",
        aggregateType: "webhook",
        aggregateId: created.id,
        payload: {
          webhookId: created.id,
          name: created.name,
          url: created.url,
          events: created.events,
        },
      });

      return created;
    });

    return {
      webhook: this.mapWebhook(webhook),
      idempotency: { key: input.idempotencyKey, replayed: false },
      audit: {
        action: "webhook.created",
        subjectType: "webhook",
        subjectId: webhook.id,
      },
      outbox: {
        eventType: "webhook.created",
        aggregateType: "webhook",
        aggregateId: webhook.id,
      },
    };
  }

  async update(input: UpdateWebhookServiceInput): Promise<UpdateWebhookOutput> {
    const existing = await this.repository.findWebhookByIdAndOrg(
      input.webhookId,
      input.organizationId,
    );

    if (existing === null) {
      throw new NotFoundException("webhook.not_found");
    }

    const webhook = await this.repository.transaction(async (tx: PrismaTx) => {
      const updated = await this.repository.updateWebhook(input.webhookId, {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.url !== undefined ? { url: input.url.trim() } : {}),
        ...(input.events !== undefined ? { events: input.events } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      });

      await this.repository.createAuditRecord(tx, {
        organizationId: input.organizationId,
        actorType: input.actorType,
        actorId: input.actorId,
        action: "webhook.updated",
        subjectType: "webhook",
        subjectId: updated.id,
        severity: "low",
        before: {
          name: existing.name,
          url: existing.url,
          events: existing.events,
          isActive: existing.isActive,
        },
        after: {
          name: updated.name,
          url: updated.url,
          events: updated.events,
          isActive: updated.isActive,
        },
        reason: "Webhook endpoint updated.",
        correlationId: input.correlationId,
      });

      await this.repository.createOutboxEvent(tx, {
        organizationId: input.organizationId,
        eventType: "webhook.updated",
        aggregateType: "webhook",
        aggregateId: updated.id,
        payload: {
          webhookId: updated.id,
          name: updated.name,
          url: updated.url,
          events: updated.events,
          isActive: updated.isActive,
        },
      });

      return updated;
    });

    return {
      webhook: this.mapWebhook(webhook),
      idempotency: { key: input.idempotencyKey, replayed: false },
      audit: {
        action: "webhook.updated",
        subjectType: "webhook",
        subjectId: webhook.id,
      },
      outbox: {
        eventType: "webhook.updated",
        aggregateType: "webhook",
        aggregateId: webhook.id,
      },
    };
  }

  async delete(input: DeleteWebhookServiceInput): Promise<DeleteWebhookOutput> {
    const existing = await this.repository.findWebhookByIdAndOrg(
      input.webhookId,
      input.organizationId,
    );

    if (existing === null) {
      throw new NotFoundException("webhook.not_found");
    }

    await this.repository.transaction(async (tx: PrismaTx) => {
      await this.repository.deleteWebhook(input.webhookId);

      await this.repository.createAuditRecord(tx, {
        organizationId: input.organizationId,
        actorType: input.actorType,
        actorId: input.actorId,
        action: "webhook.deleted",
        subjectType: "webhook",
        subjectId: input.webhookId,
        severity: "low",
        before: {
          name: existing.name,
          url: existing.url,
          events: existing.events,
          isActive: existing.isActive,
        },
        reason: "Webhook endpoint deleted.",
        correlationId: input.correlationId,
      });

      await this.repository.createOutboxEvent(tx, {
        organizationId: input.organizationId,
        eventType: "webhook.deleted",
        aggregateType: "webhook",
        aggregateId: input.webhookId,
        payload: {
          webhookId: input.webhookId,
          name: existing.name,
          url: existing.url,
          events: existing.events,
        },
      });
    });

    return {
      webhookId: input.webhookId,
      idempotency: { key: input.idempotencyKey, replayed: false },
      audit: {
        action: "webhook.deleted",
        subjectType: "webhook",
        subjectId: input.webhookId,
      },
      outbox: {
        eventType: "webhook.deleted",
        aggregateType: "webhook",
        aggregateId: input.webhookId,
      },
    };
  }

  async list(input: ListWebhooksServiceInput): Promise<ListWebhooksOutput> {
    const [webhooks, totalCount] = await this.repository.listWebhooks(
      input.organizationId,
      input.limit,
      input.offset,
    );

    return {
      webhooks: webhooks.map(this.mapWebhook),
      pagination: {
        totalCount,
        limit: input.limit,
        offset: input.offset,
      },
    };
  }

  async getDeliveryLog(input: GetDeliveryLogServiceInput): Promise<GetWebhookDeliveryLogOutput> {
    const webhook = await this.repository.findWebhookByIdAndOrg(
      input.webhookId,
      input.organizationId,
    );

    if (webhook === null) {
      throw new NotFoundException("webhook.not_found");
    }

    const [deliveries, totalCount] = await this.repository.listWebhookDeliveries(
      input.webhookId,
      input.limit,
      input.offset,
    );

    return {
      deliveries: deliveries.map(this.mapDelivery),
      pagination: {
        totalCount,
        limit: input.limit,
        offset: input.offset,
      },
    };
  }

  private mapWebhook(webhook: WebhookEndpointRecord) {
    return {
      id: webhook.id,
      organizationId: webhook.organizationId,
      name: webhook.name,
      url: webhook.url,
      events: webhook.events,
      isActive: webhook.isActive,
      lastTriggeredAt: webhook.lastTriggeredAt?.toISOString() ?? null,
      failureCount: webhook.failureCount,
      createdAt: webhook.createdAt.toISOString(),
      updatedAt: webhook.updatedAt.toISOString(),
    };
  }

  private mapDelivery(delivery: WebhookDeliveryRecord): WebhookDeliverySummary {
    return {
      id: delivery.id,
      webhookId: delivery.webhookId,
      eventType: delivery.eventType,
      status: delivery.status,
      statusCode: delivery.statusCode,
      responseBody: delivery.responseBody,
      attemptCount: delivery.attemptCount,
      nextRetryAt: delivery.nextRetryAt?.toISOString() ?? null,
      deliveredAt: delivery.deliveredAt?.toISOString() ?? null,
      createdAt: delivery.createdAt.toISOString(),
    };
  }
}
