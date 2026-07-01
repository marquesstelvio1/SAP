import { Global, Module } from "@nestjs/common";
import type { EventBus } from "./domain-events.js";
import { OutboxEventBus } from "./outbox-event-bus.js";

export const EVENT_BUS = Symbol("EventBus");

@Global()
@Module({
  providers: [
    {
      provide: EVENT_BUS,
      useClass: OutboxEventBus,
    },
  ],
  exports: [EVENT_BUS],
})
export class EventBusModule {}

export type { EventBus };
