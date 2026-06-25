import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  type AuditSeverity,
  type DatabaseActorType,
  getPrismaClient,
  type PrismaTx,
} from "@saptm/database";
import type {
  TrackingAdvisoryOutput,
  TrackingAnalyticsOutput,
  TrackingEventPayload,
  TrackingEventRecordOutput,
  TrackingExceptionManageOutput,
  TrackingExceptionResolveOutput,
  TrackingOverviewOutput,
  TrackingShipmentDetailOutput,
} from "@saptm/rpc";
import { UsageService } from "../billing/usage.service.js";
import {
  createTrackingEventAuditAfter,
  createTrackingExceptionAuditAfter,
  createTrackingExceptionResolutionAuditAfter,
} from "./domain/tracking.audit-trail.js";
import type {
  TrackingEventType,
  TrackingExceptionWorkflowState,
  TrackingOperatorEvidence,
  TrackingShipmentStatus,
  TrackingTransportMode,
} from "./domain/tracking.business-rules.js";
import {
  createExceptionNotes,
  createManagedExceptionPayload,
  createOperatorEvidenceContext,
  createResolvedExceptionPayload,
  isResolvableExceptionStatus,
  resolveExceptionEventType,
  resolveManagedExceptionWorkflowState,
  resolveShipmentStatusAfterEvent,
  terminalTrackingShipmentStatuses,
} from "./domain/tracking.business-rules.js";
import {
  addUtcHours,
  createEventTypeCounts,
  createManageExceptionOutput,
  createModeDistribution,
  createRecordEventOutput,
  createResolveExceptionOutput,
  createStatusCounts,
  createTrackingAdvisoryRecommendations,
  createWorkflowStateCounts,
  getPayloadRecord,
  normalizeAdvisoryLimit,
  normalizeEventLimit,
  normalizeLimit,
  normalizeLookbackDays,
  readNullableExceptionWorkflowState,
  readStatusCount,
  roundRatio,
  roundRatioPercent,
  subtractUtcDays,
  sumActiveShipments,
  sumStatusCounts,
  type TrackingAdvisoryShipment,
  type TrackingEventTypeGroup,
  type TrackingModeStatusGroup,
  toIsoStringOrNull,
  toTrackingEventPayloadOrNull,
} from "./domain/tracking.dto.js";
import { TRACKING_REPOSITORY, type TrackingRepository } from "./domain/tracking.repository.js";
import { OutboxEventBusAdapter } from "../event-bus/outbox-event-bus.adapter.js";

export type GetTrackingOverviewInput = {
  organizationId: string;
  limit?: number;
  offset?: number;
  generatedAt?: Date;
};

export type GetTrackingAnalyticsInput = {
  organizationId: string;
  lookbackDays?: number;
  generatedAt?: Date;
};

export type GetTrackingAdvisoryInput = {
  organizationId: string;
  limit?: number;
  generatedAt?: Date;
};

export type GetTrackingShipmentDetailInput = {
  organizationId: string;
  shipmentId: string;
  eventLimit?: number;
  generatedAt?: Date;
};

export type RecordTrackingEventInput = {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
  shipmentId: string;
  eventType: string;
  occurredAt: string;
  sourceSystem: string;
  idempotencyKey: string;
  locationName?: string;
  notes?: string;
  payload?: unknown;
};

export type ManageTrackingExceptionInput = {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
  shipmentId: string;
  category: string;
  severity: string;
  summary: string;
  recoveryPlan: string;
  sourceSystem: string;
  idempotencyKey: string;
  occurredAt: string;
  evidence: TrackingOperatorEvidence;
  ownerTeam?: string;
  expectedResolutionAt?: string;
  locationName?: string;
  payload?: unknown;
};

export type ResolveTrackingExceptionInput = {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
  shipmentId: string;
  resolutionCode: string;
  summary: string;
  sourceSystem: string;
  idempotencyKey: string;
  occurredAt: string;
  nextStatus: string;
  evidence: TrackingOperatorEvidence;
  ownerTeam?: string;
  locationName?: string;
  payload?: unknown;
};

@Injectable()
export class TrackingService {
  constructor(
    @Inject(TRACKING_REPOSITORY) private readonly trackingRepo: TrackingRepository,
    private readonly eventBus: OutboxEventBusAdapter,
    private readonly usageService: UsageService,
  ) {}

  async getOverview(input: GetTrackingOverviewInput): Promise<TrackingOverviewOutput> {
    const limit = normalizeLimit(input.limit);
    const offset = input.offset ?? 0;
    const [statusGroups, recentShipments, totalCount] = await Promise.all([
      this.trackingRepo.countShipmentsByStatus(input.organizationId),
      this.trackingRepo.findRecentShipments(input.organizationId, limit, offset),
      this.trackingRepo.countShipments(input.organizationId),
    ]);

    const typedStatusGroups = statusGroups.map((g) => ({
      status: g.status as TrackingShipmentStatus,
      _count: { _all: g._count._all },
    }));
    const countByStatus = new Map(
      typedStatusGroups.map((group) => [group.status, group._count._all]),
    );

    return {
      generatedAt: (input.generatedAt ?? new Date()).toISOString(),
      organizationId: input.organizationId,
      totals: {
        shipments: sumStatusCounts(
          typedStatusGroups.map((g) => ({ status: g.status, count: g._count._all })),
        ),
        activeShipments: sumActiveShipments(
          typedStatusGroups.map((g) => ({ status: g.status, count: g._count._all })),
        ),
        delayedShipments: countByStatus.get("delayed" as TrackingShipmentStatus) ?? 0,
        exceptionShipments: countByStatus.get("exception" as TrackingShipmentStatus) ?? 0,
      },
      statusCounts: createStatusCounts(typedStatusGroups),
      recentShipments: recentShipments.map((shipment) => {
        const lastEvent = shipment.events.at(0);

        return {
          id: shipment.id,
          referenceCode: shipment.referenceCode,
          externalReference: shipment.externalReference,
          cargoDescription: shipment.cargoDescription,
          originName: shipment.originName,
          destinationName: shipment.destinationName,
          transportMode: shipment.transportMode as TrackingTransportMode,
          status: shipment.status as TrackingShipmentStatus,
          priority: shipment.priority,
          estimatedArrivalAt: toIsoStringOrNull(shipment.estimatedArrivalAt),
          lastEventAt: toIsoStringOrNull(lastEvent?.occurredAt),
          lastEventType: (lastEvent?.eventType as TrackingEventType | undefined) ?? null,
          lastKnownLocation: lastEvent?.locationName ?? null,
        };
      }),
      pagination: {
        totalCount,
        limit,
        offset,
      },
    };
  }

  async getAnalytics(input: GetTrackingAnalyticsInput): Promise<TrackingAnalyticsOutput> {
    const lookbackDays = normalizeLookbackDays(input.lookbackDays);
    const generatedAt = input.generatedAt ?? new Date();
    const windowStart = subtractUtcDays(generatedAt, lookbackDays);
    const dueWithin24HoursEnd = addUtcHours(generatedAt, 24);
    const activeStatusFilter = { notIn: terminalTrackingShipmentStatuses };

    const [
      statusGroups,
      modeStatusGroups,
      eventTypeGroups,
      workflowEvents,
      highPriorityActiveShipments,
      overdueShipments,
      dueWithin24Hours,
      unscheduledActiveShipments,
    ] = await Promise.all([
      this.trackingRepo.countShipmentsByStatus(input.organizationId),
      this.trackingRepo.countShipmentsByModeAndStatus(input.organizationId),
      this.trackingRepo.countEventsByType(input.organizationId, windowStart, generatedAt),
      this.trackingRepo.findWorkflowEvents(input.organizationId, windowStart, generatedAt),
      this.trackingRepo.countHighPriorityActiveShipments(input.organizationId, activeStatusFilter),
      this.trackingRepo.countOverdueShipments(
        input.organizationId,
        activeStatusFilter,
        generatedAt,
      ),
      this.trackingRepo.countDueShipments(
        input.organizationId,
        activeStatusFilter,
        generatedAt,
        dueWithin24HoursEnd,
      ),
      this.trackingRepo.countUnscheduledShipments(input.organizationId, activeStatusFilter),
    ]);

    const typedStatusGroups = statusGroups.map((g) => ({
      status: g.status as TrackingShipmentStatus,
      _count: { _all: g._count._all },
    }));
    const typedModeStatusGroups = modeStatusGroups.map((g) => ({
      status: g.status as TrackingShipmentStatus,
      transportMode: g.transportMode as TrackingTransportMode,
      _count: { _all: g._count._all },
    })) as TrackingModeStatusGroup[];
    const statusCounts = createStatusCounts(typedStatusGroups);
    const totalShipments = sumStatusCounts(statusCounts);
    const activeShipments = sumActiveShipments(statusCounts);
    const delayedShipments = readStatusCount(statusCounts, "delayed" as TrackingShipmentStatus);
    const exceptionShipments = readStatusCount(statusCounts, "exception" as TrackingShipmentStatus);
    const completedShipments = readStatusCount(statusCounts, "completed" as TrackingShipmentStatus);
    const eventTypeCounts = createEventTypeCounts(eventTypeGroups as TrackingEventTypeGroup[]);
    const eventsInWindow = eventTypeCounts.reduce((total, item) => total + item.count, 0);

    return {
      generatedAt: generatedAt.toISOString(),
      organizationId: input.organizationId,
      window: {
        lookbackDays,
        startedAt: windowStart.toISOString(),
        endedAt: generatedAt.toISOString(),
      },
      kpis: {
        totalShipments,
        activeShipments,
        delayedShipments,
        exceptionShipments,
        completedShipments,
        highPriorityActiveShipments,
        eventsInWindow,
        delayRatePercent: roundRatioPercent(delayedShipments, totalShipments),
        exceptionRatePercent: roundRatioPercent(exceptionShipments, totalShipments),
        averageEventsPerShipment: roundRatio(eventsInWindow, totalShipments),
      },
      slaRisk: {
        overdueShipments,
        dueWithin24Hours,
        unscheduledActiveShipments,
      },
      modeDistribution: createModeDistribution(typedModeStatusGroups),
      eventTypeCounts,
      workflowStateCounts: createWorkflowStateCounts(workflowEvents),
    };
  }

  async getAdvisory(input: GetTrackingAdvisoryInput): Promise<TrackingAdvisoryOutput> {
    const limit = normalizeAdvisoryLimit(input.limit);
    const generatedAt = input.generatedAt ?? new Date();
    const shipments = await this.trackingRepo.findActiveShipments(input.organizationId);
    const recommendations = createTrackingAdvisoryRecommendations({
      shipments: shipments as TrackingAdvisoryShipment[],
      generatedAt,
      limit,
    });

    return {
      generatedAt: generatedAt.toISOString(),
      organizationId: input.organizationId,
      policy: {
        automationAllowed: false,
        humanApprovalRequired: true,
        source: "rule_based_operational_advisor",
      },
      recommendations,
    };
  }

  async getShipmentDetail(
    input: GetTrackingShipmentDetailInput,
  ): Promise<TrackingShipmentDetailOutput> {
    const eventLimit = normalizeEventLimit(input.eventLimit);
    const shipment = await this.trackingRepo.findShipmentWithEvents(
      input.organizationId,
      input.shipmentId,
      eventLimit,
    );

    if (shipment === null) {
      throw new NotFoundException("tracking.shipment_not_found");
    }

    const lastEvent = shipment.events.at(0);

    return {
      generatedAt: (input.generatedAt ?? new Date()).toISOString(),
      organizationId: input.organizationId,
      shipment: {
        id: shipment.id,
        referenceCode: shipment.referenceCode,
        externalReference: shipment.externalReference,
        cargoDescription: shipment.cargoDescription,
        originName: shipment.originName,
        destinationName: shipment.destinationName,
        transportMode: shipment.transportMode as TrackingTransportMode,
        status: shipment.status as TrackingShipmentStatus,
        priority: shipment.priority,
        plannedDepartureAt: toIsoStringOrNull(shipment.plannedDepartureAt),
        estimatedArrivalAt: toIsoStringOrNull(shipment.estimatedArrivalAt),
        actualArrivalAt: toIsoStringOrNull(shipment.actualArrivalAt),
        createdAt: shipment.createdAt.toISOString(),
        updatedAt: shipment.updatedAt.toISOString(),
        lastEventAt: toIsoStringOrNull(lastEvent?.occurredAt),
        lastEventType: (lastEvent?.eventType as TrackingEventType | undefined) ?? null,
        lastKnownLocation: lastEvent?.locationName ?? null,
        eventCount: shipment._count.events,
      },
      timeline: shipment.events.map((event) => ({
        id: event.id,
        eventType: event.eventType as TrackingEventType,
        occurredAt: event.occurredAt.toISOString(),
        locationName: event.locationName,
        notes: event.notes,
        payload: toTrackingEventPayloadOrNull(event.payload),
        workflowState: readNullableExceptionWorkflowState(getPayloadRecord(event.payload)),
        sourceSystem: event.sourceSystem,
        correlationId: event.correlationId,
        idempotencyKey: event.idempotencyKey,
        createdAt: event.createdAt.toISOString(),
      })),
    };
  }

  async manageException(
    input: ManageTrackingExceptionInput,
  ): Promise<TrackingExceptionManageOutput> {
    const replayedEvent = await this.trackingRepo.findEventByIdempotencyKey(
      input.organizationId,
      input.idempotencyKey,
    );

    if (replayedEvent !== null) {
      return createManageExceptionOutput({
        organizationId: input.organizationId,
        event: replayedEvent as Parameters<typeof createManageExceptionOutput>[0]["event"],
        replayed: true,
      });
    }

    const shipment = await this.trackingRepo.findShipmentById(
      input.organizationId,
      input.shipmentId,
    );

    if (shipment === null) {
      throw new NotFoundException("tracking.shipment_not_found");
    }

    const occurredAt = new Date(input.occurredAt);
    const eventType = resolveExceptionEventType(input.category as never);
    const nextStatus = resolveShipmentStatusAfterEvent(
      eventType,
      shipment.status as TrackingShipmentStatus,
    );
    const expectedResolutionAt =
      input.expectedResolutionAt === undefined ? null : new Date(input.expectedResolutionAt);
    const notes = createExceptionNotes(input.summary, input.recoveryPlan);
    const operatorEvidence = createOperatorEvidenceContext(input.evidence);
    const workflowState = resolveManagedExceptionWorkflowState(
      input.evidence.approvalStatus as never,
    );
    const eventPayload = createManagedExceptionPayload({
      category: input.category as never,
      severity: input.severity as never,
      summary: input.summary,
      recoveryPlan: input.recoveryPlan,
      operatorEvidence,
      workflowState,
      ownerTeam: input.ownerTeam ?? null,
      expectedResolutionAt: expectedResolutionAt?.toISOString() ?? null,
      previousStatus: shipment.status as TrackingShipmentStatus,
      currentStatus: nextStatus,
      operatorPayload: (input.payload as TrackingEventPayload) ?? null,
    });

    const result = await this.databaseTransaction(async (transaction) => {
      const event = await this.trackingRepo.createEvent(transaction, {
        organizationId: input.organizationId,
        shipmentId: shipment.id,
        eventType,
        occurredAt,
        sourceSystem: input.sourceSystem,
        correlationId: input.correlationId,
        idempotencyKey: input.idempotencyKey,
        notes,
        payload: eventPayload as never,
        ...(input.locationName === undefined ? {} : { locationName: input.locationName }),
      });
      const updatedShipment =
        nextStatus === shipment.status
          ? shipment
          : await this.trackingRepo.updateShipmentStatus(transaction, shipment.id, {
              status: nextStatus,
            });
      const auditAfter = createTrackingExceptionAuditAfter({
        eventId: event.id,
        shipmentId: shipment.id,
        referenceCode: shipment.referenceCode,
        category: input.category as never,
        severity: input.severity as never,
        summary: input.summary,
        recoveryPlan: input.recoveryPlan,
        operatorEvidence,
        workflowState,
        ownerTeam: input.ownerTeam ?? null,
        expectedResolutionAt: expectedResolutionAt?.toISOString() ?? null,
        previousStatus: shipment.status as TrackingShipmentStatus,
        currentStatus: updatedShipment.status as TrackingShipmentStatus,
        idempotencyKey: input.idempotencyKey,
        sourceSystem: input.sourceSystem,
      });

      await transaction.auditRecord.create({
        data: {
          organizationId: input.organizationId,
          actorType: input.actorType,
          actorId: input.actorId,
          action: "tracking.exception.managed",
          subjectType: "tracking.shipment",
          subjectId: shipment.id,
          severity: input.severity as AuditSeverity,
          before: { status: shipment.status },
          after: auditAfter,
          correlationId: input.correlationId,
          ...(input.ipAddress === undefined ? {} : { ipAddress: input.ipAddress }),
          ...(input.userAgent === undefined ? {} : { userAgent: input.userAgent }),
        },
      });

      await this.eventBus.publish(transaction, {
        organizationId: input.organizationId,
        eventType: "tracking.exception.managed",
        aggregateType: "tracking.shipment",
        aggregateId: shipment.id,
        payload: {
          eventId: event.id,
          shipmentId: shipment.id,
          referenceCode: shipment.referenceCode,
          category: input.category,
          severity: input.severity,
          occurredAt: occurredAt.toISOString(),
          previousStatus: shipment.status,
          currentStatus: updatedShipment.status,
          operatorEvidence,
          workflowState,
          idempotencyKey: input.idempotencyKey,
          correlationId: input.correlationId,
        },
      });

      return {
        ...event,
        payload: eventPayload,
        shipment: {
          ...event.shipment,
          status: updatedShipment.status,
        },
      } as never;
    });

    return createManageExceptionOutput({
      organizationId: input.organizationId,
      event: result as Parameters<typeof createManageExceptionOutput>[0]["event"],
      replayed: false,
    });
  }

  async resolveException(
    input: ResolveTrackingExceptionInput,
  ): Promise<TrackingExceptionResolveOutput> {
    const replayedEvent = await this.trackingRepo.findEventByIdempotencyKey(
      input.organizationId,
      input.idempotencyKey,
    );

    if (replayedEvent !== null) {
      return createResolveExceptionOutput({
        organizationId: input.organizationId,
        event: replayedEvent as Parameters<typeof createResolveExceptionOutput>[0]["event"],
        replayed: true,
      });
    }

    const shipment = await this.trackingRepo.findShipmentById(
      input.organizationId,
      input.shipmentId,
    );

    if (shipment === null) {
      throw new NotFoundException("tracking.shipment_not_found");
    }

    if (!isResolvableExceptionStatus(shipment.status as TrackingShipmentStatus)) {
      throw new BadRequestException("tracking.exception_not_active");
    }

    const occurredAt = new Date(input.occurredAt);
    const notes = `${input.summary}\n\nResolution code: ${input.resolutionCode}`;
    const operatorEvidence = createOperatorEvidenceContext(input.evidence);
    const workflowState: TrackingExceptionWorkflowState = "closed";
    const eventPayload = createResolvedExceptionPayload({
      resolutionCode: input.resolutionCode as never,
      summary: input.summary,
      operatorEvidence,
      workflowState,
      ownerTeam: input.ownerTeam ?? null,
      previousStatus: shipment.status as TrackingShipmentStatus,
      currentStatus: input.nextStatus as never,
      operatorPayload: (input.payload as TrackingEventPayload) ?? null,
    });
    const shouldSetActualArrival =
      input.nextStatus === "arrived" || input.nextStatus === "completed";

    const result = await this.databaseTransaction(async (transaction) => {
      const event = await this.trackingRepo.createEvent(transaction, {
        organizationId: input.organizationId,
        shipmentId: shipment.id,
        eventType: "released",
        occurredAt,
        sourceSystem: input.sourceSystem,
        correlationId: input.correlationId,
        idempotencyKey: input.idempotencyKey,
        notes,
        payload: eventPayload as never,
        ...(input.locationName === undefined ? {} : { locationName: input.locationName }),
      });
      const updatedShipment = await this.trackingRepo.updateShipmentStatus(
        transaction,
        shipment.id,
        {
          status: input.nextStatus,
          ...(shouldSetActualArrival ? { actualArrivalAt: occurredAt } : {}),
        },
      );
      const auditAfter = createTrackingExceptionResolutionAuditAfter({
        eventId: event.id,
        shipmentId: shipment.id,
        referenceCode: shipment.referenceCode,
        resolutionCode: input.resolutionCode as never,
        summary: input.summary,
        operatorEvidence,
        workflowState,
        ownerTeam: input.ownerTeam ?? null,
        previousStatus: shipment.status as TrackingShipmentStatus,
        currentStatus: updatedShipment.status as TrackingShipmentStatus,
        idempotencyKey: input.idempotencyKey,
        sourceSystem: input.sourceSystem,
      });

      await transaction.auditRecord.create({
        data: {
          organizationId: input.organizationId,
          actorType: input.actorType,
          actorId: input.actorId,
          action: "tracking.exception.resolved",
          subjectType: "tracking.shipment",
          subjectId: shipment.id,
          severity: "high" as AuditSeverity,
          before: { status: shipment.status },
          after: auditAfter,
          correlationId: input.correlationId,
          ...(input.ipAddress === undefined ? {} : { ipAddress: input.ipAddress }),
          ...(input.userAgent === undefined ? {} : { userAgent: input.userAgent }),
        },
      });

      await this.eventBus.publish(transaction, {
        organizationId: input.organizationId,
        eventType: "tracking.exception.resolved",
        aggregateType: "tracking.shipment",
        aggregateId: shipment.id,
        payload: {
          eventId: event.id,
          shipmentId: shipment.id,
          referenceCode: shipment.referenceCode,
          resolutionCode: input.resolutionCode,
          occurredAt: occurredAt.toISOString(),
          previousStatus: shipment.status,
          currentStatus: updatedShipment.status,
          operatorEvidence,
          workflowState,
          idempotencyKey: input.idempotencyKey,
          correlationId: input.correlationId,
        },
      });

      return {
        ...event,
        payload: eventPayload,
        shipment: {
          ...event.shipment,
          status: updatedShipment.status,
        },
      } as never;
    });

    return createResolveExceptionOutput({
      organizationId: input.organizationId,
      event: result as Parameters<typeof createResolveExceptionOutput>[0]["event"],
      replayed: false,
    });
  }

  async recordEvent(input: RecordTrackingEventInput): Promise<TrackingEventRecordOutput> {
    const replayedEvent = await this.trackingRepo.findEventByIdempotencyKey(
      input.organizationId,
      input.idempotencyKey,
    );

    if (replayedEvent !== null) {
      return createRecordEventOutput({
        organizationId: input.organizationId,
        event: replayedEvent as Parameters<typeof createRecordEventOutput>[0]["event"],
        replayed: true,
      });
    }

    const shipment = await this.trackingRepo.findShipmentById(
      input.organizationId,
      input.shipmentId,
    );

    if (shipment === null) {
      throw new NotFoundException("tracking.shipment_not_found");
    }

    const occurredAt = new Date(input.occurredAt);
    const nextStatus = resolveShipmentStatusAfterEvent(
      input.eventType as TrackingEventType,
      shipment.status as TrackingShipmentStatus,
    );
    const shouldSetActualArrival = input.eventType === "arrived";

    const result = await this.databaseTransaction(async (transaction) => {
      const event = await this.trackingRepo.createEvent(transaction, {
        organizationId: input.organizationId,
        shipmentId: shipment.id,
        eventType: input.eventType,
        occurredAt,
        sourceSystem: input.sourceSystem,
        correlationId: input.correlationId,
        idempotencyKey: input.idempotencyKey,
        ...(input.locationName === undefined ? {} : { locationName: input.locationName }),
        ...(input.notes === undefined ? {} : { notes: input.notes }),
        ...(input.payload === undefined ? {} : { payload: input.payload }),
      });
      const updatedShipment =
        nextStatus === shipment.status && !shouldSetActualArrival
          ? shipment
          : await this.trackingRepo.updateShipmentStatus(transaction, shipment.id, {
              status: nextStatus as string,
              ...(shouldSetActualArrival ? { actualArrivalAt: occurredAt } : {}),
            });
      const auditAfter = createTrackingEventAuditAfter({
        eventId: event.id,
        shipmentId: shipment.id,
        referenceCode: shipment.referenceCode,
        eventType: input.eventType as TrackingEventType,
        previousStatus: shipment.status as TrackingShipmentStatus,
        currentStatus: updatedShipment.status as TrackingShipmentStatus,
        idempotencyKey: input.idempotencyKey,
        sourceSystem: input.sourceSystem,
      });

      await transaction.auditRecord.create({
        data: {
          organizationId: input.organizationId,
          actorType: input.actorType,
          actorId: input.actorId,
          action: "tracking.event.recorded",
          subjectType: "tracking.shipment",
          subjectId: shipment.id,
          severity:
            input.eventType === "exception" || input.eventType === "customs_hold"
              ? ("high" as AuditSeverity)
              : ("medium" as AuditSeverity),
          before: { status: shipment.status },
          after: auditAfter,
          correlationId: input.correlationId,
          ...(input.ipAddress === undefined ? {} : { ipAddress: input.ipAddress }),
          ...(input.userAgent === undefined ? {} : { userAgent: input.userAgent }),
        },
      });

      await this.eventBus.publish(transaction, {
        organizationId: input.organizationId,
        eventType: "tracking.event.recorded",
        aggregateType: "tracking.shipment",
        aggregateId: shipment.id,
        payload: {
          eventId: event.id,
          shipmentId: shipment.id,
          referenceCode: shipment.referenceCode,
          eventType: input.eventType,
          occurredAt: occurredAt.toISOString(),
          previousStatus: shipment.status,
          currentStatus: updatedShipment.status,
          idempotencyKey: input.idempotencyKey,
          correlationId: input.correlationId,
        },
      });

      return {
        ...event,
        shipment: {
          ...event.shipment,
          status: updatedShipment.status,
        },
      } as never;
    });

    await this.usageService.trackUsage(input.organizationId, "tracking_events", 1);

    return createRecordEventOutput({
      organizationId: input.organizationId,
      event: result as Parameters<typeof createRecordEventOutput>[0]["event"],
      replayed: false,
    });
  }

  private databaseTransaction<T>(fn: (tx: PrismaTx) => Promise<T>): Promise<T> {
    return getPrismaClient().$transaction(fn) as Promise<T>;
  }
}
