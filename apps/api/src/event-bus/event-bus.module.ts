import { Global, Module } from "@nestjs/common";
import { EventBusService } from "./event-bus.service.js";
import { OutboxEventBusAdapter } from "./outbox-event-bus.adapter.js";

@Global()
@Module({
  providers: [EventBusService, OutboxEventBusAdapter],
  exports: [EventBusService, OutboxEventBusAdapter],
})
export class EventBusModule {}
