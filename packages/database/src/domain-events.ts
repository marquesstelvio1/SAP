import type { AuditJsonValue } from "./audit.js";
import type { PrismaTx } from "./prisma/factory.js";

export const CURRENT_EVENT_VERSION = 1;

export type DomainEvent = {
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  eventVersion?: number;
  organizationId: string;
  payload: AuditJsonValue;
};

export interface EventBus {
  publish(tx: PrismaTx, event: DomainEvent): Promise<void>;
}
