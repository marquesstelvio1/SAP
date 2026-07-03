import type { OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Injectable } from "@nestjs/common";
import type { Subscription } from "rxjs";
// biome-ignore lint/style/useImportType: NestJS DI needs runtime class reference
import { EventBusService } from "../../event-bus/event-bus.service.js";
// biome-ignore lint/style/useImportType: NestJS DI needs runtime class reference
import { UsageService } from "../usage.service.js";

type CargoRegisteredPayload = {
  cargoId: string;
  cargoReference: string;
  cargoType: string;
  status: string;
  customsStatus: string;
  conditionStatus: string;
  hazardous: boolean;
  requiresInspection: boolean;
  movementBlocked: boolean;
  appliedRules: string[];
  idempotencyKey: string;
  correlationId: string;
};

type TrackingEventRecordedPayload = {
  eventId: string;
  shipmentId: string;
  eventType: string;
  occurredAt: string;
  locationName?: string | null;
  notes?: string | null;
  sourceSystem: string;
  correlationId: string;
};

@Injectable()
export class UsageEventHandler implements OnModuleInit, OnModuleDestroy {
  private readonly subscriptions: Subscription[] = [];

  constructor(
    private readonly usageService: UsageService,
    private readonly eventBus: EventBusService,
  ) {}

  onModuleInit(): void {
    this.subscriptions.push(
      this.eventBus.subscribe<{ organizationId: string; payload: CargoRegisteredPayload }>(
        "cargo.registered",
        async (event) => {
          await this.usageService.trackUsage(event.organizationId, "cargo_shipments", 1);
        },
      ),
    );

    this.subscriptions.push(
      this.eventBus.subscribe<{ organizationId: string; payload: TrackingEventRecordedPayload }>(
        "tracking.event.recorded",
        async (event) => {
          await this.usageService.trackUsage(event.organizationId, "tracking_events", 1);
        },
      ),
    );
  }

  onModuleDestroy(): void {
    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }
  }
}
