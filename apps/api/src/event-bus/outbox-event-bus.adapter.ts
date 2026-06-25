import { Injectable } from "@nestjs/common";
import type { DomainEvent, EventBus, PrismaTx, SaptmPrismaClient } from "@saptm/database";
import { getPrismaClient } from "@saptm/database";
import { EventBusService } from "./event-bus.service.js";

@Injectable()
export class OutboxEventBusAdapter implements EventBus {
  private readonly database: SaptmPrismaClient = getPrismaClient();

  constructor(private readonly eventBus: EventBusService) {}

  async publish(tx: PrismaTx, event: DomainEvent): Promise<void> {
    await tx.outboxEvent.create({
      data: {
        organizationId: event.organizationId,
        eventType: event.eventType,
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
        payload: event.payload as never,
      },
    });

    this.eventBus.emit(event);
  }

  async emit(event: DomainEvent): Promise<void> {
    await this.database.outboxEvent.create({
      data: {
        organizationId: event.organizationId,
        eventType: event.eventType,
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
        payload: event.payload as never,
      },
    });

    this.eventBus.emit(event);
  }
}
