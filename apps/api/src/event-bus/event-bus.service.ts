import { Injectable } from "@nestjs/common";
import type { DomainEvent } from "@saptm/database";
import { createConsoleLogger, createTraceContext } from "@saptm/observability";
import { filter, Subject, type Subscription } from "rxjs";

export type { DomainEvent };

export type EventHandler<T = DomainEvent> = (event: T) => Promise<void>;

function createEventBusLogger() {
  return createConsoleLogger({
    serviceName: "@saptm/api",
    environment:
      process.env.NODE_ENV === "production"
        ? "production"
        : process.env.NODE_ENV === "test"
          ? "test"
          : "development",
    defaultContext: createTraceContext({
      operationName: "event-bus",
      sourceSystem: "apps/api",
    }),
    minimumLevel: "info",
  });
}

@Injectable()
export class EventBusService {
  private readonly subject = new Subject<DomainEvent>();
  private readonly logger = createEventBusLogger();

  emit(event: DomainEvent): void {
    this.subject.next(event);
  }

  subscribe<T>(eventType: string, handler: (event: T) => Promise<void>): Subscription {
    return this.subject.pipe(filter((e) => e.eventType === eventType)).subscribe({
      next: (event) => {
        (handler as EventHandler)(event).catch((error: unknown) => {
          this.logger.error(`EventBus handler error for event ${eventType}.`, {
            attributes: { "event.type": eventType },
            error,
          });
        });
      },
      error: (error: unknown) => {
        this.logger.error(`EventBus stream error for event ${eventType}.`, {
          attributes: { "event.type": eventType },
          error,
        });
      },
    });
  }

  subscribeAll(handler: EventHandler): Subscription {
    return this.subject.subscribe({
      next: (event) => {
        handler(event).catch((error: unknown) => {
          this.logger.error(`EventBus global handler error for event ${event.eventType}.`, {
            attributes: { "event.type": event.eventType },
            error,
          });
        });
      },
      error: (error: unknown) => {
        this.logger.error("EventBus global stream error.", { error });
      },
    });
  }
}
