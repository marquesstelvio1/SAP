import type { OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Injectable, Logger } from "@nestjs/common";
import type { Subscription } from "rxjs";

// biome-ignore lint/style/useImportType: NestJS DI needs runtime class reference
import { EventBusService } from "../../event-bus/event-bus.service.js";
// biome-ignore lint/style/useImportType: NestJS DI needs runtime class reference
import { PlanCacheService } from "./plan-cache.service.js";

/**
 * Handles subscription change events to invalidate the plan cache.
 *
 * When a subscription changes (upgrade, downgrade, cancel, payment status
 * change), the plan cache should be invalidated to ensure PlanGuard reads
 * the correct plan features on the next request.
 */
@Injectable()
export class PlanChangeEventHandler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PlanChangeEventHandler.name);
  private readonly subscriptions: Subscription[] = [];

  constructor(
    private readonly eventBus: EventBusService,
    private readonly planCache: PlanCacheService,
  ) {}

  onModuleInit(): void {
    // Listen for subscription lifecycle events to invalidate plan cache
    const events = [
      "billing.subscription.updated",
      "billing.subscription.created",
      "billing.subscription.canceled",
      "billing.subscription.deleted",
    ];

    for (const eventType of events) {
      this.subscriptions.push(
        this.eventBus.subscribe<{ organizationId: string; plan?: string }>(
          eventType,
          async () => {
            this.logger.log(`Invalidating plan cache due to event: ${eventType}`);
            await this.planCache.invalidateAll();
          },
        ),
      );
    }

    this.logger.log("PlanChangeEventHandler initialized — listening for subscription events");
  }

  onModuleDestroy(): void {
    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }
  }
}
