import type { AuditJsonValue, PrismaTx } from "@saptm/database";
import type { TrackingShipmentStatus } from "./integrations.business-rules.js";
import type { IntegrationEventRecord, ServiceAccountRecord } from "./integrations.dto.js";

export const INTEGRATIONS_REPOSITORY = Symbol("IntegrationsRepository");

// Prisma input types (for create/update operations)

export type PrismaServiceAccountCreateInput = {
  organizationId: string;
  name: string;
  scopes: string[];
  createdByActorId: string;
  provisionIdempotencyKey: string;
  lastRotatedAt: Date;
};

export type PrismaApiKeyCreateInput = {
  serviceAccountId: string;
  keyHash: string;
  prefix: string;
  expiresAt?: Date;
};

export type PrismaIntegrationEventCreateInput = {
  organizationId: string;
  serviceAccountId: string;
  sourceSystem: string;
  externalId: string;
  eventType: string;
  payload: Record<string, string | number | boolean | null>;
  receivedAt?: Date;
};

export type PrismaTrackingEventCreateInput = {
  organizationId: string;
  shipmentId: string;
  eventType: string;
  occurredAt: Date;
  sourceSystem: string;
  correlationId: string;
  idempotencyKey: string;
  locationName?: string;
  notes?: string;
  payload: Record<string, unknown>;
};

export type PrismaTrackingShipmentUpdateInput = {
  status?: string;
  actualArrivalAt?: Date;
};

export type PrismaIntegrationEventUpdateInput = {
  processedAt: Date;
};

export type PrismaAuditRecordCreateInput = {
  organizationId: string;
  actorType: string;
  actorId: string;
  action: string;
  subjectType: string;
  subjectId: string;
  severity: string;
  before?: AuditJsonValue;
  after?: AuditJsonValue;
  reason: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

export type PrismaOutboxEventCreateInput = {
  organizationId: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: AuditJsonValue;
};

// Tracking shipment lookup type
export type TrackingShipmentLookup = {
  id: string;
  referenceCode: string;
  status: TrackingShipmentStatus;
};

export type TrackingEventWithShipment = {
  id: string;
  shipmentId: string;
  eventType: string;
  occurredAt: Date;
  sourceSystem: string;
  payload: unknown;
  shipment: {
    id: string;
    referenceCode: string;
    status: string;
  } | null;
};

export interface IntegrationsRepository {
  transaction<T>(fn: (tx: PrismaTx) => Promise<T>): Promise<T>;
  // Organization lookup
  assertOrganizationExists(tx: PrismaTx, organizationId: string): Promise<void>;

  // Overview queries
  countServiceAccounts(organizationId: string): Promise<number>;
  countActiveServiceAccounts(organizationId: string): Promise<number>;
  countActiveApiKeys(organizationId: string): Promise<number>;
  countIntegrationEvents(organizationId: string): Promise<number>;
  countProcessedIntegrationEvents(organizationId: string): Promise<number>;
  findRecentServiceAccounts(organizationId: string, limit: number): Promise<ServiceAccountRecord[]>;
  findRecentIntegrationEvents(
    organizationId: string,
    limit: number,
  ): Promise<IntegrationEventRecord[]>;

  // Service account queries
  findServiceAccountByIdempotencyKey(
    tx: PrismaTx,
    organizationId: string,
    idempotencyKey: string,
  ): Promise<ServiceAccountRecord | null>;
  findServiceAccountByName(
    tx: PrismaTx,
    organizationId: string,
    name: string,
  ): Promise<{ id: string } | null>;
  findServiceAccountById(
    tx: PrismaTx,
    serviceAccountId: string,
  ): Promise<ServiceAccountRecord | null>;
  findActiveServiceAccountWithScopes(
    tx: PrismaTx,
    serviceAccountId: string,
    organizationId: string,
  ): Promise<{ id: string; scopes: string[] } | null>;

  // Integration event queries
  findIntegrationEventByIdempotencyKey(
    tx: PrismaTx,
    organizationId: string,
    sourceSystem: string,
    externalId: string,
  ): Promise<IntegrationEventRecord | null>;

  // Tracking queries
  findTrackingShipmentByReference(
    tx: PrismaTx,
    organizationId: string,
    shipmentReference: string,
  ): Promise<TrackingShipmentLookup | null>;
  findTrackingEventByIdempotencyKey(
    tx: PrismaTx,
    organizationId: string,
    idempotencyKey: string,
  ): Promise<TrackingEventWithShipment | null>;

  // Service account writes
  createServiceAccount(
    tx: PrismaTx,
    input: PrismaServiceAccountCreateInput,
  ): Promise<{ id: string }>;
  createApiKey(tx: PrismaTx, input: PrismaApiKeyCreateInput): Promise<void>;

  // Integration event writes
  createIntegrationEvent(
    tx: PrismaTx,
    input: PrismaIntegrationEventCreateInput,
  ): Promise<{ id: string }>;
  updateIntegrationEventProcessedAt(tx: PrismaTx, id: string, processedAt: Date): Promise<void>;

  // Tracking writes
  createTrackingEvent(
    tx: PrismaTx,
    input: PrismaTrackingEventCreateInput,
  ): Promise<TrackingEventWithShipment>;
  updateTrackingShipment(
    tx: PrismaTx,
    shipmentId: string,
    input: PrismaTrackingShipmentUpdateInput,
  ): Promise<TrackingShipmentLookup>;

  // Audit + outbox writes
  createAuditRecord(tx: PrismaTx, input: PrismaAuditRecordCreateInput): Promise<void>;
  createOutboxEvent(tx: PrismaTx, input: PrismaOutboxEventCreateInput): Promise<void>;
}
