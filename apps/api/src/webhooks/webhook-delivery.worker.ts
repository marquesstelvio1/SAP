import { createHmac } from "node:crypto";
import { Inject, Injectable, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";
import { createConsoleLogger, createTraceContext } from "@saptm/observability";
import type { Subscription } from "rxjs";
import { EventBusService } from "../event-bus/event-bus.service.js";

import type { WebhooksRepository } from "./domain/webhooks.repository.js";
import { WEBHOOKS_REPOSITORY } from "./domain/webhooks.repository.js";

const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 2_000;

function createWebhookLogger() {
  return createConsoleLogger({
    serviceName: "@saptm/api",
    environment:
      process.env.NODE_ENV === "production"
        ? "production"
        : process.env.NODE_ENV === "test"
          ? "test"
          : "development",
    defaultContext: createTraceContext({
      operationName: "webhook.delivery",
      sourceSystem: "apps/api",
    }),
    minimumLevel: "info",
  });
}

@Injectable()
export class WebhookDeliveryWorker implements OnModuleDestroy, OnModuleInit {
  private subscription: Subscription | null = null;
  private readonly logger = createWebhookLogger();

  constructor(
    @Inject(EventBusService) private readonly eventBus: EventBusService,
    @Inject(WEBHOOKS_REPOSITORY) private readonly repository: WebhooksRepository,
  ) {}

  onModuleInit(): void {
    this.subscription = this.eventBus.subscribeAll(async (event) => {
      try {
        await this.deliverToWebhooks(event);
      } catch (error) {
        this.logger.error("WebhookDeliveryWorker error processing event.", {
          attributes: { "event.type": event.eventType },
          error,
        });
      }
    });
  }

  onModuleDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private async deliverToWebhooks(event: {
    organizationId?: string | null;
    eventType: string;
    payload: unknown;
  }): Promise<void> {
    if (event.organizationId === undefined || event.organizationId === null) {
      return;
    }

    const endpoints = await this.repository.findActiveEndpointsByEvent(
      event.organizationId,
      event.eventType,
    );

    const deliveryPromises = endpoints.map((endpoint) => this.deliverToEndpoint(endpoint, event));

    await Promise.allSettled(deliveryPromises);
  }

  private async deliverToEndpoint(
    endpoint: { id: string; url: string; secret: string | null },
    event: { eventType: string; payload: unknown },
  ): Promise<void> {
    const payload = JSON.stringify({
      eventType: event.eventType,
      timestamp: new Date().toISOString(),
      data: event.payload,
    });

    const signature = this.signPayload(payload, endpoint.secret);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "SAPTM-Webhook/1.0",
      "X-SAPTM-Signature": signature,
      "X-SAPTM-Event": event.eventType,
    };

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(endpoint.url, {
          method: "POST",
          headers,
          body: payload,
          signal: AbortSignal.timeout(10_000),
        });

        const responseBody = await response.text();

        await this.recordDelivery({
          webhookId: endpoint.id,
          eventType: event.eventType,
          payload: JSON.parse(payload),
          status: response.ok ? "delivered" : "failed",
          statusCode: response.status,
          responseBody,
          attemptCount: attempt,
        });

        if (response.ok) {
          await this.repository.updateEndpointSuccess(endpoint.id);
          return;
        }

        lastError = new Error(`HTTP ${response.status}: ${responseBody}`);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < MAX_RETRIES) {
          await this.delay(BASE_RETRY_DELAY_MS * 2 ** (attempt - 1));
        }
      }
    }

    await this.recordDelivery({
      webhookId: endpoint.id,
      eventType: event.eventType,
      payload: JSON.parse(payload),
      status: "failed",
      statusCode: null,
      responseBody: lastError?.message ?? null,
      attemptCount: MAX_RETRIES,
    });

    await this.repository.updateEndpointFailure(endpoint.id);
  }

  private signPayload(payload: string, secret: string | null): string {
    if (secret === null) {
      return "unsigned";
    }

    const hmac = createHmac("sha256", secret);
    hmac.update(payload, "utf-8");
    return `sha256=${hmac.digest("hex")}`;
  }

  private async recordDelivery(input: {
    webhookId: string;
    eventType: string;
    payload: unknown;
    status: string;
    statusCode: number | null;
    responseBody: string | null;
    attemptCount: number;
  }): Promise<void> {
    const now = new Date();
    const maxAttemptsReached = input.attemptCount >= MAX_RETRIES;

    await this.repository.createWebhookDelivery({
      webhookId: input.webhookId,
      eventType: input.eventType,
      payload: input.payload,
      status: input.status,
      statusCode: input.statusCode,
      responseBody: input.responseBody,
      attemptCount: input.attemptCount,
      deliveredAt: input.status === "delivered" ? now : null,
      nextRetryAt: maxAttemptsReached
        ? null
        : new Date(now.getTime() + BASE_RETRY_DELAY_MS * 2 ** input.attemptCount),
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}
