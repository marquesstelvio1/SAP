import { Injectable } from "@nestjs/common";
import type { DomainEvent } from "@saptm/database";
import { filter, Subject, type Subscription } from "rxjs";

export type { DomainEvent };

export type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => Promise<void>;

@Injectable()
export class EventBusService {
  private readonly subject = new Subject<DomainEvent>();

  emit(event: DomainEvent): void {
    this.subject.next(event);
  }

  subscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): Subscription {
    return this.subject.pipe(filter((e): e is T => e.eventType === eventType)).subscribe({
      next: (event) => {
        handler(event).catch((error: unknown) => {
          console.error(
            `[EventBus] Handler error for event ${eventType}:`,
            error instanceof Error ? error.message : String(error),
          );
        });
      },
      error: (error: unknown) => {
        console.error(
          `[EventBus] Stream error for event ${eventType}:`,
          error instanceof Error ? error.message : String(error),
        );
      },
    });
  }

  subscribeAll(handler: EventHandler): Subscription {
    return this.subject.subscribe({
      next: (event) => {
        handler(event).catch((error: unknown) => {
          console.error(
            `[EventBus] Global handler error for event ${event.eventType}:`,
            error instanceof Error ? error.message : String(error),
          );
        });
      },
      error: (error: unknown) => {
        console.error(
          "[EventBus] Global stream error:",
          error instanceof Error ? error.message : String(error),
        );
      },
    });
  }
}
