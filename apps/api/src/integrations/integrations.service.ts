import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { createApiKeyMaterial, filterPlatformPermissions, hashApiKey } from "@saptm/auth";
import type { AuditJsonValue } from "@saptm/database";
import type {
  IntegrationCarrierTmsMovementOutput,
  IntegrationCustomsErpStatusOutput,
  IntegrationEventRecordOutput,
  IntegrationOverviewOutput,
  IntegrationPortTosMovementOutput,
  IntegrationRailTmsMovementOutput,
  IntegrationServiceAccountCreateOutput,
  IntegrationTelematicsGpsPositionOutput,
  IntegrationWarehouseWmsActivityOutput,
} from "@saptm/rpc";
import { OutboxEventBusAdapter } from "../event-bus/outbox-event-bus.adapter.js";
import {
  createAdapterAuditBefore,
  createCarrierTmsAdapterAuditAfter,
  createCustomsErpAdapterAuditAfter,
  createIntegrationEventAuditAfter,
  createPortTosAdapterAuditAfter,
  createRailTmsAdapterAuditAfter,
  createServiceAccountAuditAfter,
  createTelematicsGpsAdapterAuditAfter,
  createWarehouseWmsAdapterAuditAfter,
} from "./domain/integrations.audit-trail.js";
import {
  createCarrierTmsAdapterPayload,
  createCustomsErpAdapterPayload,
  createPortTosAdapterPayload,
  createRailTmsAdapterPayload,
  createTelematicsGpsAdapterPayload,
  createWarehouseWmsAdapterPayload,
  mapCarrierTmsMovementToTrackingEventType,
  mapCustomsErpStatusToTrackingEventType,
  mapPortTosMovementToTrackingEventType,
  mapRailTmsMovementToTrackingEventType,
  mapTelematicsGpsPositionToTrackingEventType,
  mapWarehouseWmsActivityToTrackingEventType,
  resolveShipmentStatusAfterAdapterEvent,
  type TrackingShipmentStatus,
} from "./domain/integrations.business-rules.js";
import {
  type AdapterTrackingEventRecord,
  type CreateIntegrationServiceAccountInput,
  createCarrierTmsMovementOutput,
  createCarrierTmsTrackingIdempotencyKey,
  createCustomsErpStatusOutput,
  createCustomsErpTrackingIdempotencyKey,
  createEventIdempotencyKey,
  createPortTosMovementOutput,
  createPortTosTrackingIdempotencyKey,
  createRailTmsMovementOutput,
  createRailTmsTrackingIdempotencyKey,
  createRequestMetadata,
  createTelematicsGpsPositionOutput,
  createTelematicsGpsTrackingIdempotencyKey,
  createWarehouseWmsActivityOutput,
  createWarehouseWmsTrackingIdempotencyKey,
  type GetIntegrationOverviewInput,
  type IntegrationEventRecord,
  mapIntegrationEvent,
  mapServiceAccount,
  type ProcessCarrierTmsMovementInput,
  type ProcessCustomsErpStatusInput,
  type ProcessPortTosMovementInput,
  type ProcessRailTmsMovementInput,
  type ProcessTelematicsGpsPositionInput,
  type ProcessWarehouseWmsActivityInput,
  type RecordIntegrationEventInput,
  type ServiceAccountRecord,
} from "./domain/integrations.dto.js";
import {
  INTEGRATIONS_REPOSITORY,
  type IntegrationsRepository,
} from "./domain/integrations.repository.js";

@Injectable()
export class IntegrationsService {
  constructor(
    @Inject(INTEGRATIONS_REPOSITORY)
    private readonly integrationsRepo: IntegrationsRepository,
    readonly eventBus: OutboxEventBusAdapter,
  ) {}

  async getOverview(input: GetIntegrationOverviewInput): Promise<IntegrationOverviewOutput> {
    const generatedAt = input.generatedAt ?? new Date();
    const limit = input.limit ?? 25;
    const [serviceAccounts, recentEvents, totals] = await Promise.all([
      this.integrationsRepo.findRecentServiceAccounts(input.organizationId, limit),
      this.integrationsRepo.findRecentIntegrationEvents(input.organizationId, limit),
      this.resolveTotals(input.organizationId),
    ]);

    return {
      generatedAt: generatedAt.toISOString(),
      totals,
      serviceAccounts: serviceAccounts.map((sa) => mapServiceAccount(sa as ServiceAccountRecord)),
      recentEvents: recentEvents.map((ev) => mapIntegrationEvent(ev)),
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
    return this.databaseTransaction(async (transaction) => {
      await this.integrationsRepo.assertOrganizationExists(transaction, input.organizationId);
      const existingByIdempotency = await this.integrationsRepo.findServiceAccountByIdempotencyKey(
        transaction,
        input.organizationId,
        input.idempotencyKey,
      );

      if (existingByIdempotency !== null) {
        const mapped = mapServiceAccount(existingByIdempotency);
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
      const existingByName = await this.integrationsRepo.findServiceAccountByName(
        transaction,
        input.organizationId,
        normalizedName,
      );

      if (existingByName !== null) {
        throw new BadRequestException("integration.service_account_name_exists");
      }

      const normalizedScopes = filterPlatformPermissions(input.scopes);

      if (!normalizedScopes.includes("integration.event.ingest")) {
        throw new BadRequestException("integration.service_account_scope_missing_event_ingest");
      }

      const apiKeyMaterial = createApiKeyMaterial();
      const apiKeyHash = await hashApiKey(apiKeyMaterial.apiKey);
      const serviceAccount = await this.integrationsRepo.createServiceAccount(transaction, {
        organizationId: input.organizationId,
        name: normalizedName,
        scopes: normalizedScopes,
        createdByActorId: input.actorId,
        provisionIdempotencyKey: input.idempotencyKey,
        lastRotatedAt: new Date(),
      });
      await this.integrationsRepo.createApiKey(transaction, {
        serviceAccountId: serviceAccount.id,
        keyHash: apiKeyHash,
        prefix: apiKeyMaterial.prefix,
        ...(input.expiresAt === undefined ? {} : { expiresAt: new Date(input.expiresAt) }),
      });
      await this.integrationsRepo.createAuditRecord(transaction, {
        organizationId: input.organizationId,
        actorType: input.actorType,
        actorId: input.actorId,
        action: "integration.api_key.created",
        subjectType: "service_account",
        subjectId: serviceAccount.id,
        severity: "critical",
        after: createServiceAccountAuditAfter({
          serviceAccount: serviceAccount as ServiceAccountRecord,
          apiKeyPrefix: apiKeyMaterial.prefix,
          scopes: normalizedScopes,
          sourceSystem: input.sourceSystem,
        }) as AuditJsonValue,
        reason: "Governed integration service account and API key provisioned.",
        correlationId: input.correlationId,
        ...createRequestMetadata(input),
      });
      await this.eventBus.publish(transaction, {
        organizationId: input.organizationId,
        eventType: "integration.api_key.created",
        aggregateType: "integration.service_account",
        aggregateId: serviceAccount.id,
        payload: {
          serviceAccountId: serviceAccount.id,
          name: normalizedName,
          scopes: normalizedScopes,
          apiKeyPrefix: apiKeyMaterial.prefix,
          idempotencyKey: input.idempotencyKey,
          sourceSystem: input.sourceSystem,
        },
      });

      const reloaded = await this.findServiceAccountById(serviceAccount.id);

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
    return this.databaseTransaction(async (transaction) => {
      await this.integrationsRepo.assertOrganizationExists(transaction, input.organizationId);
      const serviceAccount = await this.integrationsRepo.findActiveServiceAccountWithScopes(
        transaction,
        input.serviceAccountId,
        input.organizationId,
      );

      if (serviceAccount === null) {
        throw new NotFoundException("integration.service_account_not_found");
      }

      const scopes = filterPlatformPermissions(serviceAccount.scopes);

      if (!scopes.includes("integration.event.ingest")) {
        throw new BadRequestException("integration.service_account_scope_denied");
      }

      const existingEvent = await this.integrationsRepo.findIntegrationEventByIdempotencyKey(
        transaction,
        input.organizationId,
        input.sourceSystem,
        input.externalId,
      );

      if (existingEvent !== null) {
        return {
          organizationId: input.organizationId,
          event: mapIntegrationEvent(existingEvent),
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

      const event = await this.integrationsRepo.createIntegrationEvent(transaction, {
        organizationId: input.organizationId,
        serviceAccountId: serviceAccount.id,
        sourceSystem: input.sourceSystem,
        externalId: input.externalId,
        eventType: input.eventType,
        payload: input.payload,
        ...(input.receivedAt === undefined ? {} : { receivedAt: input.receivedAt }),
      });
      await this.integrationsRepo.createAuditRecord(transaction, {
        organizationId: input.organizationId,
        actorType: input.actorType,
        actorId: input.actorId,
        action: "integration.event.received",
        subjectType: "integration_event",
        subjectId: event.id,
        severity: "critical",
        after: createIntegrationEventAuditAfter({
          serviceAccountId: serviceAccount.id,
          sourceSystem: input.sourceSystem,
          externalId: input.externalId,
          eventType: input.eventType,
        }) as AuditJsonValue,
        reason: "External integration event registered with tenant idempotency.",
        correlationId: input.correlationId,
        ...createRequestMetadata(input),
      });
      await this.eventBus.publish(transaction, {
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
      });

      const createdEvent = await this.findIntegrationEventByIdempotencyKey(
        input.organizationId,
        input.sourceSystem,
        input.externalId,
      );

      return {
        organizationId: input.organizationId,
        event: mapIntegrationEvent(createdEvent),
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
    return this.databaseTransaction(async (transaction) => {
      await this.integrationsRepo.assertOrganizationExists(transaction, input.organizationId);
      const serviceAccount = await this.integrationsRepo.findActiveServiceAccountWithScopes(
        transaction,
        input.serviceAccountId,
        input.organizationId,
      );

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

      const shipment = await this.integrationsRepo.findTrackingShipmentByReference(
        transaction,
        input.organizationId,
        input.shipmentReference,
      );

      if (shipment === null) {
        throw new NotFoundException("integration.adapter_tracking_shipment_not_found");
      }

      const existingIntegrationEvent =
        await this.integrationsRepo.findIntegrationEventByIdempotencyKey(
          transaction,
          input.organizationId,
          input.sourceSystem,
          input.externalId,
        );
      const trackingIdempotencyKey = createPortTosTrackingIdempotencyKey(input);
      const existingTrackingEvent = await this.integrationsRepo.findTrackingEventByIdempotencyKey(
        transaction,
        input.organizationId,
        trackingIdempotencyKey,
      );

      if (existingIntegrationEvent !== null) {
        if (existingIntegrationEvent.eventType !== "port_tos.movement") {
          throw new BadRequestException("integration.adapter_external_id_conflict");
        }

        if (existingTrackingEvent !== null) {
          return createPortTosMovementOutput({
            organizationId: input.organizationId,
            integrationEvent: existingIntegrationEvent,
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
        (await this.integrationsRepo.createIntegrationEvent(transaction, {
          organizationId: input.organizationId,
          serviceAccountId: serviceAccount.id,
          sourceSystem: input.sourceSystem,
          externalId: input.externalId,
          eventType: "port_tos.movement",
          payload: adapterPayload,
          receivedAt: occurredAt,
        }));

      const trackingEvent = await this.integrationsRepo.createTrackingEvent(transaction, {
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
      });
      const updatedShipment =
        currentStatus === previousStatus && !shouldSetActualArrival
          ? shipment
          : await this.integrationsRepo.updateTrackingShipment(transaction, shipment.id, {
              ...(currentStatus === previousStatus ? {} : { status: currentStatus }),
              ...(shouldSetActualArrival ? { actualArrivalAt: occurredAt } : {}),
            });
      const processedAt = new Date();
      await this.integrationsRepo.updateIntegrationEventProcessedAt(
        transaction,
        integrationEvent.id,
        processedAt,
      );

      await this.integrationsRepo.createAuditRecord(transaction, {
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
        before: createAdapterAuditBefore({ status: previousStatus }) as AuditJsonValue,
        after: createPortTosAdapterAuditAfter({
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
        }) as AuditJsonValue,
        reason: "Port TOS movement processed through governed integration adapter.",
        correlationId: input.correlationId,
        ...createRequestMetadata(input),
      });
      await this.eventBus.publish(transaction, {
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
      });

      return createPortTosMovementOutput({
        organizationId: input.organizationId,
        integrationEvent: {
          ...integrationEvent,
          serviceAccountId: serviceAccount.id,
          sourceSystem: input.sourceSystem,
          externalId: input.externalId,
          eventType: "port_tos.movement",
          payload: adapterPayload,
          receivedAt: occurredAt,
          processedAt,
        } as never,
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
    return this.databaseTransaction(async (transaction) => {
      await this.integrationsRepo.assertOrganizationExists(transaction, input.organizationId);
      const serviceAccount = await this.integrationsRepo.findActiveServiceAccountWithScopes(
        transaction,
        input.serviceAccountId,
        input.organizationId,
      );

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

      const shipment = await this.integrationsRepo.findTrackingShipmentByReference(
        transaction,
        input.organizationId,
        input.shipmentReference,
      );

      if (shipment === null) {
        throw new NotFoundException("integration.adapter_tracking_shipment_not_found");
      }

      const existingIntegrationEvent =
        await this.integrationsRepo.findIntegrationEventByIdempotencyKey(
          transaction,
          input.organizationId,
          input.sourceSystem,
          input.externalId,
        );
      const trackingIdempotencyKey = createRailTmsTrackingIdempotencyKey(input);
      const existingTrackingEvent = await this.integrationsRepo.findTrackingEventByIdempotencyKey(
        transaction,
        input.organizationId,
        trackingIdempotencyKey,
      );

      if (existingIntegrationEvent !== null) {
        if (existingIntegrationEvent.eventType !== "rail_tms.movement") {
          throw new BadRequestException("integration.adapter_external_id_conflict");
        }

        if (existingTrackingEvent !== null) {
          return createRailTmsMovementOutput({
            organizationId: input.organizationId,
            integrationEvent: existingIntegrationEvent,
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
        (await this.integrationsRepo.createIntegrationEvent(transaction, {
          organizationId: input.organizationId,
          serviceAccountId: serviceAccount.id,
          sourceSystem: input.sourceSystem,
          externalId: input.externalId,
          eventType: "rail_tms.movement",
          payload: adapterPayload,
          receivedAt: occurredAt,
        }));

      const trackingEvent = await this.integrationsRepo.createTrackingEvent(transaction, {
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
      });
      const updatedShipment =
        currentStatus === previousStatus && !shouldSetActualArrival
          ? shipment
          : await this.integrationsRepo.updateTrackingShipment(transaction, shipment.id, {
              ...(currentStatus === previousStatus ? {} : { status: currentStatus }),
              ...(shouldSetActualArrival ? { actualArrivalAt: occurredAt } : {}),
            });
      const processedAt = new Date();
      await this.integrationsRepo.updateIntegrationEventProcessedAt(
        transaction,
        integrationEvent.id,
        processedAt,
      );

      await this.integrationsRepo.createAuditRecord(transaction, {
        organizationId: input.organizationId,
        actorType: input.actorType,
        actorId: input.actorId,
        action: "integration.adapter.rail_tms.processed",
        subjectType: "tracking.shipment",
        subjectId: shipment.id,
        severity:
          trackingEventType === "exception" || trackingEventType === "delayed" ? "high" : "medium",
        before: createAdapterAuditBefore({ status: previousStatus }) as AuditJsonValue,
        after: createRailTmsAdapterAuditAfter({
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
        }) as AuditJsonValue,
        reason: "Rail TMS movement processed through governed integration adapter.",
        correlationId: input.correlationId,
        ...createRequestMetadata(input),
      });
      await this.eventBus.publish(transaction, {
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
      });

      return createRailTmsMovementOutput({
        organizationId: input.organizationId,
        integrationEvent: {
          ...integrationEvent,
          serviceAccountId: serviceAccount.id,
          sourceSystem: input.sourceSystem,
          externalId: input.externalId,
          eventType: "rail_tms.movement",
          payload: adapterPayload,
          receivedAt: occurredAt,
          processedAt,
        } as never,
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
    return this.databaseTransaction(async (transaction) => {
      await this.integrationsRepo.assertOrganizationExists(transaction, input.organizationId);
      const serviceAccount = await this.integrationsRepo.findActiveServiceAccountWithScopes(
        transaction,
        input.serviceAccountId,
        input.organizationId,
      );

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

      const shipment = await this.integrationsRepo.findTrackingShipmentByReference(
        transaction,
        input.organizationId,
        input.shipmentReference,
      );

      if (shipment === null) {
        throw new NotFoundException("integration.adapter_tracking_shipment_not_found");
      }

      const existingIntegrationEvent =
        await this.integrationsRepo.findIntegrationEventByIdempotencyKey(
          transaction,
          input.organizationId,
          input.sourceSystem,
          input.externalId,
        );
      const trackingIdempotencyKey = createCarrierTmsTrackingIdempotencyKey(input);
      const existingTrackingEvent = await this.integrationsRepo.findTrackingEventByIdempotencyKey(
        transaction,
        input.organizationId,
        trackingIdempotencyKey,
      );

      if (existingIntegrationEvent !== null) {
        if (existingIntegrationEvent.eventType !== "carrier_tms.movement") {
          throw new BadRequestException("integration.adapter_external_id_conflict");
        }

        if (existingTrackingEvent !== null) {
          return createCarrierTmsMovementOutput({
            organizationId: input.organizationId,
            integrationEvent: existingIntegrationEvent,
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
        (await this.integrationsRepo.createIntegrationEvent(transaction, {
          organizationId: input.organizationId,
          serviceAccountId: serviceAccount.id,
          sourceSystem: input.sourceSystem,
          externalId: input.externalId,
          eventType: "carrier_tms.movement",
          payload: adapterPayload,
          receivedAt: occurredAt,
        }));

      const trackingEvent = await this.integrationsRepo.createTrackingEvent(transaction, {
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
      });
      const updatedShipment =
        currentStatus === previousStatus && !shouldSetActualArrival
          ? shipment
          : await this.integrationsRepo.updateTrackingShipment(transaction, shipment.id, {
              ...(currentStatus === previousStatus ? {} : { status: currentStatus }),
              ...(shouldSetActualArrival ? { actualArrivalAt: occurredAt } : {}),
            });
      const processedAt = new Date();
      await this.integrationsRepo.updateIntegrationEventProcessedAt(
        transaction,
        integrationEvent.id,
        processedAt,
      );

      await this.integrationsRepo.createAuditRecord(transaction, {
        organizationId: input.organizationId,
        actorType: input.actorType,
        actorId: input.actorId,
        action: "integration.adapter.carrier_tms.processed",
        subjectType: "tracking.shipment",
        subjectId: shipment.id,
        severity:
          trackingEventType === "exception" || trackingEventType === "delayed" ? "high" : "medium",
        before: createAdapterAuditBefore({ status: previousStatus }) as AuditJsonValue,
        after: createCarrierTmsAdapterAuditAfter({
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
        }) as AuditJsonValue,
        reason: "Carrier TMS movement processed through governed integration adapter.",
        correlationId: input.correlationId,
        ...createRequestMetadata(input),
      });
      await this.eventBus.publish(transaction, {
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
      });

      return createCarrierTmsMovementOutput({
        organizationId: input.organizationId,
        integrationEvent: {
          ...integrationEvent,
          serviceAccountId: serviceAccount.id,
          sourceSystem: input.sourceSystem,
          externalId: input.externalId,
          eventType: "carrier_tms.movement",
          payload: adapterPayload,
          receivedAt: occurredAt,
          processedAt,
        } as never,
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
    return this.databaseTransaction(async (transaction) => {
      await this.integrationsRepo.assertOrganizationExists(transaction, input.organizationId);
      const serviceAccount = await this.integrationsRepo.findActiveServiceAccountWithScopes(
        transaction,
        input.serviceAccountId,
        input.organizationId,
      );

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

      const shipment = await this.integrationsRepo.findTrackingShipmentByReference(
        transaction,
        input.organizationId,
        input.shipmentReference,
      );

      if (shipment === null) {
        throw new NotFoundException("integration.adapter_tracking_shipment_not_found");
      }

      const existingIntegrationEvent =
        await this.integrationsRepo.findIntegrationEventByIdempotencyKey(
          transaction,
          input.organizationId,
          input.sourceSystem,
          input.externalId,
        );
      const trackingIdempotencyKey = createTelematicsGpsTrackingIdempotencyKey(input);
      const existingTrackingEvent = await this.integrationsRepo.findTrackingEventByIdempotencyKey(
        transaction,
        input.organizationId,
        trackingIdempotencyKey,
      );

      if (existingIntegrationEvent !== null) {
        if (existingIntegrationEvent.eventType !== "telematics_gps.position") {
          throw new BadRequestException("integration.adapter_external_id_conflict");
        }

        if (existingTrackingEvent !== null) {
          return createTelematicsGpsPositionOutput({
            organizationId: input.organizationId,
            integrationEvent: existingIntegrationEvent,
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
        (await this.integrationsRepo.createIntegrationEvent(transaction, {
          organizationId: input.organizationId,
          serviceAccountId: serviceAccount.id,
          sourceSystem: input.sourceSystem,
          externalId: input.externalId,
          eventType: "telematics_gps.position",
          payload: adapterPayload,
          receivedAt: occurredAt,
        }));

      const trackingEvent = await this.integrationsRepo.createTrackingEvent(transaction, {
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
      });
      const updatedShipment =
        currentStatus === previousStatus && !shouldSetActualArrival
          ? shipment
          : await this.integrationsRepo.updateTrackingShipment(transaction, shipment.id, {
              ...(currentStatus === previousStatus ? {} : { status: currentStatus }),
              ...(shouldSetActualArrival ? { actualArrivalAt: occurredAt } : {}),
            });
      const processedAt = new Date();
      await this.integrationsRepo.updateIntegrationEventProcessedAt(
        transaction,
        integrationEvent.id,
        processedAt,
      );

      await this.integrationsRepo.createAuditRecord(transaction, {
        organizationId: input.organizationId,
        actorType: input.actorType,
        actorId: input.actorId,
        action: "integration.adapter.telematics_gps.processed",
        subjectType: "tracking.shipment",
        subjectId: shipment.id,
        severity:
          trackingEventType === "exception" || trackingEventType === "delayed" ? "high" : "medium",
        before: createAdapterAuditBefore({ status: previousStatus }) as AuditJsonValue,
        after: createTelematicsGpsAdapterAuditAfter({
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
        }) as AuditJsonValue,
        reason: "Telematics GPS position processed through governed integration adapter.",
        correlationId: input.correlationId,
        ...createRequestMetadata(input),
      });
      await this.eventBus.publish(transaction, {
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
      });

      return createTelematicsGpsPositionOutput({
        organizationId: input.organizationId,
        integrationEvent: {
          ...integrationEvent,
          serviceAccountId: serviceAccount.id,
          sourceSystem: input.sourceSystem,
          externalId: input.externalId,
          eventType: "telematics_gps.position",
          payload: adapterPayload,
          receivedAt: occurredAt,
          processedAt,
        } as never,
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
    return this.databaseTransaction(async (transaction) => {
      await this.integrationsRepo.assertOrganizationExists(transaction, input.organizationId);
      const serviceAccount = await this.integrationsRepo.findActiveServiceAccountWithScopes(
        transaction,
        input.serviceAccountId,
        input.organizationId,
      );

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

      const shipment = await this.integrationsRepo.findTrackingShipmentByReference(
        transaction,
        input.organizationId,
        input.shipmentReference,
      );

      if (shipment === null) {
        throw new NotFoundException("integration.adapter_tracking_shipment_not_found");
      }

      const existingIntegrationEvent =
        await this.integrationsRepo.findIntegrationEventByIdempotencyKey(
          transaction,
          input.organizationId,
          input.sourceSystem,
          input.externalId,
        );
      const trackingIdempotencyKey = createCustomsErpTrackingIdempotencyKey(input);
      const existingTrackingEvent = await this.integrationsRepo.findTrackingEventByIdempotencyKey(
        transaction,
        input.organizationId,
        trackingIdempotencyKey,
      );

      if (existingIntegrationEvent !== null) {
        if (existingIntegrationEvent.eventType !== "customs_erp.status") {
          throw new BadRequestException("integration.adapter_external_id_conflict");
        }

        if (existingTrackingEvent !== null) {
          return createCustomsErpStatusOutput({
            organizationId: input.organizationId,
            integrationEvent: existingIntegrationEvent,
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
        (await this.integrationsRepo.createIntegrationEvent(transaction, {
          organizationId: input.organizationId,
          serviceAccountId: serviceAccount.id,
          sourceSystem: input.sourceSystem,
          externalId: input.externalId,
          eventType: "customs_erp.status",
          payload: adapterPayload,
          receivedAt: occurredAt,
        }));

      const trackingEvent = await this.integrationsRepo.createTrackingEvent(transaction, {
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
      });
      const updatedShipment =
        currentStatus === previousStatus
          ? shipment
          : await this.integrationsRepo.updateTrackingShipment(transaction, shipment.id, {
              status: currentStatus,
            });
      const processedAt = new Date();
      await this.integrationsRepo.updateIntegrationEventProcessedAt(
        transaction,
        integrationEvent.id,
        processedAt,
      );

      await this.integrationsRepo.createAuditRecord(transaction, {
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
        before: createAdapterAuditBefore({ status: previousStatus }) as AuditJsonValue,
        after: createCustomsErpAdapterAuditAfter({
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
        }) as AuditJsonValue,
        reason: "Customs ERP status processed through governed integration adapter.",
        correlationId: input.correlationId,
        ...createRequestMetadata(input),
      });
      await this.eventBus.publish(transaction, {
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
      });

      return createCustomsErpStatusOutput({
        organizationId: input.organizationId,
        integrationEvent: {
          ...integrationEvent,
          serviceAccountId: serviceAccount.id,
          sourceSystem: input.sourceSystem,
          externalId: input.externalId,
          eventType: "customs_erp.status",
          payload: adapterPayload,
          receivedAt: occurredAt,
          processedAt,
        } as never,
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
    return this.databaseTransaction(async (transaction) => {
      await this.integrationsRepo.assertOrganizationExists(transaction, input.organizationId);
      const serviceAccount = await this.integrationsRepo.findActiveServiceAccountWithScopes(
        transaction,
        input.serviceAccountId,
        input.organizationId,
      );

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

      const shipment = await this.integrationsRepo.findTrackingShipmentByReference(
        transaction,
        input.organizationId,
        input.shipmentReference,
      );

      if (shipment === null) {
        throw new NotFoundException("integration.adapter_tracking_shipment_not_found");
      }

      const existingIntegrationEvent =
        await this.integrationsRepo.findIntegrationEventByIdempotencyKey(
          transaction,
          input.organizationId,
          input.sourceSystem,
          input.externalId,
        );
      const trackingIdempotencyKey = createWarehouseWmsTrackingIdempotencyKey(input);
      const existingTrackingEvent = await this.integrationsRepo.findTrackingEventByIdempotencyKey(
        transaction,
        input.organizationId,
        trackingIdempotencyKey,
      );

      if (existingIntegrationEvent !== null) {
        if (existingIntegrationEvent.eventType !== "warehouse_wms.activity") {
          throw new BadRequestException("integration.adapter_external_id_conflict");
        }

        if (existingTrackingEvent !== null) {
          return createWarehouseWmsActivityOutput({
            organizationId: input.organizationId,
            integrationEvent: existingIntegrationEvent,
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
        (await this.integrationsRepo.createIntegrationEvent(transaction, {
          organizationId: input.organizationId,
          serviceAccountId: serviceAccount.id,
          sourceSystem: input.sourceSystem,
          externalId: input.externalId,
          eventType: "warehouse_wms.activity",
          payload: adapterPayload,
          receivedAt: occurredAt,
        }));

      const trackingEvent = await this.integrationsRepo.createTrackingEvent(transaction, {
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
      });
      const updatedShipment =
        currentStatus === previousStatus && !shouldSetActualArrival
          ? shipment
          : await this.integrationsRepo.updateTrackingShipment(transaction, shipment.id, {
              ...(currentStatus === previousStatus ? {} : { status: currentStatus }),
              ...(shouldSetActualArrival ? { actualArrivalAt: occurredAt } : {}),
            });
      const processedAt = new Date();
      await this.integrationsRepo.updateIntegrationEventProcessedAt(
        transaction,
        integrationEvent.id,
        processedAt,
      );

      await this.integrationsRepo.createAuditRecord(transaction, {
        organizationId: input.organizationId,
        actorType: input.actorType,
        actorId: input.actorId,
        action: "integration.adapter.warehouse_wms.processed",
        subjectType: "tracking.shipment",
        subjectId: shipment.id,
        severity:
          trackingEventType === "exception" || trackingEventType === "delayed" ? "high" : "medium",
        before: createAdapterAuditBefore({ status: previousStatus }) as AuditJsonValue,
        after: createWarehouseWmsAdapterAuditAfter({
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
        }) as AuditJsonValue,
        reason: "Warehouse WMS activity processed through governed integration adapter.",
        correlationId: input.correlationId,
        ...createRequestMetadata(input),
      });
      await this.eventBus.publish(transaction, {
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
      });

      return createWarehouseWmsActivityOutput({
        organizationId: input.organizationId,
        integrationEvent: {
          ...integrationEvent,
          serviceAccountId: serviceAccount.id,
          sourceSystem: input.sourceSystem,
          externalId: input.externalId,
          eventType: "warehouse_wms.activity",
          payload: adapterPayload,
          receivedAt: occurredAt,
          processedAt,
        } as never,
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

  private async resolveTotals(
    organizationId: string,
  ): Promise<IntegrationOverviewOutput["totals"]> {
    const [
      serviceAccounts,
      activeServiceAccounts,
      activeApiKeys,
      integrationEvents,
      processedEvents,
    ] = await Promise.all([
      this.integrationsRepo.countServiceAccounts(organizationId),
      this.integrationsRepo.countActiveServiceAccounts(organizationId),
      this.integrationsRepo.countActiveApiKeys(organizationId),
      this.integrationsRepo.countIntegrationEvents(organizationId),
      this.integrationsRepo.countProcessedIntegrationEvents(organizationId),
    ]);

    return {
      serviceAccounts,
      activeServiceAccounts,
      activeApiKeys,
      integrationEvents,
      processedEvents,
    };
  }

  private async findServiceAccountById(serviceAccountId: string): Promise<ServiceAccountRecord> {
    // We need a non-transactional lookup — use the database directly
    const { getPrismaClient } = await import("@saptm/database");
    const database = getPrismaClient();
    const serviceAccount = await database.serviceAccount.findUnique({
      where: { id: serviceAccountId },
      include: {
        apiKeys: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (serviceAccount === null) {
      throw new NotFoundException("integration.service_account_not_found");
    }

    return serviceAccount as ServiceAccountRecord;
  }

  private async findIntegrationEventByIdempotencyKey(
    organizationId: string,
    sourceSystem: string,
    externalId: string,
  ): Promise<IntegrationEventRecord> {
    const { getPrismaClient } = await import("@saptm/database");
    const database = getPrismaClient();
    const event = await database.integrationEvent.findUnique({
      where: {
        organizationId_sourceSystem_externalId: {
          organizationId,
          sourceSystem,
          externalId,
        },
      },
    });

    if (event === null) {
      throw new NotFoundException("integration.event_not_found");
    }

    return event as IntegrationEventRecord;
  }

  private async databaseTransaction<T>(fn: (tx: never) => Promise<T>): Promise<T> {
    const { getPrismaClient } = await import("@saptm/database");
    const database = getPrismaClient();
    return database.$transaction(fn);
  }
}
