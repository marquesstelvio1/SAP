import { platformPermissions } from "@saptm/auth";
import { z } from "zod";

import { createRpcOperationMetadata } from "./metadata.js";
import { trackingEventTypes, trackingShipmentStatuses } from "./tracking.js";

const integrationIdempotencySchema = z.string().trim().min(12).max(128);
const integrationSourceSystemSchema = z.string().trim().min(2).max(80);
const integrationExternalIdSchema = z.string().trim().min(2).max(160);
const integrationEventTypeSchema = z.string().trim().min(3).max(120);
const integrationPayloadSchema = z.record(
  z.string().trim().min(1).max(120),
  z.union([z.string(), z.number(), z.boolean(), z.null()]),
);

export const integrationPortTosMovementTypes = [
  "gate_in",
  "loaded",
  "departed",
  "arrived",
  "delayed",
  "customs_hold",
  "handover_completed",
] as const;

export const integrationRailTmsMovementTypes = [
  "train_departed",
  "train_arrived",
  "yard_departure",
  "yard_arrival",
  "delay_reported",
  "infrastructure_hold",
  "handover_completed",
] as const;

export const integrationCarrierTmsMovementTypes = [
  "pickup_completed",
  "linehaul_departed",
  "in_transit_update",
  "delivery_arrived",
  "delivery_completed",
  "delay_reported",
  "exception_reported",
  "handover_completed",
] as const;

export const integrationTelematicsGpsPositionTypes = [
  "position_reported",
  "geofence_departure",
  "geofence_arrival",
  "eta_delay",
  "route_deviation",
  "sensor_alert",
  "telemetry_lost",
] as const;

export const integrationCustomsErpStatusTypes = [
  "documents_received",
  "customs_hold",
  "inspection_required",
  "duty_paid",
  "customs_cleared",
  "release_authorized",
  "clearance_rejected",
] as const;

export const integrationWarehouseWmsActivityTypes = [
  "received_at_warehouse",
  "putaway_completed",
  "picked_for_dispatch",
  "loaded_for_dispatch",
  "yard_check_in",
  "yard_check_out",
  "inventory_exception",
  "damage_reported",
  "handover_completed",
] as const;

export const integrationOverviewInputSchema = z
  .object({
    limit: z.number().int().min(1).max(100).default(25),
  })
  .default({
    limit: 25,
  });

export const integrationServiceAccountCreateInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  scopes: z.array(z.enum(platformPermissions)).min(1).max(24),
  expiresAt: z.string().datetime().optional(),
  idempotencyKey: integrationIdempotencySchema,
  sourceSystem: integrationSourceSystemSchema.default("saptm"),
});

export const integrationEventRecordInputSchema = z.object({
  serviceAccountId: z.string().trim().min(1),
  sourceSystem: integrationSourceSystemSchema,
  externalId: integrationExternalIdSchema,
  eventType: integrationEventTypeSchema,
  payload: integrationPayloadSchema,
});

export const integrationPortTosMovementInputSchema = z.object({
  serviceAccountId: z.string().trim().min(1),
  sourceSystem: integrationSourceSystemSchema.default("port-tos"),
  externalId: integrationExternalIdSchema,
  shipmentReference: z.string().trim().min(2).max(120),
  movementType: z.enum(integrationPortTosMovementTypes),
  occurredAt: z.string().datetime(),
  locationName: z.string().trim().min(1).max(180).optional(),
  notes: z.string().trim().min(1).max(2000).optional(),
  payload: integrationPayloadSchema.optional(),
});

export const integrationRailTmsMovementInputSchema = z.object({
  serviceAccountId: z.string().trim().min(1),
  sourceSystem: integrationSourceSystemSchema.default("rail-tms"),
  externalId: integrationExternalIdSchema,
  shipmentReference: z.string().trim().min(2).max(120),
  movementType: z.enum(integrationRailTmsMovementTypes),
  occurredAt: z.string().datetime(),
  locationName: z.string().trim().min(1).max(180).optional(),
  trainNumber: z.string().trim().min(2).max(80).optional(),
  railCorridor: z.string().trim().min(2).max(120).optional(),
  wagonCount: z.number().int().positive().max(500).optional(),
  notes: z.string().trim().min(1).max(2000).optional(),
  payload: integrationPayloadSchema.optional(),
});

export const integrationCarrierTmsMovementInputSchema = z.object({
  serviceAccountId: z.string().trim().min(1),
  sourceSystem: integrationSourceSystemSchema.default("carrier-tms"),
  externalId: integrationExternalIdSchema,
  shipmentReference: z.string().trim().min(2).max(120),
  movementType: z.enum(integrationCarrierTmsMovementTypes),
  occurredAt: z.string().datetime(),
  locationName: z.string().trim().min(1).max(180).optional(),
  carrierCode: z.string().trim().min(2).max(80).optional(),
  vehiclePlate: z.string().trim().min(2).max(40).optional(),
  driverReference: z.string().trim().min(2).max(80).optional(),
  routeCode: z.string().trim().min(2).max(120).optional(),
  notes: z.string().trim().min(1).max(2000).optional(),
  payload: integrationPayloadSchema.optional(),
});

export const integrationTelematicsGpsPositionInputSchema = z.object({
  serviceAccountId: z.string().trim().min(1),
  sourceSystem: integrationSourceSystemSchema.default("telematics-gps"),
  externalId: integrationExternalIdSchema,
  shipmentReference: z.string().trim().min(2).max(120),
  positionType: z.enum(integrationTelematicsGpsPositionTypes),
  occurredAt: z.string().datetime(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  deviceId: z.string().trim().min(2).max(80).optional(),
  assetReference: z.string().trim().min(2).max(120).optional(),
  geofenceName: z.string().trim().min(2).max(120).optional(),
  speedKph: z.number().min(0).max(300).optional(),
  headingDegrees: z.number().min(0).max(359).optional(),
  routeCode: z.string().trim().min(2).max(120).optional(),
  notes: z.string().trim().min(1).max(2000).optional(),
  payload: integrationPayloadSchema.optional(),
});

export const integrationCustomsErpStatusInputSchema = z.object({
  serviceAccountId: z.string().trim().min(1),
  sourceSystem: integrationSourceSystemSchema.default("customs-erp"),
  externalId: integrationExternalIdSchema,
  shipmentReference: z.string().trim().min(2).max(120),
  statusType: z.enum(integrationCustomsErpStatusTypes),
  occurredAt: z.string().datetime(),
  customsReference: z.string().trim().min(2).max(120).optional(),
  documentReference: z.string().trim().min(2).max(120).optional(),
  declarationNumber: z.string().trim().min(2).max(120).optional(),
  brokerReference: z.string().trim().min(2).max(120).optional(),
  authorityCode: z.string().trim().min(2).max(80).optional(),
  notes: z.string().trim().min(1).max(2000).optional(),
  payload: integrationPayloadSchema.optional(),
});

export const integrationWarehouseWmsActivityInputSchema = z.object({
  serviceAccountId: z.string().trim().min(1),
  sourceSystem: integrationSourceSystemSchema.default("warehouse-wms"),
  externalId: integrationExternalIdSchema,
  shipmentReference: z.string().trim().min(2).max(120),
  activityType: z.enum(integrationWarehouseWmsActivityTypes),
  occurredAt: z.string().datetime(),
  locationName: z.string().trim().min(1).max(180).optional(),
  warehouseCode: z.string().trim().min(2).max(80).optional(),
  zoneCode: z.string().trim().min(2).max(80).optional(),
  dockDoor: z.string().trim().min(2).max(80).optional(),
  containerReference: z.string().trim().min(2).max(120).optional(),
  handlingUnitReference: z.string().trim().min(2).max(120).optional(),
  operatorReference: z.string().trim().min(2).max(120).optional(),
  palletCount: z.number().int().positive().max(10000).optional(),
  notes: z.string().trim().min(1).max(2000).optional(),
  payload: integrationPayloadSchema.optional(),
});

export const integrationApiKeySummarySchema = z.object({
  id: z.string(),
  prefix: z.string(),
  expiresAt: z.string().nullable(),
  lastUsedAt: z.string().nullable(),
  revokedAt: z.string().nullable(),
  createdAt: z.string(),
});

export const integrationServiceAccountSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  scopes: z.array(z.enum(platformPermissions)),
  active: z.boolean(),
  createdByActorId: z.string().nullable(),
  lastRotatedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  apiKeys: z.array(integrationApiKeySummarySchema),
});

export const integrationEventSummarySchema = z.object({
  id: z.string(),
  serviceAccountId: z.string().nullable(),
  sourceSystem: z.string(),
  externalId: z.string(),
  eventType: z.string(),
  payload: integrationPayloadSchema,
  receivedAt: z.string(),
  processedAt: z.string().nullable(),
});

export const integrationOverviewOutputSchema = z.object({
  generatedAt: z.string(),
  totals: z.object({
    serviceAccounts: z.number().int().nonnegative(),
    activeServiceAccounts: z.number().int().nonnegative(),
    activeApiKeys: z.number().int().nonnegative(),
    integrationEvents: z.number().int().nonnegative(),
    processedEvents: z.number().int().nonnegative(),
  }),
  serviceAccounts: z.array(integrationServiceAccountSummarySchema),
  recentEvents: z.array(integrationEventSummarySchema),
  securityModel: z.object({
    authorizationModel: z.literal("tenant-scoped-rbac-service-accounts"),
    requiredPermissions: z.array(z.enum(platformPermissions)),
    idempotencyModel: z.literal("organization-sourceSystem-externalId"),
    secretStorage: z.literal("sha256-hash-only"),
  }),
});

export const integrationMutationAuditSchema = z.object({
  action: z.string(),
  subjectType: z.string(),
  subjectId: z.string(),
});

export const integrationMutationOutboxSchema = z.object({
  eventType: z.string(),
  aggregateType: z.string(),
  aggregateId: z.string(),
});

export const integrationIdempotencyResultSchema = z.object({
  key: z.string(),
  replayed: z.boolean(),
});

export const integrationServiceAccountCreateOutputSchema = z.object({
  organizationId: z.string(),
  serviceAccount: integrationServiceAccountSummarySchema,
  apiKey: z.object({
    prefix: z.string(),
    plaintext: z.string().nullable(),
  }),
  idempotency: integrationIdempotencyResultSchema,
  audit: integrationMutationAuditSchema,
  outbox: integrationMutationOutboxSchema,
});

export const integrationEventRecordOutputSchema = z.object({
  organizationId: z.string(),
  event: integrationEventSummarySchema,
  idempotency: integrationIdempotencyResultSchema,
  audit: integrationMutationAuditSchema,
  outbox: integrationMutationOutboxSchema,
});

export const integrationPortTosMovementOutputSchema = z.object({
  organizationId: z.string(),
  adapter: z.object({
    name: z.literal("port-tos"),
    mode: z.literal("local-synchronous"),
  }),
  integrationEvent: integrationEventSummarySchema,
  trackingEvent: z.object({
    id: z.string(),
    shipmentId: z.string(),
    referenceCode: z.string(),
    eventType: z.enum(trackingEventTypes),
    previousStatus: z.enum(trackingShipmentStatuses),
    currentStatus: z.enum(trackingShipmentStatuses),
    occurredAt: z.string(),
    sourceSystem: z.string(),
  }),
  idempotency: integrationIdempotencyResultSchema,
  audit: integrationMutationAuditSchema,
  outbox: integrationMutationOutboxSchema,
});

export const integrationRailTmsMovementOutputSchema = z.object({
  organizationId: z.string(),
  adapter: z.object({
    name: z.literal("rail-tms"),
    mode: z.literal("local-synchronous"),
  }),
  integrationEvent: integrationEventSummarySchema,
  trackingEvent: z.object({
    id: z.string(),
    shipmentId: z.string(),
    referenceCode: z.string(),
    eventType: z.enum(trackingEventTypes),
    previousStatus: z.enum(trackingShipmentStatuses),
    currentStatus: z.enum(trackingShipmentStatuses),
    occurredAt: z.string(),
    sourceSystem: z.string(),
  }),
  idempotency: integrationIdempotencyResultSchema,
  audit: integrationMutationAuditSchema,
  outbox: integrationMutationOutboxSchema,
});

export const integrationCarrierTmsMovementOutputSchema = z.object({
  organizationId: z.string(),
  adapter: z.object({
    name: z.literal("carrier-tms"),
    mode: z.literal("local-synchronous"),
  }),
  integrationEvent: integrationEventSummarySchema,
  trackingEvent: z.object({
    id: z.string(),
    shipmentId: z.string(),
    referenceCode: z.string(),
    eventType: z.enum(trackingEventTypes),
    previousStatus: z.enum(trackingShipmentStatuses),
    currentStatus: z.enum(trackingShipmentStatuses),
    occurredAt: z.string(),
    sourceSystem: z.string(),
  }),
  idempotency: integrationIdempotencyResultSchema,
  audit: integrationMutationAuditSchema,
  outbox: integrationMutationOutboxSchema,
});

export const integrationTelematicsGpsPositionOutputSchema = z.object({
  organizationId: z.string(),
  adapter: z.object({
    name: z.literal("telematics-gps"),
    mode: z.literal("local-synchronous"),
  }),
  integrationEvent: integrationEventSummarySchema,
  trackingEvent: z.object({
    id: z.string(),
    shipmentId: z.string(),
    referenceCode: z.string(),
    eventType: z.enum(trackingEventTypes),
    previousStatus: z.enum(trackingShipmentStatuses),
    currentStatus: z.enum(trackingShipmentStatuses),
    occurredAt: z.string(),
    sourceSystem: z.string(),
  }),
  idempotency: integrationIdempotencyResultSchema,
  audit: integrationMutationAuditSchema,
  outbox: integrationMutationOutboxSchema,
});

export const integrationCustomsErpStatusOutputSchema = z.object({
  organizationId: z.string(),
  adapter: z.object({
    name: z.literal("customs-erp"),
    mode: z.literal("local-synchronous"),
  }),
  integrationEvent: integrationEventSummarySchema,
  trackingEvent: z.object({
    id: z.string(),
    shipmentId: z.string(),
    referenceCode: z.string(),
    eventType: z.enum(trackingEventTypes),
    previousStatus: z.enum(trackingShipmentStatuses),
    currentStatus: z.enum(trackingShipmentStatuses),
    occurredAt: z.string(),
    sourceSystem: z.string(),
  }),
  idempotency: integrationIdempotencyResultSchema,
  audit: integrationMutationAuditSchema,
  outbox: integrationMutationOutboxSchema,
});

export const integrationWarehouseWmsActivityOutputSchema = z.object({
  organizationId: z.string(),
  adapter: z.object({
    name: z.literal("warehouse-wms"),
    mode: z.literal("local-synchronous"),
  }),
  integrationEvent: integrationEventSummarySchema,
  trackingEvent: z.object({
    id: z.string(),
    shipmentId: z.string(),
    referenceCode: z.string(),
    eventType: z.enum(trackingEventTypes),
    previousStatus: z.enum(trackingShipmentStatuses),
    currentStatus: z.enum(trackingShipmentStatuses),
    occurredAt: z.string(),
    sourceSystem: z.string(),
  }),
  idempotency: integrationIdempotencyResultSchema,
  audit: integrationMutationAuditSchema,
  outbox: integrationMutationOutboxSchema,
});

export type IntegrationOverviewInput = z.infer<typeof integrationOverviewInputSchema>;
export type IntegrationOverviewOutput = z.infer<typeof integrationOverviewOutputSchema>;
export type IntegrationServiceAccountCreateInput = z.infer<
  typeof integrationServiceAccountCreateInputSchema
>;
export type IntegrationServiceAccountCreateOutput = z.infer<
  typeof integrationServiceAccountCreateOutputSchema
>;
export type IntegrationEventRecordInput = z.infer<typeof integrationEventRecordInputSchema>;
export type IntegrationEventRecordOutput = z.infer<typeof integrationEventRecordOutputSchema>;
export type IntegrationPortTosMovementInput = z.infer<typeof integrationPortTosMovementInputSchema>;
export type IntegrationPortTosMovementOutput = z.infer<
  typeof integrationPortTosMovementOutputSchema
>;
export type IntegrationRailTmsMovementInput = z.infer<typeof integrationRailTmsMovementInputSchema>;
export type IntegrationRailTmsMovementOutput = z.infer<
  typeof integrationRailTmsMovementOutputSchema
>;
export type IntegrationCarrierTmsMovementInput = z.infer<
  typeof integrationCarrierTmsMovementInputSchema
>;
export type IntegrationCarrierTmsMovementOutput = z.infer<
  typeof integrationCarrierTmsMovementOutputSchema
>;
export type IntegrationTelematicsGpsPositionInput = z.infer<
  typeof integrationTelematicsGpsPositionInputSchema
>;
export type IntegrationTelematicsGpsPositionOutput = z.infer<
  typeof integrationTelematicsGpsPositionOutputSchema
>;
export type IntegrationCustomsErpStatusInput = z.infer<
  typeof integrationCustomsErpStatusInputSchema
>;
export type IntegrationCustomsErpStatusOutput = z.infer<
  typeof integrationCustomsErpStatusOutputSchema
>;
export type IntegrationWarehouseWmsActivityInput = z.infer<
  typeof integrationWarehouseWmsActivityInputSchema
>;
export type IntegrationWarehouseWmsActivityOutput = z.infer<
  typeof integrationWarehouseWmsActivityOutputSchema
>;

export const integrationOverviewMetadata = createRpcOperationMetadata({
  name: "integration.gateway.overview.read",
  kind: "query",
  permissions: ["integration.api_key.manage", "integration.event.ingest"],
  permissionMode: "any",
  organizationRequired: true,
  audit: "sensitive",
  criticality: "high",
});

export const integrationServiceAccountCreateMetadata = createRpcOperationMetadata({
  name: "integration.service_account.create",
  kind: "mutation",
  auth: "session",
  permissions: ["integration.api_key.manage"],
  organizationRequired: true,
  audit: "critical",
  idempotency: "required",
  criticality: "critical",
});

export const integrationEventRecordMetadata = createRpcOperationMetadata({
  name: "integration.event.record",
  kind: "mutation",
  auth: "session",
  permissions: ["integration.event.ingest"],
  organizationRequired: true,
  audit: "critical",
  idempotency: "required",
  criticality: "critical",
});

export const integrationPortTosMovementMetadata = createRpcOperationMetadata({
  name: "integration.adapter.port_tos.movement.process",
  kind: "mutation",
  auth: "session",
  permissions: ["integration.event.ingest", "tracking.event.record"],
  permissionMode: "all",
  organizationRequired: true,
  audit: "critical",
  idempotency: "required",
  criticality: "critical",
});

export const integrationRailTmsMovementMetadata = createRpcOperationMetadata({
  name: "integration.adapter.rail_tms.movement.process",
  kind: "mutation",
  auth: "session",
  permissions: ["integration.event.ingest", "tracking.event.record"],
  permissionMode: "all",
  organizationRequired: true,
  audit: "critical",
  idempotency: "required",
  criticality: "critical",
});

export const integrationCarrierTmsMovementMetadata = createRpcOperationMetadata({
  name: "integration.adapter.carrier_tms.movement.process",
  kind: "mutation",
  auth: "session",
  permissions: ["integration.event.ingest", "tracking.event.record"],
  permissionMode: "all",
  organizationRequired: true,
  audit: "critical",
  idempotency: "required",
  criticality: "critical",
});

export const integrationTelematicsGpsPositionMetadata = createRpcOperationMetadata({
  name: "integration.adapter.telematics_gps.position.process",
  kind: "mutation",
  auth: "session",
  permissions: ["integration.event.ingest", "tracking.event.record"],
  permissionMode: "all",
  organizationRequired: true,
  audit: "critical",
  idempotency: "required",
  criticality: "critical",
});

export const integrationCustomsErpStatusMetadata = createRpcOperationMetadata({
  name: "integration.adapter.customs_erp.status.process",
  kind: "mutation",
  auth: "session",
  permissions: ["integration.event.ingest", "tracking.event.record"],
  permissionMode: "all",
  organizationRequired: true,
  audit: "critical",
  idempotency: "required",
  criticality: "critical",
});

export const integrationWarehouseWmsActivityMetadata = createRpcOperationMetadata({
  name: "integration.adapter.warehouse_wms.activity.process",
  kind: "mutation",
  auth: "session",
  permissions: ["integration.event.ingest", "tracking.event.record"],
  permissionMode: "all",
  organizationRequired: true,
  audit: "critical",
  idempotency: "required",
  criticality: "critical",
});
