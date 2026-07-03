import { CURRENT_EVENT_VERSION, type DomainEvent, type EventBus } from "./domain-events.js";
import type { PrismaTx } from "./prisma/factory.js";

export class OutboxEventBus implements EventBus {
  async publish(tx: PrismaTx, event: DomainEvent): Promise<void> {
    await tx.outboxEvent.create({
      data: {
        organizationId: event.organizationId,
        eventType: event.eventType,
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
        eventVersion: event.eventVersion ?? CURRENT_EVENT_VERSION,
        payload: event.payload as never,
      },
    });
  }
}
