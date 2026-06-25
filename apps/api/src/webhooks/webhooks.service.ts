import { Inject, Injectable, NotFoundException } from "@nestjs/common";
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

import type { WebhooksRepository } from "./domain/webhooks.repository.js";
import type {
  WebhookDeliveryRecord,
  WebhookEndpointRecord,
} from "./domain/webhooks.repository.js";
import { WEBHOOKS_REPOSITORY } from "./domain/webhooks.repository.js";

export type CreateWebhookServiceInput = CreateWebhookInput & {
  organizationId: string;
};

export type UpdateWebhookServiceInput = UpdateWebhookInput & {
  organizationId: string;
};

export type DeleteWebhookServiceInput = DeleteWebhookInput & {
  organizationId: string;
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
    const webhook = await this.repository.createWebhook({
      organizationId: input.organizationId,
      name: input.name.trim(),
      url: input.url.trim(),
      events: input.events,
    });

    return {
      webhook: this.mapWebhook(webhook),
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

    const webhook = await this.repository.updateWebhook(input.webhookId, {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.url !== undefined ? { url: input.url.trim() } : {}),
      ...(input.events !== undefined ? { events: input.events } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    });

    return {
      webhook: this.mapWebhook(webhook),
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

    await this.repository.deleteWebhook(input.webhookId);

    return { webhookId: input.webhookId };
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
