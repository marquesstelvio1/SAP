import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  createApiKeyMaterial,
  filterPlatformPermissions,
  hashApiKey,
  type PlatformPermission,
} from "@saptm/auth";
import { type DatabaseActorType, getPrismaClient, type SaptmPrismaClient } from "@saptm/database";
import type {
  IntegrationCarrierTmsMovementInput,
  IntegrationCarrierTmsMovementOutput,
  IntegrationCustomsErpStatusInput,
  IntegrationCustomsErpStatusOutput,
  IntegrationEventRecordInput,
  IntegrationEventRecordOutput,
  IntegrationOverviewInput,
  IntegrationOverviewOutput,
  IntegrationPortTosMovementInput,
  IntegrationPortTosMovementOutput,
  IntegrationRailTmsMovementInput,
  IntegrationRailTmsMovementOutput,
  IntegrationServiceAccountCreateInput,
  IntegrationServiceAccountCreateOutput,
  IntegrationTelematicsGpsPositionInput,
  IntegrationTelematicsGpsPositionOutput,
  IntegrationWarehouseWmsActivityInput,
  IntegrationWarehouseWmsActivityOutput,
  trackingEventTypes,
} from "@saptm/rpc";
import { trackingShipmentStatuses } from "@saptm/rpc";

export type GetIntegrationOverviewInput = IntegrationOverviewInput & {
  organizationId: string;
  generatedAt?: Date;
};

export type CreateIntegrationServiceAccountInput = IntegrationServiceAccountCreateInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

export type RecordIntegrationEventInput = IntegrationEventRecordInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  receivedAt?: Date;
  ipAddress?: string;
  userAgent?: string;
};

export type ProcessPortTosMovementInput = IntegrationPortTosMovementInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

export type ProcessRailTmsMovementInput = IntegrationRailTmsMovementInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

export type ProcessCarrierTmsMovementInput = IntegrationCarrierTmsMovementInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

export type ProcessTelematicsGpsPositionInput = IntegrationTelematicsGpsPositionInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

export type ProcessCustomsErpStatusInput = IntegrationCustomsErpStatusInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

export type ProcessWarehouseWmsActivityInput = IntegrationWarehouseWmsActivityInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

type ServiceAccountRecord = {
  id: string;
  organizationId: string;
  name: string;
  scopes: string[];
  active: boolean;
  createdByActorId: string | null;
  provisionIdempotencyKey: string | null;
  lastRotatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  apiKeys: ApiKeyRecord[];
};

type ApiKeyRecord = {
  id: string;
  prefix: string;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
};

type IntegrationEventRecord = {
  id: string;
  organizationId: string;
  serviceAccountId: string | null;
  sourceSystem: string;
  externalId: string;
  eventType: string;
  payload: Record<string, string | number | boolean | null>;
  receivedAt: Date;
  processedAt: Date | null;
};

type TrackingEventType = (typeof trackingEventTypes)[number];
type TrackingShipmentStatus = (typeof trackingShipmentStatuses)[number];
type AdapterTrackingEventRecord = {
  id: string;
  shipmentId: string;
  eventType: TrackingEventType;
  occurredAt: Date;
  sourceSystem: string;
  payload: unknown;
  shipment: {
    id: string;
    referenceCode: string;
    status: TrackingShipmentStatus;
  };
};

@Injectable()
export class IntegrationsService {
  constructor(private readonly database: SaptmPrismaClient = getPrismaClient()) {}

  async getOverview(input: GetIntegrationOverviewInput): Promise<IntegrationOverviewOutput> {
    const generatedAt = input.generatedAt ?? new Date();
    const limit = input.limit ?? 25;
    const [serviceAccounts, recentEvents, totals] = await Promise.all([
      this.database.serviceAccount.findMany({
        where: {
          organizationId: input.organizationId,
        },
        orderBy: [{ active: "desc" }, { updatedAt: "desc" }],
        take: limit,
        include: {
          apiKeys: {
            orderBy: {
              createdAt: "desc",
            },
            take: 5,
          },
        },
      }),
      this.database.integrationEvent.findMany({
        where: {
          organizationId: input.organizationId,
        },
        orderBy: {
          receivedAt: "desc",
        },
        take: limit,
      }),
      resolveIntegrationTotals(this.database, input.organizationId),
    ]);

    return {
      generatedAt: generatedAt.toISOString(),
      totals,
      serviceAccounts: serviceAccounts.map((serviceAccount) =>
        mapServiceAccount(serviceAccount as ServiceAccountRecord),
      ),
      recentEvents: recentEvents.map((event) =>
        mapIntegrationEvent(event as IntegrationEventRecord),
      ),
      securityModel: {
        authorizationModel: "tenant-scoped-rbac-service-accounts",
        requiredPermissions: ["integration.api_key.manage", "integration.event.ingest"],
        idempotencyModel: "organization-sourceSystem-externalId",
        secretStorage: "sha256-hash-only",
      },
    };
  }

  async createServiceAccount(
    input: CreateIntegrationServiceAccountInput,
  ): Promise<IntegrationServiceAccountCreateOutput> {
    return this.database.$transaction(async (transaction) => {
      await assertOrganizationExists(transaction, input.organizationId);
      const existingByIdempotency = await transaction.serviceAccount.findUnique({
        where: {
          organizationId_provisionIdempotencyKey: {
            organizationId: input.organizationId,
            provisionIdempotencyKey: input.idempotencyKey,
          },
        },
        include: {
          apiKeys: {
            orderBy: {
              createdAt: "desc",
            },
            take: 5,
          },
        },
      });

      if (existingByIdempotency !== null) {
        const mapped = mapServiceAccount(existingByIdempotency as ServiceAccountRecord);
        const prefix = mapped.apiKeys.at(0)?.prefix ?? "redacted";

        return {
          organizationId: input.organizationId,
          serviceAccount: mapped,
          apiKey: {
            prefix,
            plaintext: null,
          },
          idempotency: {
            key: input.idempotencyKey,
            replayed: true,
          },
          audit: {
            action: "integration.api_key.created",
            subjectType: "service_account",
            subjectId: mapped.id,
          },
          outbox: {
            eventType: "integration.api_key.created",
            aggregateType: "integration.service_account",
            aggregateId: mapped.id,
          },
        };
      }

      const normalizedName = input.name.trim();
      const existingByName = await transaction.serviceAccount.findUnique({
        where: {
          organizationId_name: {
            organizationId: input.organizationId,
            name: normalizedName,
          },
        },
        select: {
          id: true,
        },
      });

      if (existingByName !== null) {
        throw new BadRequestException("integration.service_account_name_exists");
      }

      const now = new Date();
      const normalizedScopes = filterPlatformPermissions(input.scopes);

      if (!normalizedScopes.includes("integration.event.ingest")) {
        throw new BadRequestException("integration.service_account_scope_missing_event_ingest");
      }

      const apiKeyMaterial = createApiKeyMaterial();
      const apiKeyHash = await hashApiKey(apiKeyMaterial.apiKey);
      const serviceAccount = await transaction.serviceAccount.create({
        data: {
          organizationId: input.organizationId,
          name: normalizedName,
          scopes: normalizedScopes,
          createdByActorId: input.actorId,
          provisionIdempotencyKey: input.idempotencyKey,
          lastRotatedAt: now,
        },
      });
      await transaction.apiKey.create({
        data: {
          serviceAccountId: serviceAccount.id,
          keyHash: apiKeyHash,
          prefix: apiKeyMaterial.prefix,
          ...(input.expiresAt === undefined ? {} : { expiresAt: new Date(input.expiresAt) }),
        },
      });
      await transaction.auditRecord.create({
        data: {
          organizationId: input.organizationId,
          actorType: input.actorType,
          actorId: input.actorId,
          action: "integration.api_key.created",
          subjectType: "service_account",
          subjectId: serviceAccount.id,
          severity: "critical",
          after: {
            serviceAccountId: serviceAccount.id,
            name: serviceAccount.name,
            scopes: normalizedScopes,
            apiKeyPrefix: apiKeyMaterial.prefix,
            sourceSystem: input.sourceSystem,
          },
          reason: "Governed integration service account and API key provisioned.",
          correlationId: input.correlationId,
          ...createRequestMetadata(input),
        },
      });
      await transaction.outboxEvent.create({
        data: {
          organizationId: input.organizationId,
          eventType: "integration.api_key.created",
          aggregateType: "integration.service_account",
          aggregateId: serviceAccount.id,
          payload: {
            serviceAccountId: serviceAccount.id,
            name: serviceAccount.name,
            scopes: normalizedScopes,
            apiKeyPrefix: apiKeyMaterial.prefix,
            idempotencyKey: input.idempotencyKey,
            sourceSystem: input.sourceSystem,
          },
        },
      });

      const reloaded = await findServiceAccountForOutput(transaction, serviceAccount.id);

      return {
        organizationId: input.organizationId,
        serviceAccount: mapServiceAccount(reloaded),
        apiKey: {
          prefix: apiKeyMaterial.prefix,
          plaintext: apiKeyMaterial.apiKey,
        },
        idempotency: {
          key: input.idempotencyKey,
          replayed: false,
        },
        audit: {
          action: "integration.api_key.created",
          subjectType: "service_account",
          subjectId: serviceAccount.id,
        },
        outbox: {
          eventType: "integration.api_key.created",
          aggregateType: "integration.service_account",
          aggregateId: serviceAccount.id,
        },
      };
    });
  }

  async recordEvent(input: RecordIntegrationEventInput): Promise<IntegrationEventRecordOutput> {
    return this.database.$transaction(async (transaction) => {
      await assertOrganizationExists(transaction, input.organizationId);
      const serviceAccount = await transaction.serviceAccount.findFirst({
        where: {
          id: input.serviceAccountId,
          organizationId: input.organizationId,
          active: true,
        },
        select: {
          id: true,
          scopes: true,
        },
      });

      if (serviceAccount === null) {
        throw new NotFoundException("integration.service_account_not_found");
      }

      const scopes = filterPlatformPermissions(serviceAccount.scopes);

      if (!scopes.includes("integration.event.ingest")) {
        throw new BadRequestException("integration.service_account_scope_denied");
      }

      const existingEvent = await transaction.integrationEvent.findUnique({
        where: {
          organizationId_sourceSystem_externalId: {
            organizationId: input.organizationId,
            sourceSystem: input.sourceSystem,
            externalId: input.externalId,
          },
        },
      });

      if (existingEvent !== null) {
        return {
          organizationId: input.organizationId,
          event: mapIntegrationEvent(existingEvent as IntegrationEventRecord),
          idempotency: {
            key: createEventIdempotencyKey(input),
            replayed: true,
          },
          audit: {
            action: "integration.event.received",
            subjectType: "integration_event",
            subjectId: existingEvent.id,
          },
          outbox: {
            eventType: "integration.event.received",
            aggregateType: "integration.event",
            aggregateId: existingEvent.id,
          },
        };
      }

      const event = await transaction.integrationEvent.create({
        data: {
          organizationId: input.organizationId,
          serviceAccountId: serviceAccount.id,
          sourceSystem: input.sourceSystem,
          externalId: input.externalId,
          eventType: input.eventType,
          payload: input.payload,
          ...(input.receivedAt === undefined ? {} : { receivedAt: input.receivedAt }),
        },
      });
      await transaction.auditRecord.create({
        data: {
          organizationId: input.organizationId,
          actorType: input.actorType,
          actorId: input.actorId,
          action: "integration.event.received",
          subjectType: "integration_event",
          subjectId: event.id,
          severity: "critical",
          after: {
            serviceAccountId: serviceAccount.id,
            sourceSystem: input.sourceSystem,
            externalId: input.externalId,
            eventType: input.eventType,
          },
          reason: "External integration event registered with tenant idempotency.",
          correlationId: input.correlationId,
          ...createRequestMetadata(input),
        },
      });
      await transaction.outboxEvent.create({
        data: {
          organizationId: input.organizationId,
          eventType: "integration.event.received",
          aggregateType: "integration.event",
          aggregateId: event.id,
          payload: {
            serviceAccountId: serviceAccount.id,
            sourceSystem: input.sourceSystem,
            externalId: input.externalId,
            eventType: input.eventType,
            payload: input.payload,
          },
        },
      });

      return {
        organizationId: input.organizationId,
        event: mapIntegrationEvent(event as IntegrationEventRecord),
        idempotency: {
          key: createEventIdempotencyKey(input),
          replayed: false,
        },
        audit: {
          action: "integration.event.received",
          subjectType: "integration_event",
          subjectId: event.id,
        },
        outbox: {
          eventType: "integration.event.received",
          aggregateType: "integration.event",
          aggregateId: event.id,
        },
      };
    });
  }

  async processPortTosMovement(
    input: ProcessPortTosMovementInput,
  ): Promise<IntegrationPortTosMovementOutput> {
    return this.database.$transaction(async (transaction) => {
      await assertOrganizationExists(transaction, input.organizationId);
      const serviceAccount = await transaction.serviceAccount.findFirst({
        where: {
          id: input.serviceAccountId,
          organizationId: input.organizationId,
          active: true,
        },
        select: {
          id: true,
          scopes: true,
        },
      });

      if (serviceAccount === null) {
        throw new NotFoundException("integration.service_account_not_found");
      }

      const scopes = filterPlatformPermissions(serviceAccount.scopes);

      if (
        !scopes.includes("integration.event.ingest") ||
        !scopes.includes("tracking.event.record")
      ) {
        throw new BadRequestException("integration.service_account_scope_denied");
      }

      const shipment = await transaction.trackingShipment.findFirst({
        where: {
          organizationId: input.organizationId,
          OR: [
            {
              referenceCode: input.shipmentReference,
            },
            {
              externalReference: input.shipmentReference,
            },
          ],
        },
        select: {
          id: true,
          referenceCode: true,
          status: true,
        },
      });

      if (shipment === null) {
        throw new NotFoundException("integration.adapter_tracking_shipment_not_found");
      }

      const existingIntegrationEvent = await transaction.integrationEvent.findUnique({
        where: {
          organizationId_sourceSystem_externalId: {
            organizationId: input.organizationId,
            sourceSystem: input.sourceSystem,
            externalId: input.externalId,
          },
        },
      });
      const trackingIdempotencyKey = createPortTosTrackingIdempotencyKey(input);
      const existingTrackingEvent = await transaction.trackingEvent.findFirst({
        where: {
          organizationId: input.organizationId,
          idempotencyKey: trackingIdempotencyKey,
        },
        include: {
          shipment: {
            select: {
              id: true,
              referenceCode: true,
              status: true,
            },
          },
        },
      });

      if (existingIntegrationEvent !== null) {
        if (existingIntegrationEvent.eventType !== "port_tos.movement") {
          throw new BadRequestException("integration.adapter_external_id_conflict");
        }

        if (existingTrackingEvent !== null) {
          return createPortTosMovementOutput({
            organizationId: input.organizationId,
            integrationEvent: existingIntegrationEvent as IntegrationEventRecord,
            trackingEvent: existingTrackingEvent as AdapterTrackingEventRecord,
            replayed: true,
          });
        }
      } else if (existingTrackingEvent !== null) {
        throw new BadRequestException("integration.adapter_tracking_idempotency_conflict");
      }

      const occurredAt = new Date(input.occurredAt);
      const trackingEventType = mapPortTosMovementToTrackingEventType(input.movementType);
      const previousStatus = shipment.status as TrackingShipmentStatus;
      const currentStatus = resolveShipmentStatusAfterAdapterEvent(
        trackingEventType,
        previousStatus,
      );
      const shouldSetActualArrival = trackingEventType === "arrived";
      const adapterPayload = createPortTosAdapterPayload({
        input,
        trackingEventType,
        previousStatus,
        currentStatus,
      });
      const integrationEvent =
        existingIntegrationEvent ??
        (await transaction.integrationEvent.create({
          data: {
            organizationId: input.organizationId,
            serviceAccountId: serviceAccount.id,
            sourceSystem: input.sourceSystem,
            externalId: input.externalId,
            eventType: "port_tos.movement",
            payload: adapterPayload,
            receivedAt: occurredAt,
          },
        }));

      const trackingEvent = await transaction.trackingEvent.create({
        data: {
          organizationId: input.organizationId,
          shipmentId: shipment.id,
          eventType: trackingEventType,
          occurredAt,
          sourceSystem: input.sourceSystem,
          correlationId: input.correlationId,
          idempotencyKey: trackingIdempotencyKey,
          ...(input.locationName === undefined ? {} : { locationName: input.locationName }),
          ...(input.notes === undefined ? {} : { notes: input.notes }),
          payload: {
            ...adapterPayload,
            integrationEventId: integrationEvent.id,
            adapter: "port-tos",
          },
        },
        include: {
          shipment: {
            select: {
              id: true,
              referenceCode: true,
              status: true,
            },
          },
        },
      });
      const updatedShipment =
        currentStatus === previousStatus && !shouldSetActualArrival
          ? shipment
          : await transaction.trackingShipment.update({
              where: {
                id: shipment.id,
              },
              data: {
                ...(currentStatus === previousStatus ? {} : { status: currentStatus }),
                ...(shouldSetActualArrival ? { actualArrivalAt: occurredAt } : {}),
              },
              select: {
                id: true,
                referenceCode: true,
                status: true,
              },
            });
      const processedAt = new Date();
      const processedIntegrationEvent = await transaction.integrationEvent.update({
        where: {
          id: integrationEvent.id,
        },
        data: {
          processedAt,
        },
      });

      await transaction.auditRecord.create({
        data: {
          organizationId: input.organizationId,
          actorType: input.actorType,
          actorId: input.actorId,
          action: "integration.adapter.port_tos.processed",
          subjectType: "tracking.shipment",
          subjectId: shipment.id,
          severity:
            trackingEventType === "customs_hold" || trackingEventType === "delayed"
              ? "high"
              : "medium",
          before: {
            status: previousStatus,
          },
          after: {
            integrationEventId: integrationEvent.id,
            trackingEventId: trackingEvent.id,
            serviceAccountId: serviceAccount.id,
            sourceSystem: input.sourceSystem,
            externalId: input.externalId,
            shipmentReference: shipment.referenceCode,
            movementType: input.movementType,
            trackingEventType,
            previousStatus,
            currentStatus: updatedShipment.status,
            idempotencyKey: trackingIdempotencyKey,
          },
          reason: "Port TOS movement processed through governed integration adapter.",
          correlationId: input.correlationId,
          ...createRequestMetadata(input),
        },
      });
      await transaction.outboxEvent.create({
        data: {
          organizationId: input.organizationId,
          eventType: "integration.adapter.port_tos.processed",
          aggregateType: "tracking.shipment",
          aggregateId: shipment.id,
          payload: {
            integrationEventId: integrationEvent.id,
            trackingEventId: trackingEvent.id,
            serviceAccountId: serviceAccount.id,
            sourceSystem: input.sourceSystem,
            externalId: input.externalId,
            shipmentReference: shipment.referenceCode,
            movementType: input.movementType,
            trackingEventType,
            previousStatus,
            currentStatus: updatedShipment.status,
            idempotencyKey: trackingIdempotencyKey,
            correlationId: input.correlationId,
          },
        },
      });

      return createPortTosMovementOutput({
        organizationId: input.organizationId,
        integrationEvent: processedIntegrationEvent as IntegrationEventRecord,
        trackingEvent: {
          ...(trackingEvent as AdapterTrackingEventRecord),
          shipment: {
            id: updatedShipment.id,
            referenceCode: updatedShipment.referenceCode,
            status: updatedShipment.status as TrackingShipmentStatus,
          },
        },
        replayed: false,
      });
    });
  }

  async processRailTmsMovement(
    input: ProcessRailTmsMovementInput,
  ): Promise<IntegrationRailTmsMovementOutput> {
    return this.database.$transaction(async (transaction) => {
      await assertOrganizationExists(transaction, input.organizationId);
      const serviceAccount = await transaction.serviceAccount.findFirst({
        where: {
          id: input.serviceAccountId,
          organizationId: input.organizationId,
          active: true,
        },
        select: {
          id: true,
          scopes: true,
        },
      });

      if (serviceAccount === null) {
        throw new NotFoundException("integration.service_account_not_found");
      }

      const scopes = filterPlatformPermissions(serviceAccount.scopes);

      if (
        !scopes.includes("integration.event.ingest") ||
        !scopes.includes("tracking.event.record")
      ) {
        throw new BadRequestException("integration.service_account_scope_denied");
      }

      const shipment = await transaction.trackingShipment.findFirst({
        where: {
          organizationId: input.organizationId,
          OR: [
            {
              referenceCode: input.shipmentReference,
            },
            {
              externalReference: input.shipmentReference,
            },
          ],
        },
        select: {
          id: true,
          referenceCode: true,
          status: true,
        },
      });

      if (shipment === null) {
        throw new NotFoundException("integration.adapter_tracking_shipment_not_found");
      }

      const existingIntegrationEvent = await transaction.integrationEvent.findUnique({
        where: {
          organizationId_sourceSystem_externalId: {
            organizationId: input.organizationId,
            sourceSystem: input.sourceSystem,
            externalId: input.externalId,
          },
        },
      });
      const trackingIdempotencyKey = createRailTmsTrackingIdempotencyKey(input);
      const existingTrackingEvent = await transaction.trackingEvent.findFirst({
        where: {
          organizationId: input.organizationId,
          idempotencyKey: trackingIdempotencyKey,
        },
        include: {
          shipment: {
            select: {
              id: true,
              referenceCode: true,
              status: true,
            },
          },
        },
      });

      if (existingIntegrationEvent !== null) {
        if (existingIntegrationEvent.eventType !== "rail_tms.movement") {
          throw new BadRequestException("integration.adapter_external_id_conflict");
        }

        if (existingTrackingEvent !== null) {
          return createRailTmsMovementOutput({
            organizationId: input.organizationId,
            integrationEvent: existingIntegrationEvent as IntegrationEventRecord,
            trackingEvent: existingTrackingEvent as AdapterTrackingEventRecord,
            replayed: true,
          });
        }
      } else if (existingTrackingEvent !== null) {
        throw new BadRequestException("integration.adapter_tracking_idempotency_conflict");
      }

      const occurredAt = new Date(input.occurredAt);
      const trackingEventType = mapRailTmsMovementToTrackingEventType(input.movementType);
      const previousStatus = shipment.status as TrackingShipmentStatus;
      const currentStatus = resolveShipmentStatusAfterAdapterEvent(
        trackingEventType,
        previousStatus,
      );
      const shouldSetActualArrival = trackingEventType === "arrived";
      const adapterPayload = createRailTmsAdapterPayload({
        input,
        trackingEventType,
        previousStatus,
        currentStatus,
      });
      const integrationEvent =
        existingIntegrationEvent ??
        (await transaction.integrationEvent.create({
          data: {
            organizationId: input.organizationId,
            serviceAccountId: serviceAccount.id,
            sourceSystem: input.sourceSystem,
            externalId: input.externalId,
            eventType: "rail_tms.movement",
            payload: adapterPayload,
            receivedAt: occurredAt,
          },
        }));

      const trackingEvent = await transaction.trackingEvent.create({
        data: {
          organizationId: input.organizationId,
          shipmentId: shipment.id,
          eventType: trackingEventType,
          occurredAt,
          sourceSystem: input.sourceSystem,
          correlationId: input.correlationId,
          idempotencyKey: trackingIdempotencyKey,
          ...(input.locationName === undefined ? {} : { locationName: input.locationName }),
          ...(input.notes === undefined ? {} : { notes: input.notes }),
          payload: {
            ...adapterPayload,
            integrationEventId: integrationEvent.id,
            adapter: "rail-tms",
          },
        },
        include: {
          shipment: {
            select: {
              id: true,
              referenceCode: true,
              status: true,
            },
          },
        },
      });
      const updatedShipment =
        currentStatus === previousStatus && !shouldSetActualArrival
          ? shipment
          : await transaction.trackingShipment.update({
              where: {
                id: shipment.id,
              },
              data: {
                ...(currentStatus === previousStatus ? {} : { status: currentStatus }),
                ...(shouldSetActualArrival ? { actualArrivalAt: occurredAt } : {}),
              },
              select: {
                id: true,
                referenceCode: true,
                status: true,
              },
            });
      const processedAt = new Date();
      const processedIntegrationEvent = await transaction.integrationEvent.update({
        where: {
          id: integrationEvent.id,
        },
        data: {
          processedAt,
        },
      });

      await transaction.auditRecord.create({
        data: {
          organizationId: input.organizationId,
          actorType: input.actorType,
          actorId: input.actorId,
          action: "integration.adapter.rail_tms.processed",
          subjectType: "tracking.shipment",
          subjectId: shipment.id,
          severity:
            trackingEventType === "exception" || trackingEventType === "delayed"
              ? "high"
              : "medium",
          before: {
            status: previousStatus,
          },
          after: {
            integrationEventId: integrationEvent.id,
            trackingEventId: trackingEvent.id,
            serviceAccountId: serviceAccount.id,
            sourceSystem: input.sourceSystem,
            externalId: input.externalId,
            shipmentReference: shipment.referenceCode,
            movementType: input.movementType,
            trainNumber: input.trainNumber ?? null,
            railCorridor: input.railCorridor ?? null,
            wagonCount: input.wagonCount ?? null,
            trackingEventType,
            previousStatus,
            currentStatus: updatedShipment.status,
            idempotencyKey: trackingIdempotencyKey,
          },
          reason: "Rail TMS movement processed through governed integration adapter.",
          correlationId: input.correlationId,
          ...createRequestMetadata(input),
        },
      });
      await transaction.outboxEvent.create({
        data: {
          organizationId: input.organizationId,
          eventType: "integration.adapter.rail_tms.processed",
          aggregateType: "tracking.shipment",
          aggregateId: shipment.id,
          payload: {
            integrationEventId: integrationEvent.id,
            trackingEventId: trackingEvent.id,
            serviceAccountId: serviceAccount.id,
            sourceSystem: input.sourceSystem,
            externalId: input.externalId,
            shipmentReference: shipment.referenceCode,
            movementType: input.movementType,
            trainNumber: input.trainNumber ?? null,
            railCorridor: input.railCorridor ?? null,
            wagonCount: input.wagonCount ?? null,
            trackingEventType,
            previousStatus,
            currentStatus: updatedShipment.status,
            idempotencyKey: trackingIdempotencyKey,
            correlationId: input.correlationId,
          },
        },
      });

      return createRailTmsMovementOutput({
        organizationId: input.organizationId,
        integrationEvent: processedIntegrationEvent as IntegrationEventRecord,
        trackingEvent: {
          ...(trackingEvent as AdapterTrackingEventRecord),
          shipment: {
            id: updatedShipment.id,
            referenceCode: updatedShipment.referenceCode,
            status: updatedShipment.status as TrackingShipmentStatus,
          },
        },
        replayed: false,
      });
    });
  }

  async processCarrierTmsMovement(
    input: ProcessCarrierTmsMovementInput,
  ): Promise<IntegrationCarrierTmsMovementOutput> {
    return this.database.$transaction(async (transaction) => {
      await assertOrganizationExists(transaction, input.organizationId);
      const serviceAccount = await transaction.serviceAccount.findFirst({
        where: {
          id: input.serviceAccountId,
          organizationId: input.organizationId,
          active: true,
        },
        select: {
          id: true,
          scopes: true,
        },
      });

      if (serviceAccount === null) {
        throw new NotFoundException("integration.service_account_not_found");
      }

      const scopes = filterPlatformPermissions(serviceAccount.scopes);

      if (
        !scopes.includes("integration.event.ingest") ||
        !scopes.includes("tracking.event.record")
      ) {
        throw new BadRequestException("integration.service_account_scope_denied");
      }

      const shipment = await transaction.trackingShipment.findFirst({
        where: {
          organizationId: input.organizationId,
          OR: [
            {
              referenceCode: input.shipmentReference,
            },
            {
              externalReference: input.shipmentReference,
            },
          ],
        },
        select: {
          id: true,
          referenceCode: true,
          status: true,
        },
      });

      if (shipment === null) {
        throw new NotFoundException("integration.adapter_tracking_shipment_not_found");
      }

      const existingIntegrationEvent = await transaction.integrationEvent.findUnique({
        where: {
          organizationId_sourceSystem_externalId: {
            organizationId: input.organizationId,
            sourceSystem: input.sourceSystem,
            externalId: input.externalId,
          },
        },
      });
      const trackingIdempotencyKey = createCarrierTmsTrackingIdempotencyKey(input);
      const existingTrackingEvent = await transaction.trackingEvent.findFirst({
        where: {
          organizationId: input.organizationId,
          idempotencyKey: trackingIdempotencyKey,
        },
        include: {
          shipment: {
            select: {
              id: true,
              referenceCode: true,
              status: true,
            },
          },
        },
      });

      if (existingIntegrationEvent !== null) {
        if (existingIntegrationEvent.eventType !== "carrier_tms.movement") {
          throw new BadRequestException("integration.adapter_external_id_conflict");
        }

        if (existingTrackingEvent !== null) {
          return createCarrierTmsMovementOutput({
            organizationId: input.organizationId,
            integrationEvent: existingIntegrationEvent as IntegrationEventRecord,
            trackingEvent: existingTrackingEvent as AdapterTrackingEventRecord,
            replayed: true,
          });
        }
      } else if (existingTrackingEvent !== null) {
        throw new BadRequestException("integration.adapter_tracking_idempotency_conflict");
      }

      const occurredAt = new Date(input.occurredAt);
      const trackingEventType = mapCarrierTmsMovementToTrackingEventType(input.movementType);
      const previousStatus = shipment.status as TrackingShipmentStatus;
      const currentStatus = resolveShipmentStatusAfterAdapterEvent(
        trackingEventType,
        previousStatus,
      );
      const shouldSetActualArrival = trackingEventType === "arrived";
      const adapterPayload = createCarrierTmsAdapterPayload({
        input,
        trackingEventType,
        previousStatus,
        currentStatus,
      });
      const integrationEvent =
        existingIntegrationEvent ??
        (await transaction.integrationEvent.create({
          data: {
            organizationId: input.organizationId,
            serviceAccountId: serviceAccount.id,
            sourceSystem: input.sourceSystem,
            externalId: input.externalId,
            eventType: "carrier_tms.movement",
            payload: adapterPayload,
            receivedAt: occurredAt,
          },
        }));

      const trackingEvent = await transaction.trackingEvent.create({
        data: {
          organizationId: input.organizationId,
          shipmentId: shipment.id,
          eventType: trackingEventType,
          occurredAt,
          sourceSystem: input.sourceSystem,
          correlationId: input.correlationId,
          idempotencyKey: trackingIdempotencyKey,
          ...(input.locationName === undefined ? {} : { locationName: input.locationName }),
          ...(input.notes === undefined ? {} : { notes: input.notes }),
          payload: {
            ...adapterPayload,
            integrationEventId: integrationEvent.id,
            adapter: "carrier-tms",
          },
        },
        include: {
          shipment: {
            select: {
              id: true,
              referenceCode: true,
              status: true,
            },
          },
        },
      });
      const updatedShipment =
        currentStatus === previousStatus && !shouldSetActualArrival
          ? shipment
          : await transaction.trackingShipment.update({
              where: {
                id: shipment.id,
              },
              data: {
                ...(currentStatus === previousStatus ? {} : { status: currentStatus }),
                ...(shouldSetActualArrival ? { actualArrivalAt: occurredAt } : {}),
              },
              select: {
                id: true,
                referenceCode: true,
                status: true,
              },
            });
      const processedAt = new Date();
      const processedIntegrationEvent = await transaction.integrationEvent.update({
        where: {
          id: integrationEvent.id,
        },
        data: {
          processedAt,
        },
      });

      await transaction.auditRecord.create({
        data: {
          organizationId: input.organizationId,
          actorType: input.actorType,
          actorId: input.actorId,
          action: "integration.adapter.carrier_tms.processed",
          subjectType: "tracking.shipment",
          subjectId: shipment.id,
          severity:
            trackingEventType === "exception" || trackingEventType === "delayed"
              ? "high"
              : "medium",
          before: {
            status: previousStatus,
          },
          after: {
            integrationEventId: integrationEvent.id,
            trackingEventId: trackingEvent.id,
            serviceAccountId: serviceAccount.id,
            sourceSystem: input.sourceSystem,
            externalId: input.externalId,
            shipmentReference: shipment.referenceCode,
            movementType: input.movementType,
            carrierCode: input.carrierCode ?? null,
            vehiclePlate: input.vehiclePlate ?? null,
            driverReference: input.driverReference ?? null,
            routeCode: input.routeCode ?? null,
            trackingEventType,
            previousStatus,
            currentStatus: updatedShipment.status,
            idempotencyKey: trackingIdempotencyKey,
          },
          reason: "Carrier TMS movement processed through governed integration adapter.",
          correlationId: input.correlationId,
          ...createRequestMetadata(input),
        },
      });
      await transaction.outboxEvent.create({
        data: {
          organizationId: input.organizationId,
          eventType: "integration.adapter.carrier_tms.processed",
          aggregateType: "tracking.shipment",
          aggregateId: shipment.id,
          payload: {
            integrationEventId: integrationEvent.id,
            trackingEventId: trackingEvent.id,
            serviceAccountId: serviceAccount.id,
            sourceSystem: input.sourceSystem,
            externalId: input.externalId,
            shipmentReference: shipment.referenceCode,
            movementType: input.movementType,
            carrierCode: input.carrierCode ?? null,
            vehiclePlate: input.vehiclePlate ?? null,
            driverReference: input.driverReference ?? null,
            routeCode: input.routeCode ?? null,
            trackingEventType,
            previousStatus,
            currentStatus: updatedShipment.status,
            idempotencyKey: trackingIdempotencyKey,
            correlationId: input.correlationId,
          },
        },
      });

      return createCarrierTmsMovementOutput({
        organizationId: input.organizationId,
        integrationEvent: processedIntegrationEvent as IntegrationEventRecord,
        trackingEvent: {
          ...(trackingEvent as AdapterTrackingEventRecord),
          shipment: {
            id: updatedShipment.id,
            referenceCode: updatedShipment.referenceCode,
            status: updatedShipment.status as TrackingShipmentStatus,
          },
        },
        replayed: false,
      });
    });
  }

  async processTelematicsGpsPosition(
    input: ProcessTelematicsGpsPositionInput,
  ): Promise<IntegrationTelematicsGpsPositionOutput> {
    return this.database.$transaction(async (transaction) => {
      await assertOrganizationExists(transaction, input.organizationId);
      const serviceAccount = await transaction.serviceAccount.findFirst({
        where: {
          id: input.serviceAccountId,
          organizationId: input.organizationId,
          active: true,
        },
        select: {
          id: true,
          scopes: true,
        },
      });

      if (serviceAccount === null) {
        throw new NotFoundException("integration.service_account_not_found");
      }

      const scopes = filterPlatformPermissions(serviceAccount.scopes);

      if (
        !scopes.includes("integration.event.ingest") ||
        !scopes.includes("tracking.event.record")
      ) {
        throw new BadRequestException("integration.service_account_scope_denied");
      }

      const shipment = await transaction.trackingShipment.findFirst({
        where: {
          organizationId: input.organizationId,
          OR: [
            {
              referenceCode: input.shipmentReference,
            },
            {
              externalReference: input.shipmentReference,
            },
          ],
        },
        select: {
          id: true,
          referenceCode: true,
          status: true,
        },
      });

      if (shipment === null) {
        throw new NotFoundException("integration.adapter_tracking_shipment_not_found");
      }

      const existingIntegrationEvent = await transaction.integrationEvent.findUnique({
        where: {
          organizationId_sourceSystem_externalId: {
            organizationId: input.organizationId,
            sourceSystem: input.sourceSystem,
            externalId: input.externalId,
          },
        },
      });
      const trackingIdempotencyKey = createTelematicsGpsTrackingIdempotencyKey(input);
      const existingTrackingEvent = await transaction.trackingEvent.findFirst({
        where: {
          organizationId: input.organizationId,
          idempotencyKey: trackingIdempotencyKey,
        },
        include: {
          shipment: {
            select: {
              id: true,
              referenceCode: true,
              status: true,
            },
          },
        },
      });

      if (existingIntegrationEvent !== null) {
        if (existingIntegrationEvent.eventType !== "telematics_gps.position") {
          throw new BadRequestException("integration.adapter_external_id_conflict");
        }

        if (existingTrackingEvent !== null) {
          return createTelematicsGpsPositionOutput({
            organizationId: input.organizationId,
            integrationEvent: existingIntegrationEvent as IntegrationEventRecord,
            trackingEvent: existingTrackingEvent as AdapterTrackingEventRecord,
            replayed: true,
          });
        }
      } else if (existingTrackingEvent !== null) {
        throw new BadRequestException("integration.adapter_tracking_idempotency_conflict");
      }

      const occurredAt = new Date(input.occurredAt);
      const trackingEventType = mapTelematicsGpsPositionToTrackingEventType(input.positionType);
      const previousStatus = shipment.status as TrackingShipmentStatus;
      const currentStatus = resolveShipmentStatusAfterAdapterEvent(
        trackingEventType,
        previousStatus,
      );
      const shouldSetActualArrival = trackingEventType === "arrived";
      const adapterPayload = createTelematicsGpsAdapterPayload({
        input,
        trackingEventType,
        previousStatus,
        currentStatus,
      });
      const integrationEvent =
        existingIntegrationEvent ??
        (await transaction.integrationEvent.create({
          data: {
            organizationId: input.organizationId,
            serviceAccountId: serviceAccount.id,
            sourceSystem: input.sourceSystem,
            externalId: input.externalId,
            eventType: "telematics_gps.position",
            payload: adapterPayload,
            receivedAt: occurredAt,
          },
        }));

      const trackingEvent = await transaction.trackingEvent.create({
        data: {
          organizationId: input.organizationId,
          shipmentId: shipment.id,
          eventType: trackingEventType,
          occurredAt,
          sourceSystem: input.sourceSystem,
          correlationId: input.correlationId,
          idempotencyKey: trackingIdempotencyKey,
          ...(input.geofenceName === undefined ? {} : { locationName: input.geofenceName }),
          ...(input.notes === undefined ? {} : { notes: input.notes }),
          payload: {
            ...adapterPayload,
            integrationEventId: integrationEvent.id,
            adapter: "telematics-gps",
          },
        },
        include: {
          shipment: {
            select: {
              id: true,
              referenceCode: true,
              status: true,
            },
          },
        },
      });
      const updatedShipment =
        currentStatus === previousStatus && !shouldSetActualArrival
          ? shipment
          : await transaction.trackingShipment.update({
              where: {
                id: shipment.id,
              },
              data: {
                ...(currentStatus === previousStatus ? {} : { status: currentStatus }),
                ...(shouldSetActualArrival ? { actualArrivalAt: occurredAt } : {}),
              },
              select: {
                id: true,
                referenceCode: true,
                status: true,
              },
            });
      const processedAt = new Date();
      const processedIntegrationEvent = await transaction.integrationEvent.update({
        where: {
          id: integrationEvent.id,
        },
        data: {
          processedAt,
        },
      });

      await transaction.auditRecord.create({
        data: {
          organizationId: input.organizationId,
          actorType: input.actorType,
          actorId: input.actorId,
          action: "integration.adapter.telematics_gps.processed",
          subjectType: "tracking.shipment",
          subjectId: shipment.id,
          severity:
            trackingEventType === "exception" || trackingEventType === "delayed"
              ? "high"
              : "medium",
          before: {
            status: previousStatus,
          },
          after: {
            integrationEventId: integrationEvent.id,
            trackingEventId: trackingEvent.id,
            serviceAccountId: serviceAccount.id,
            sourceSystem: input.sourceSystem,
            externalId: input.externalId,
            shipmentReference: shipment.referenceCode,
            positionType: input.positionType,
            latitude: input.latitude,
            longitude: input.longitude,
            deviceId: input.deviceId ?? null,
            assetReference: input.assetReference ?? null,
            geofenceName: input.geofenceName ?? null,
            speedKph: input.speedKph ?? null,
            headingDegrees: input.headingDegrees ?? null,
            routeCode: input.routeCode ?? null,
            trackingEventType,
            previousStatus,
            currentStatus: updatedShipment.status,
            idempotencyKey: trackingIdempotencyKey,
          },
          reason: "Telematics GPS position processed through governed integration adapter.",
          correlationId: input.correlationId,
          ...createRequestMetadata(input),
        },
      });
      await transaction.outboxEvent.create({
        data: {
          organizationId: input.organizationId,
          eventType: "integration.adapter.telematics_gps.processed",
          aggregateType: "tracking.shipment",
          aggregateId: shipment.id,
          payload: {
            integrationEventId: integrationEvent.id,
            trackingEventId: trackingEvent.id,
            serviceAccountId: serviceAccount.id,
            sourceSystem: input.sourceSystem,
            externalId: input.externalId,
            shipmentReference: shipment.referenceCode,
            positionType: input.positionType,
            latitude: input.latitude,
            longitude: input.longitude,
            deviceId: input.deviceId ?? null,
            assetReference: input.assetReference ?? null,
            geofenceName: input.geofenceName ?? null,
            speedKph: input.speedKph ?? null,
            headingDegrees: input.headingDegrees ?? null,
            routeCode: input.routeCode ?? null,
            trackingEventType,
            previousStatus,
            currentStatus: updatedShipment.status,
            idempotencyKey: trackingIdempotencyKey,
            correlationId: input.correlationId,
          },
        },
      });

      return createTelematicsGpsPositionOutput({
        organizationId: input.organizationId,
        integrationEvent: processedIntegrationEvent as IntegrationEventRecord,
        trackingEvent: {
          ...(trackingEvent as AdapterTrackingEventRecord),
          shipment: {
            id: updatedShipment.id,
            referenceCode: updatedShipment.referenceCode,
            status: updatedShipment.status as TrackingShipmentStatus,
          },
        },
        replayed: false,
      });
    });
  }

  async processCustomsErpStatus(
    input: ProcessCustomsErpStatusInput,
  ): Promise<IntegrationCustomsErpStatusOutput> {
    return this.database.$transaction(async (transaction) => {
      await assertOrganizationExists(transaction, input.organizationId);
      const serviceAccount = await transaction.serviceAccount.findFirst({
        where: {
          id: input.serviceAccountId,
          organizationId: input.organizationId,
          active: true,
        },
        select: {
          id: true,
          scopes: true,
        },
      });

      if (serviceAccount === null) {
        throw new NotFoundException("integration.service_account_not_found");
      }

      const scopes = filterPlatformPermissions(serviceAccount.scopes);

      if (
        !scopes.includes("integration.event.ingest") ||
        !scopes.includes("tracking.event.record")
      ) {
        throw new BadRequestException("integration.service_account_scope_denied");
      }

      const shipment = await transaction.trackingShipment.findFirst({
        where: {
          organizationId: input.organizationId,
          OR: [
            {
              referenceCode: input.shipmentReference,
            },
            {
              externalReference: input.shipmentReference,
            },
          ],
        },
        select: {
          id: true,
          referenceCode: true,
          status: true,
        },
      });

      if (shipment === null) {
        throw new NotFoundException("integration.adapter_tracking_shipment_not_found");
      }

      const existingIntegrationEvent = await transaction.integrationEvent.findUnique({
        where: {
          organizationId_sourceSystem_externalId: {
            organizationId: input.organizationId,
            sourceSystem: input.sourceSystem,
            externalId: input.externalId,
          },
        },
      });
      const trackingIdempotencyKey = createCustomsErpTrackingIdempotencyKey(input);
      const existingTrackingEvent = await transaction.trackingEvent.findFirst({
        where: {
          organizationId: input.organizationId,
          idempotencyKey: trackingIdempotencyKey,
        },
        include: {
          shipment: {
            select: {
              id: true,
              referenceCode: true,
              status: true,
            },
          },
        },
      });

      if (existingIntegrationEvent !== null) {
        if (existingIntegrationEvent.eventType !== "customs_erp.status") {
          throw new BadRequestException("integration.adapter_external_id_conflict");
        }

        if (existingTrackingEvent !== null) {
          return createCustomsErpStatusOutput({
            organizationId: input.organizationId,
            integrationEvent: existingIntegrationEvent as IntegrationEventRecord,
            trackingEvent: existingTrackingEvent as AdapterTrackingEventRecord,
            replayed: true,
          });
        }
      } else if (existingTrackingEvent !== null) {
        throw new BadRequestException("integration.adapter_tracking_idempotency_conflict");
      }

      const occurredAt = new Date(input.occurredAt);
      const trackingEventType = mapCustomsErpStatusToTrackingEventType(input.statusType);
      const previousStatus = shipment.status as TrackingShipmentStatus;
      const currentStatus = resolveShipmentStatusAfterAdapterEvent(
        trackingEventType,
        previousStatus,
      );
      const adapterPayload = createCustomsErpAdapterPayload({
        input,
        trackingEventType,
        previousStatus,
        currentStatus,
      });
      const integrationEvent =
        existingIntegrationEvent ??
        (await transaction.integrationEvent.create({
          data: {
            organizationId: input.organizationId,
            serviceAccountId: serviceAccount.id,
            sourceSystem: input.sourceSystem,
            externalId: input.externalId,
            eventType: "customs_erp.status",
            payload: adapterPayload,
            receivedAt: occurredAt,
          },
        }));

      const trackingEvent = await transaction.trackingEvent.create({
        data: {
          organizationId: input.organizationId,
          shipmentId: shipment.id,
          eventType: trackingEventType,
          occurredAt,
          sourceSystem: input.sourceSystem,
          correlationId: input.correlationId,
          idempotencyKey: trackingIdempotencyKey,
          ...(input.notes === undefined ? {} : { notes: input.notes }),
          payload: {
            ...adapterPayload,
            integrationEventId: integrationEvent.id,
            adapter: "customs-erp",
          },
        },
        include: {
          shipment: {
            select: {
              id: true,
              referenceCode: true,
              status: true,
            },
          },
        },
      });
      const updatedShipment =
        currentStatus === previousStatus
          ? shipment
          : await transaction.trackingShipment.update({
              where: {
                id: shipment.id,
              },
              data: {
                status: currentStatus,
              },
              select: {
                id: true,
                referenceCode: true,
                status: true,
              },
            });
      const processedAt = new Date();
      const processedIntegrationEvent = await transaction.integrationEvent.update({
        where: {
          id: integrationEvent.id,
        },
        data: {
          processedAt,
        },
      });

      await transaction.auditRecord.create({
        data: {
          organizationId: input.organizationId,
          actorType: input.actorType,
          actorId: input.actorId,
          action: "integration.adapter.customs_erp.processed",
          subjectType: "tracking.shipment",
          subjectId: shipment.id,
          severity:
            trackingEventType === "customs_hold" || trackingEventType === "exception"
              ? "high"
              : "medium",
          before: {
            status: previousStatus,
          },
          after: {
            integrationEventId: integrationEvent.id,
            trackingEventId: trackingEvent.id,
            serviceAccountId: serviceAccount.id,
            sourceSystem: input.sourceSystem,
            externalId: input.externalId,
            shipmentReference: shipment.referenceCode,
            statusType: input.statusType,
            customsReference: input.customsReference ?? null,
            documentReference: input.documentReference ?? null,
            declarationNumber: input.declarationNumber ?? null,
            brokerReference: input.brokerReference ?? null,
            authorityCode: input.authorityCode ?? null,
            trackingEventType,
            previousStatus,
            currentStatus: updatedShipment.status,
            idempotencyKey: trackingIdempotencyKey,
          },
          reason: "Customs ERP status processed through governed integration adapter.",
          correlationId: input.correlationId,
          ...createRequestMetadata(input),
        },
      });
      await transaction.outboxEvent.create({
        data: {
          organizationId: input.organizationId,
          eventType: "integration.adapter.customs_erp.processed",
          aggregateType: "tracking.shipment",
          aggregateId: shipment.id,
          payload: {
            integrationEventId: integrationEvent.id,
            trackingEventId: trackingEvent.id,
            serviceAccountId: serviceAccount.id,
            sourceSystem: input.sourceSystem,
            externalId: input.externalId,
            shipmentReference: shipment.referenceCode,
            statusType: input.statusType,
            customsReference: input.customsReference ?? null,
            documentReference: input.documentReference ?? null,
            declarationNumber: input.declarationNumber ?? null,
            brokerReference: input.brokerReference ?? null,
            authorityCode: input.authorityCode ?? null,
            trackingEventType,
            previousStatus,
            currentStatus: updatedShipment.status,
            idempotencyKey: trackingIdempotencyKey,
            correlationId: input.correlationId,
          },
        },
      });

      return createCustomsErpStatusOutput({
        organizationId: input.organizationId,
        integrationEvent: processedIntegrationEvent as IntegrationEventRecord,
        trackingEvent: {
          ...(trackingEvent as AdapterTrackingEventRecord),
          shipment: {
            id: updatedShipment.id,
            referenceCode: updatedShipment.referenceCode,
            status: updatedShipment.status as TrackingShipmentStatus,
          },
        },
        replayed: false,
      });
    });
  }

  async processWarehouseWmsActivity(
    input: ProcessWarehouseWmsActivityInput,
  ): Promise<IntegrationWarehouseWmsActivityOutput> {
    return this.database.$transaction(async (transaction) => {
      await assertOrganizationExists(transaction, input.organizationId);
      const serviceAccount = await transaction.serviceAccount.findFirst({
        where: {
          id: input.serviceAccountId,
          organizationId: input.organizationId,
          active: true,
        },
        select: {
          id: true,
          scopes: true,
        },
      });

      if (serviceAccount === null) {
        throw new NotFoundException("integration.service_account_not_found");
      }

      const scopes = filterPlatformPermissions(serviceAccount.scopes);

      if (
        !scopes.includes("integration.event.ingest") ||
        !scopes.includes("tracking.event.record")
      ) {
        throw new BadRequestException("integration.service_account_scope_denied");
      }

      const shipment = await transaction.trackingShipment.findFirst({
        where: {
          organizationId: input.organizationId,
          OR: [
            {
              referenceCode: input.shipmentReference,
            },
            {
              externalReference: input.shipmentReference,
            },
          ],
        },
        select: {
          id: true,
          referenceCode: true,
          status: true,
        },
      });

      if (shipment === null) {
        throw new NotFoundException("integration.adapter_tracking_shipment_not_found");
      }

      const existingIntegrationEvent = await transaction.integrationEvent.findUnique({
        where: {
          organizationId_sourceSystem_externalId: {
            organizationId: input.organizationId,
            sourceSystem: input.sourceSystem,
            externalId: input.externalId,
          },
        },
      });
      const trackingIdempotencyKey = createWarehouseWmsTrackingIdempotencyKey(input);
      const existingTrackingEvent = await transaction.trackingEvent.findFirst({
        where: {
          organizationId: input.organizationId,
          idempotencyKey: trackingIdempotencyKey,
        },
        include: {
          shipment: {
            select: {
              id: true,
              referenceCode: true,
              status: true,
            },
          },
        },
      });

      if (existingIntegrationEvent !== null) {
        if (existingIntegrationEvent.eventType !== "warehouse_wms.activity") {
          throw new BadRequestException("integration.adapter_external_id_conflict");
        }

        if (existingTrackingEvent !== null) {
          return createWarehouseWmsActivityOutput({
            organizationId: input.organizationId,
            integrationEvent: existingIntegrationEvent as IntegrationEventRecord,
            trackingEvent: existingTrackingEvent as AdapterTrackingEventRecord,
            replayed: true,
          });
        }
      } else if (existingTrackingEvent !== null) {
        throw new BadRequestException("integration.adapter_tracking_idempotency_conflict");
      }

      const occurredAt = new Date(input.occurredAt);
      const trackingEventType = mapWarehouseWmsActivityToTrackingEventType(input.activityType);
      const previousStatus = shipment.status as TrackingShipmentStatus;
      const currentStatus = resolveShipmentStatusAfterAdapterEvent(
        trackingEventType,
        previousStatus,
      );
      const shouldSetActualArrival = trackingEventType === "arrived";
      const adapterPayload = createWarehouseWmsAdapterPayload({
        input,
        trackingEventType,
        previousStatus,
        currentStatus,
      });
      const integrationEvent =
        existingIntegrationEvent ??
        (await transaction.integrationEvent.create({
          data: {
            organizationId: input.organizationId,
            serviceAccountId: serviceAccount.id,
            sourceSystem: input.sourceSystem,
            externalId: input.externalId,
            eventType: "warehouse_wms.activity",
            payload: adapterPayload,
            receivedAt: occurredAt,
          },
        }));

      const trackingEvent = await transaction.trackingEvent.create({
        data: {
          organizationId: input.organizationId,
          shipmentId: shipment.id,
          eventType: trackingEventType,
          occurredAt,
          sourceSystem: input.sourceSystem,
          correlationId: input.correlationId,
          idempotencyKey: trackingIdempotencyKey,
          ...(input.locationName === undefined ? {} : { locationName: input.locationName }),
          ...(input.notes === undefined ? {} : { notes: input.notes }),
          payload: {
            ...adapterPayload,
            integrationEventId: integrationEvent.id,
            adapter: "warehouse-wms",
          },
        },
        include: {
          shipment: {
            select: {
              id: true,
              referenceCode: true,
              status: true,
            },
          },
        },
      });
      const updatedShipment =
        currentStatus === previousStatus && !shouldSetActualArrival
          ? shipment
          : await transaction.trackingShipment.update({
              where: {
                id: shipment.id,
              },
              data: {
                ...(currentStatus === previousStatus ? {} : { status: currentStatus }),
                ...(shouldSetActualArrival ? { actualArrivalAt: occurredAt } : {}),
              },
              select: {
                id: true,
                referenceCode: true,
                status: true,
              },
            });
      const processedAt = new Date();
      const processedIntegrationEvent = await transaction.integrationEvent.update({
        where: {
          id: integrationEvent.id,
        },
        data: {
          processedAt,
        },
      });

      await transaction.auditRecord.create({
        data: {
          organizationId: input.organizationId,
          actorType: input.actorType,
          actorId: input.actorId,
          action: "integration.adapter.warehouse_wms.processed",
          subjectType: "tracking.shipment",
          subjectId: shipment.id,
          severity:
            trackingEventType === "exception" || trackingEventType === "delayed"
              ? "high"
              : "medium",
          before: {
            status: previousStatus,
          },
          after: {
            integrationEventId: integrationEvent.id,
            trackingEventId: trackingEvent.id,
            serviceAccountId: serviceAccount.id,
            sourceSystem: input.sourceSystem,
            externalId: input.externalId,
            shipmentReference: shipment.referenceCode,
            activityType: input.activityType,
            warehouseCode: input.warehouseCode ?? null,
            zoneCode: input.zoneCode ?? null,
            dockDoor: input.dockDoor ?? null,
            containerReference: input.containerReference ?? null,
            handlingUnitReference: input.handlingUnitReference ?? null,
            operatorReference: input.operatorReference ?? null,
            palletCount: input.palletCount ?? null,
            trackingEventType,
            previousStatus,
            currentStatus: updatedShipment.status,
            idempotencyKey: trackingIdempotencyKey,
          },
          reason: "Warehouse WMS activity processed through governed integration adapter.",
          correlationId: input.correlationId,
          ...createRequestMetadata(input),
        },
      });
      await transaction.outboxEvent.create({
        data: {
          organizationId: input.organizationId,
          eventType: "integration.adapter.warehouse_wms.processed",
          aggregateType: "tracking.shipment",
          aggregateId: shipment.id,
          payload: {
            integrationEventId: integrationEvent.id,
            trackingEventId: trackingEvent.id,
            serviceAccountId: serviceAccount.id,
            sourceSystem: input.sourceSystem,
            externalId: input.externalId,
            shipmentReference: shipment.referenceCode,
            activityType: input.activityType,
            warehouseCode: input.warehouseCode ?? null,
            zoneCode: input.zoneCode ?? null,
            dockDoor: input.dockDoor ?? null,
            containerReference: input.containerReference ?? null,
            handlingUnitReference: input.handlingUnitReference ?? null,
            operatorReference: input.operatorReference ?? null,
            palletCount: input.palletCount ?? null,
            trackingEventType,
            previousStatus,
            currentStatus: updatedShipment.status,
            idempotencyKey: trackingIdempotencyKey,
            correlationId: input.correlationId,
          },
        },
      });

      return createWarehouseWmsActivityOutput({
        organizationId: input.organizationId,
        integrationEvent: processedIntegrationEvent as IntegrationEventRecord,
        trackingEvent: {
          ...(trackingEvent as AdapterTrackingEventRecord),
          shipment: {
            id: updatedShipment.id,
            referenceCode: updatedShipment.referenceCode,
            status: updatedShipment.status as TrackingShipmentStatus,
          },
        },
        replayed: false,
      });
    });
  }
}

type IntegrationQueryClient = Pick<
  SaptmPrismaClient,
  "apiKey" | "integrationEvent" | "organization" | "serviceAccount"
>;

async function resolveIntegrationTotals(
  database: IntegrationQueryClient,
  organizationId: string,
): Promise<IntegrationOverviewOutput["totals"]> {
  const [
    serviceAccounts,
    activeServiceAccounts,
    activeApiKeys,
    integrationEvents,
    processedEvents,
  ] = await Promise.all([
    database.serviceAccount.count({
      where: {
        organizationId,
      },
    }),
    database.serviceAccount.count({
      where: {
        organizationId,
        active: true,
      },
    }),
    database.apiKey.count({
      where: {
        revokedAt: null,
        serviceAccount: {
          organizationId,
          active: true,
        },
      },
    }),
    database.integrationEvent.count({
      where: {
        organizationId,
      },
    }),
    database.integrationEvent.count({
      where: {
        organizationId,
        processedAt: {
          not: null,
        },
      },
    }),
  ]);

  return {
    serviceAccounts,
    activeServiceAccounts,
    activeApiKeys,
    integrationEvents,
    processedEvents,
  };
}

async function assertOrganizationExists(
  database: IntegrationQueryClient,
  organizationId: string,
): Promise<void> {
  const organization = await database.organization.findUnique({
    where: {
      id: organizationId,
    },
    select: {
      id: true,
    },
  });

  if (organization === null) {
    throw new NotFoundException("integration.organization_not_found");
  }
}

async function findServiceAccountForOutput(
  database: IntegrationQueryClient,
  serviceAccountId: string,
): Promise<ServiceAccountRecord> {
  const serviceAccount = await database.serviceAccount.findUnique({
    where: {
      id: serviceAccountId,
    },
    include: {
      apiKeys: {
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      },
    },
  });

  if (serviceAccount === null) {
    throw new NotFoundException("integration.service_account_not_found");
  }

  return serviceAccount as ServiceAccountRecord;
}

function mapServiceAccount(
  serviceAccount: ServiceAccountRecord,
): IntegrationOverviewOutput["serviceAccounts"][number] {
  return {
    id: serviceAccount.id,
    name: serviceAccount.name,
    scopes: filterPlatformPermissions(serviceAccount.scopes) as PlatformPermission[],
    active: serviceAccount.active,
    createdByActorId: serviceAccount.createdByActorId,
    lastRotatedAt: toIsoStringOrNull(serviceAccount.lastRotatedAt),
    createdAt: serviceAccount.createdAt.toISOString(),
    updatedAt: serviceAccount.updatedAt.toISOString(),
    apiKeys: serviceAccount.apiKeys.map(mapApiKey),
  };
}

function mapApiKey(
  apiKey: ApiKeyRecord,
): IntegrationOverviewOutput["serviceAccounts"][number]["apiKeys"][number] {
  return {
    id: apiKey.id,
    prefix: apiKey.prefix,
    expiresAt: toIsoStringOrNull(apiKey.expiresAt),
    lastUsedAt: toIsoStringOrNull(apiKey.lastUsedAt),
    revokedAt: toIsoStringOrNull(apiKey.revokedAt),
    createdAt: apiKey.createdAt.toISOString(),
  };
}

function mapIntegrationEvent(
  event: IntegrationEventRecord,
): IntegrationOverviewOutput["recentEvents"][number] {
  return {
    id: event.id,
    serviceAccountId: event.serviceAccountId,
    sourceSystem: event.sourceSystem,
    externalId: event.externalId,
    eventType: event.eventType,
    payload: event.payload,
    receivedAt: event.receivedAt.toISOString(),
    processedAt: toIsoStringOrNull(event.processedAt),
  };
}

function createEventIdempotencyKey(
  input: Pick<IntegrationEventRecordInput, "externalId" | "sourceSystem">,
): string {
  return `${input.sourceSystem}:${input.externalId}`;
}

function createPortTosTrackingIdempotencyKey(
  input: Pick<IntegrationPortTosMovementInput, "externalId" | "sourceSystem">,
): string {
  return `port-tos:${input.sourceSystem}:${input.externalId}`;
}

function createRailTmsTrackingIdempotencyKey(
  input: Pick<IntegrationRailTmsMovementInput, "externalId" | "sourceSystem">,
): string {
  return `rail-tms:${input.sourceSystem}:${input.externalId}`;
}

function createCarrierTmsTrackingIdempotencyKey(
  input: Pick<IntegrationCarrierTmsMovementInput, "externalId" | "sourceSystem">,
): string {
  return `carrier-tms:${input.sourceSystem}:${input.externalId}`;
}

function createTelematicsGpsTrackingIdempotencyKey(
  input: Pick<IntegrationTelematicsGpsPositionInput, "externalId" | "sourceSystem">,
): string {
  return `telematics-gps:${input.sourceSystem}:${input.externalId}`;
}

function createCustomsErpTrackingIdempotencyKey(
  input: Pick<IntegrationCustomsErpStatusInput, "externalId" | "sourceSystem">,
): string {
  return `customs-erp:${input.sourceSystem}:${input.externalId}`;
}

function createWarehouseWmsTrackingIdempotencyKey(
  input: Pick<IntegrationWarehouseWmsActivityInput, "externalId" | "sourceSystem">,
): string {
  return `warehouse-wms:${input.sourceSystem}:${input.externalId}`;
}

function mapPortTosMovementToTrackingEventType(
  movementType: IntegrationPortTosMovementInput["movementType"],
): TrackingEventType {
  if (movementType === "departed") {
    return "departed";
  }

  if (movementType === "arrived") {
    return "arrived";
  }

  if (movementType === "delayed") {
    return "delayed";
  }

  if (movementType === "customs_hold") {
    return "customs_hold";
  }

  if (movementType === "handover_completed") {
    return "handover_completed";
  }

  return "location_updated";
}

function mapRailTmsMovementToTrackingEventType(
  movementType: IntegrationRailTmsMovementInput["movementType"],
): TrackingEventType {
  if (movementType === "train_departed" || movementType === "yard_departure") {
    return "departed";
  }

  if (movementType === "train_arrived") {
    return "arrived";
  }

  if (movementType === "delay_reported") {
    return "delayed";
  }

  if (movementType === "infrastructure_hold") {
    return "exception";
  }

  if (movementType === "handover_completed") {
    return "handover_completed";
  }

  return "location_updated";
}

function mapCarrierTmsMovementToTrackingEventType(
  movementType: IntegrationCarrierTmsMovementInput["movementType"],
): TrackingEventType {
  if (movementType === "pickup_completed" || movementType === "linehaul_departed") {
    return "departed";
  }

  if (movementType === "delivery_arrived" || movementType === "delivery_completed") {
    return "arrived";
  }

  if (movementType === "delay_reported") {
    return "delayed";
  }

  if (movementType === "exception_reported") {
    return "exception";
  }

  if (movementType === "handover_completed") {
    return "handover_completed";
  }

  return "location_updated";
}

function mapTelematicsGpsPositionToTrackingEventType(
  positionType: IntegrationTelematicsGpsPositionInput["positionType"],
): TrackingEventType {
  if (positionType === "geofence_departure") {
    return "departed";
  }

  if (positionType === "geofence_arrival") {
    return "arrived";
  }

  if (positionType === "eta_delay") {
    return "delayed";
  }

  if (
    positionType === "route_deviation" ||
    positionType === "sensor_alert" ||
    positionType === "telemetry_lost"
  ) {
    return "exception";
  }

  return "location_updated";
}

function mapCustomsErpStatusToTrackingEventType(
  statusType: IntegrationCustomsErpStatusInput["statusType"],
): TrackingEventType {
  if (statusType === "customs_hold" || statusType === "inspection_required") {
    return "customs_hold";
  }

  if (statusType === "customs_cleared" || statusType === "release_authorized") {
    return "released";
  }

  if (statusType === "clearance_rejected") {
    return "exception";
  }

  return "location_updated";
}

function mapWarehouseWmsActivityToTrackingEventType(
  activityType: IntegrationWarehouseWmsActivityInput["activityType"],
): TrackingEventType {
  if (activityType === "received_at_warehouse") {
    return "arrived";
  }

  if (activityType === "loaded_for_dispatch" || activityType === "yard_check_out") {
    return "departed";
  }

  if (activityType === "inventory_exception" || activityType === "damage_reported") {
    return "exception";
  }

  if (activityType === "handover_completed") {
    return "handover_completed";
  }

  return "location_updated";
}

function resolveShipmentStatusAfterAdapterEvent(
  eventType: TrackingEventType,
  currentStatus: TrackingShipmentStatus,
): TrackingShipmentStatus {
  if (currentStatus === "completed" || currentStatus === "cancelled") {
    return currentStatus;
  }

  if (eventType === "departed" || eventType === "released") {
    return "in_transit";
  }

  if (eventType === "arrived") {
    return "arrived";
  }

  if (eventType === "delayed") {
    return "delayed";
  }

  if (eventType === "exception" || eventType === "customs_hold") {
    return "exception";
  }

  return currentStatus;
}

function createPortTosAdapterPayload(input: {
  input: IntegrationPortTosMovementInput;
  trackingEventType: TrackingEventType;
  previousStatus: TrackingShipmentStatus;
  currentStatus: TrackingShipmentStatus;
}): Record<string, string | number | boolean | null> {
  return {
    ...(input.input.payload ?? {}),
    movementType: input.input.movementType,
    shipmentReference: input.input.shipmentReference,
    trackingEventType: input.trackingEventType,
    previousStatus: input.previousStatus,
    currentStatus: input.currentStatus,
    ...(input.input.locationName === undefined ? {} : { locationName: input.input.locationName }),
  };
}

function createRailTmsAdapterPayload(input: {
  input: IntegrationRailTmsMovementInput;
  trackingEventType: TrackingEventType;
  previousStatus: TrackingShipmentStatus;
  currentStatus: TrackingShipmentStatus;
}): Record<string, string | number | boolean | null> {
  return {
    ...(input.input.payload ?? {}),
    movementType: input.input.movementType,
    shipmentReference: input.input.shipmentReference,
    trackingEventType: input.trackingEventType,
    previousStatus: input.previousStatus,
    currentStatus: input.currentStatus,
    ...(input.input.locationName === undefined ? {} : { locationName: input.input.locationName }),
    ...(input.input.trainNumber === undefined ? {} : { trainNumber: input.input.trainNumber }),
    ...(input.input.railCorridor === undefined ? {} : { railCorridor: input.input.railCorridor }),
    ...(input.input.wagonCount === undefined ? {} : { wagonCount: input.input.wagonCount }),
  };
}

function createCarrierTmsAdapterPayload(input: {
  input: IntegrationCarrierTmsMovementInput;
  trackingEventType: TrackingEventType;
  previousStatus: TrackingShipmentStatus;
  currentStatus: TrackingShipmentStatus;
}): Record<string, string | number | boolean | null> {
  return {
    ...(input.input.payload ?? {}),
    movementType: input.input.movementType,
    shipmentReference: input.input.shipmentReference,
    trackingEventType: input.trackingEventType,
    previousStatus: input.previousStatus,
    currentStatus: input.currentStatus,
    ...(input.input.locationName === undefined ? {} : { locationName: input.input.locationName }),
    ...(input.input.carrierCode === undefined ? {} : { carrierCode: input.input.carrierCode }),
    ...(input.input.vehiclePlate === undefined ? {} : { vehiclePlate: input.input.vehiclePlate }),
    ...(input.input.driverReference === undefined
      ? {}
      : { driverReference: input.input.driverReference }),
    ...(input.input.routeCode === undefined ? {} : { routeCode: input.input.routeCode }),
  };
}

function createTelematicsGpsAdapterPayload(input: {
  input: IntegrationTelematicsGpsPositionInput;
  trackingEventType: TrackingEventType;
  previousStatus: TrackingShipmentStatus;
  currentStatus: TrackingShipmentStatus;
}): Record<string, string | number | boolean | null> {
  return {
    ...(input.input.payload ?? {}),
    positionType: input.input.positionType,
    shipmentReference: input.input.shipmentReference,
    latitude: input.input.latitude,
    longitude: input.input.longitude,
    trackingEventType: input.trackingEventType,
    previousStatus: input.previousStatus,
    currentStatus: input.currentStatus,
    ...(input.input.deviceId === undefined ? {} : { deviceId: input.input.deviceId }),
    ...(input.input.assetReference === undefined
      ? {}
      : { assetReference: input.input.assetReference }),
    ...(input.input.geofenceName === undefined ? {} : { geofenceName: input.input.geofenceName }),
    ...(input.input.speedKph === undefined ? {} : { speedKph: input.input.speedKph }),
    ...(input.input.headingDegrees === undefined
      ? {}
      : { headingDegrees: input.input.headingDegrees }),
    ...(input.input.routeCode === undefined ? {} : { routeCode: input.input.routeCode }),
  };
}

function createCustomsErpAdapterPayload(input: {
  input: IntegrationCustomsErpStatusInput;
  trackingEventType: TrackingEventType;
  previousStatus: TrackingShipmentStatus;
  currentStatus: TrackingShipmentStatus;
}): Record<string, string | number | boolean | null> {
  return {
    ...(input.input.payload ?? {}),
    statusType: input.input.statusType,
    shipmentReference: input.input.shipmentReference,
    trackingEventType: input.trackingEventType,
    previousStatus: input.previousStatus,
    currentStatus: input.currentStatus,
    ...(input.input.customsReference === undefined
      ? {}
      : { customsReference: input.input.customsReference }),
    ...(input.input.documentReference === undefined
      ? {}
      : { documentReference: input.input.documentReference }),
    ...(input.input.declarationNumber === undefined
      ? {}
      : { declarationNumber: input.input.declarationNumber }),
    ...(input.input.brokerReference === undefined
      ? {}
      : { brokerReference: input.input.brokerReference }),
    ...(input.input.authorityCode === undefined
      ? {}
      : { authorityCode: input.input.authorityCode }),
  };
}

function createWarehouseWmsAdapterPayload(input: {
  input: IntegrationWarehouseWmsActivityInput;
  trackingEventType: TrackingEventType;
  previousStatus: TrackingShipmentStatus;
  currentStatus: TrackingShipmentStatus;
}): Record<string, string | number | boolean | null> {
  return {
    ...(input.input.payload ?? {}),
    activityType: input.input.activityType,
    shipmentReference: input.input.shipmentReference,
    trackingEventType: input.trackingEventType,
    previousStatus: input.previousStatus,
    currentStatus: input.currentStatus,
    ...(input.input.locationName === undefined ? {} : { locationName: input.input.locationName }),
    ...(input.input.warehouseCode === undefined
      ? {}
      : { warehouseCode: input.input.warehouseCode }),
    ...(input.input.zoneCode === undefined ? {} : { zoneCode: input.input.zoneCode }),
    ...(input.input.dockDoor === undefined ? {} : { dockDoor: input.input.dockDoor }),
    ...(input.input.containerReference === undefined
      ? {}
      : { containerReference: input.input.containerReference }),
    ...(input.input.handlingUnitReference === undefined
      ? {}
      : { handlingUnitReference: input.input.handlingUnitReference }),
    ...(input.input.operatorReference === undefined
      ? {}
      : { operatorReference: input.input.operatorReference }),
    ...(input.input.palletCount === undefined ? {} : { palletCount: input.input.palletCount }),
  };
}

function createPortTosMovementOutput(input: {
  organizationId: string;
  integrationEvent: IntegrationEventRecord;
  trackingEvent: AdapterTrackingEventRecord;
  replayed: boolean;
}): IntegrationPortTosMovementOutput {
  const statusPair = readAdapterStatusPair(input.trackingEvent);

  return {
    organizationId: input.organizationId,
    adapter: {
      name: "port-tos",
      mode: "local-synchronous",
    },
    integrationEvent: mapIntegrationEvent(input.integrationEvent),
    trackingEvent: {
      id: input.trackingEvent.id,
      shipmentId: input.trackingEvent.shipmentId,
      referenceCode: input.trackingEvent.shipment.referenceCode,
      eventType: input.trackingEvent.eventType,
      previousStatus: statusPair.previousStatus,
      currentStatus: statusPair.currentStatus,
      occurredAt: input.trackingEvent.occurredAt.toISOString(),
      sourceSystem: input.trackingEvent.sourceSystem,
    },
    idempotency: {
      key: createEventIdempotencyKey(input.integrationEvent),
      replayed: input.replayed,
    },
    audit: {
      action: "integration.adapter.port_tos.processed",
      subjectType: "tracking.shipment",
      subjectId: input.trackingEvent.shipmentId,
    },
    outbox: {
      eventType: "integration.adapter.port_tos.processed",
      aggregateType: "tracking.shipment",
      aggregateId: input.trackingEvent.shipmentId,
    },
  };
}

function createRailTmsMovementOutput(input: {
  organizationId: string;
  integrationEvent: IntegrationEventRecord;
  trackingEvent: AdapterTrackingEventRecord;
  replayed: boolean;
}): IntegrationRailTmsMovementOutput {
  const statusPair = readAdapterStatusPair(input.trackingEvent);

  return {
    organizationId: input.organizationId,
    adapter: {
      name: "rail-tms",
      mode: "local-synchronous",
    },
    integrationEvent: mapIntegrationEvent(input.integrationEvent),
    trackingEvent: {
      id: input.trackingEvent.id,
      shipmentId: input.trackingEvent.shipmentId,
      referenceCode: input.trackingEvent.shipment.referenceCode,
      eventType: input.trackingEvent.eventType,
      previousStatus: statusPair.previousStatus,
      currentStatus: statusPair.currentStatus,
      occurredAt: input.trackingEvent.occurredAt.toISOString(),
      sourceSystem: input.trackingEvent.sourceSystem,
    },
    idempotency: {
      key: createEventIdempotencyKey(input.integrationEvent),
      replayed: input.replayed,
    },
    audit: {
      action: "integration.adapter.rail_tms.processed",
      subjectType: "tracking.shipment",
      subjectId: input.trackingEvent.shipmentId,
    },
    outbox: {
      eventType: "integration.adapter.rail_tms.processed",
      aggregateType: "tracking.shipment",
      aggregateId: input.trackingEvent.shipmentId,
    },
  };
}

function createCarrierTmsMovementOutput(input: {
  organizationId: string;
  integrationEvent: IntegrationEventRecord;
  trackingEvent: AdapterTrackingEventRecord;
  replayed: boolean;
}): IntegrationCarrierTmsMovementOutput {
  const statusPair = readAdapterStatusPair(input.trackingEvent);

  return {
    organizationId: input.organizationId,
    adapter: {
      name: "carrier-tms",
      mode: "local-synchronous",
    },
    integrationEvent: mapIntegrationEvent(input.integrationEvent),
    trackingEvent: {
      id: input.trackingEvent.id,
      shipmentId: input.trackingEvent.shipmentId,
      referenceCode: input.trackingEvent.shipment.referenceCode,
      eventType: input.trackingEvent.eventType,
      previousStatus: statusPair.previousStatus,
      currentStatus: statusPair.currentStatus,
      occurredAt: input.trackingEvent.occurredAt.toISOString(),
      sourceSystem: input.trackingEvent.sourceSystem,
    },
    idempotency: {
      key: createEventIdempotencyKey(input.integrationEvent),
      replayed: input.replayed,
    },
    audit: {
      action: "integration.adapter.carrier_tms.processed",
      subjectType: "tracking.shipment",
      subjectId: input.trackingEvent.shipmentId,
    },
    outbox: {
      eventType: "integration.adapter.carrier_tms.processed",
      aggregateType: "tracking.shipment",
      aggregateId: input.trackingEvent.shipmentId,
    },
  };
}

function createTelematicsGpsPositionOutput(input: {
  organizationId: string;
  integrationEvent: IntegrationEventRecord;
  trackingEvent: AdapterTrackingEventRecord;
  replayed: boolean;
}): IntegrationTelematicsGpsPositionOutput {
  const statusPair = readAdapterStatusPair(input.trackingEvent);

  return {
    organizationId: input.organizationId,
    adapter: {
      name: "telematics-gps",
      mode: "local-synchronous",
    },
    integrationEvent: mapIntegrationEvent(input.integrationEvent),
    trackingEvent: {
      id: input.trackingEvent.id,
      shipmentId: input.trackingEvent.shipmentId,
      referenceCode: input.trackingEvent.shipment.referenceCode,
      eventType: input.trackingEvent.eventType,
      previousStatus: statusPair.previousStatus,
      currentStatus: statusPair.currentStatus,
      occurredAt: input.trackingEvent.occurredAt.toISOString(),
      sourceSystem: input.trackingEvent.sourceSystem,
    },
    idempotency: {
      key: createEventIdempotencyKey(input.integrationEvent),
      replayed: input.replayed,
    },
    audit: {
      action: "integration.adapter.telematics_gps.processed",
      subjectType: "tracking.shipment",
      subjectId: input.trackingEvent.shipmentId,
    },
    outbox: {
      eventType: "integration.adapter.telematics_gps.processed",
      aggregateType: "tracking.shipment",
      aggregateId: input.trackingEvent.shipmentId,
    },
  };
}

function createCustomsErpStatusOutput(input: {
  organizationId: string;
  integrationEvent: IntegrationEventRecord;
  trackingEvent: AdapterTrackingEventRecord;
  replayed: boolean;
}): IntegrationCustomsErpStatusOutput {
  const statusPair = readAdapterStatusPair(input.trackingEvent);

  return {
    organizationId: input.organizationId,
    adapter: {
      name: "customs-erp",
      mode: "local-synchronous",
    },
    integrationEvent: mapIntegrationEvent(input.integrationEvent),
    trackingEvent: {
      id: input.trackingEvent.id,
      shipmentId: input.trackingEvent.shipmentId,
      referenceCode: input.trackingEvent.shipment.referenceCode,
      eventType: input.trackingEvent.eventType,
      previousStatus: statusPair.previousStatus,
      currentStatus: statusPair.currentStatus,
      occurredAt: input.trackingEvent.occurredAt.toISOString(),
      sourceSystem: input.trackingEvent.sourceSystem,
    },
    idempotency: {
      key: createEventIdempotencyKey(input.integrationEvent),
      replayed: input.replayed,
    },
    audit: {
      action: "integration.adapter.customs_erp.processed",
      subjectType: "tracking.shipment",
      subjectId: input.trackingEvent.shipmentId,
    },
    outbox: {
      eventType: "integration.adapter.customs_erp.processed",
      aggregateType: "tracking.shipment",
      aggregateId: input.trackingEvent.shipmentId,
    },
  };
}

function createWarehouseWmsActivityOutput(input: {
  organizationId: string;
  integrationEvent: IntegrationEventRecord;
  trackingEvent: AdapterTrackingEventRecord;
  replayed: boolean;
}): IntegrationWarehouseWmsActivityOutput {
  const statusPair = readAdapterStatusPair(input.trackingEvent);

  return {
    organizationId: input.organizationId,
    adapter: {
      name: "warehouse-wms",
      mode: "local-synchronous",
    },
    integrationEvent: mapIntegrationEvent(input.integrationEvent),
    trackingEvent: {
      id: input.trackingEvent.id,
      shipmentId: input.trackingEvent.shipmentId,
      referenceCode: input.trackingEvent.shipment.referenceCode,
      eventType: input.trackingEvent.eventType,
      previousStatus: statusPair.previousStatus,
      currentStatus: statusPair.currentStatus,
      occurredAt: input.trackingEvent.occurredAt.toISOString(),
      sourceSystem: input.trackingEvent.sourceSystem,
    },
    idempotency: {
      key: createEventIdempotencyKey(input.integrationEvent),
      replayed: input.replayed,
    },
    audit: {
      action: "integration.adapter.warehouse_wms.processed",
      subjectType: "tracking.shipment",
      subjectId: input.trackingEvent.shipmentId,
    },
    outbox: {
      eventType: "integration.adapter.warehouse_wms.processed",
      aggregateType: "tracking.shipment",
      aggregateId: input.trackingEvent.shipmentId,
    },
  };
}

function readAdapterStatusPair(event: AdapterTrackingEventRecord): {
  previousStatus: TrackingShipmentStatus;
  currentStatus: TrackingShipmentStatus;
} {
  if (
    typeof event.payload === "object" &&
    event.payload !== null &&
    !Array.isArray(event.payload)
  ) {
    const payload = event.payload as Record<string, unknown>;
    const previousStatus =
      typeof payload.previousStatus === "string" && isTrackingShipmentStatus(payload.previousStatus)
        ? payload.previousStatus
        : event.shipment.status;
    const currentStatus =
      typeof payload.currentStatus === "string" && isTrackingShipmentStatus(payload.currentStatus)
        ? payload.currentStatus
        : event.shipment.status;

    return {
      previousStatus,
      currentStatus,
    };
  }

  return {
    previousStatus: event.shipment.status,
    currentStatus: event.shipment.status,
  };
}

function isTrackingShipmentStatus(value: string): value is TrackingShipmentStatus {
  return (trackingShipmentStatuses as readonly string[]).includes(value);
}

function toIsoStringOrNull(value: Date | null): string | null {
  return value === null ? null : value.toISOString();
}

function createRequestMetadata(input: { ipAddress?: string; userAgent?: string }): {
  ipAddress?: string;
  userAgent?: string;
} {
  return {
    ...(input.ipAddress === undefined ? {} : { ipAddress: input.ipAddress }),
    ...(input.userAgent === undefined ? {} : { userAgent: input.userAgent }),
  };
}
