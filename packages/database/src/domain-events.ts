import type { AuditJsonValue } from "./audit.js";
import type { PrismaTx } from "./prisma/factory.js";

export type DomainEvent = {
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  organizationId: string;
  payload: AuditJsonValue;
};

export interface EventBus {
  publish(tx: PrismaTx, event: DomainEvent): Promise<void>;
}
