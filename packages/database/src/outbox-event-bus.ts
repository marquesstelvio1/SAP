import type { DomainEvent, EventBus } from "./domain-events.js";
import type { PrismaTx } from "./prisma/factory.js";

export class OutboxEventBus implements EventBus {
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
  }
}
