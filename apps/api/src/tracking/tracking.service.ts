import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  type AuditJsonValue,
  type DatabaseActorType,
  getPrismaClient,
  type SaptmPrismaClient,
} from "@saptm/database";
import {
  type TrackingAdvisoryOutput,
  type TrackingAnalyticsOutput,
  type TrackingEventPayload,
  type TrackingEventRecordInput,
  type TrackingEventRecordOutput,
  type TrackingExceptionManageInput,
  type TrackingExceptionManageOutput,
  type TrackingExceptionResolveInput,
  type TrackingExceptionResolveOutput,
  type TrackingOverviewOutput,
  type TrackingShipmentDetailOutput,
  type trackingAdvisoryRecommendationTypes,
  type trackingAdvisorySeverities,
  trackingApprovalStatuses,
  trackingEventTypes,
  trackingExceptionCategories,
  trackingExceptionResolutionCodes,
  trackingExceptionResolutionStatuses,
  trackingExceptionSeverities,
  trackingExceptionWorkflowStates,
  trackingOperatorEvidenceTypes,
  trackingShipmentStatuses,
  trackingTransportModes,
} from "@saptm/rpc";

export type GetTrackingAdvisoryInput = {
  organizationId: string;
  limit?: number;
  generatedAt?: Date;
};

export type GetTrackingAnalyticsInput = {
  organizationId: string;
  lookbackDays?: number;
  generatedAt?: Date;
};

export type GetTrackingOverviewInput = {
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

export type RecordTrackingEventInput = TrackingEventRecordInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

export type ManageTrackingExceptionInput = TrackingExceptionManageInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

export type ResolveTrackingExceptionInput = TrackingExceptionResolveInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

type TrackingShipmentStatus = (typeof trackingShipmentStatuses)[number];
type TrackingEventType = (typeof trackingEventTypes)[number];
type TrackingExceptionEventType = Extract<
  TrackingEventType,
  "customs_hold" | "delayed" | "exception"
>;
type TrackingExceptionCategory = (typeof trackingExceptionCategories)[number];
type TrackingExceptionSeverity = (typeof trackingExceptionSeverities)[number];
type TrackingExceptionResolutionCode = (typeof trackingExceptionResolutionCodes)[number];
type TrackingExceptionResolutionStatus = (typeof trackingExceptionResolutionStatuses)[number];
type TrackingOperatorEvidenceType = (typeof trackingOperatorEvidenceTypes)[number];
type TrackingApprovalStatus = (typeof trackingApprovalStatuses)[number];
type TrackingExceptionWorkflowState = (typeof trackingExceptionWorkflowStates)[number];
type TrackingTransportMode = (typeof trackingTransportModes)[number];
type TrackingAdvisoryRecommendationType = (typeof trackingAdvisoryRecommendationTypes)[number];
type TrackingAdvisorySeverity = (typeof trackingAdvisorySeverities)[number];
type TrackingOperatorEvidence = TrackingExceptionManageInput["evidence"];
type TrackingStatusGroup = {
  status: TrackingShipmentStatus;
  _count: {
    _all: number;
  };
};
type TrackingModeStatusGroup = TrackingStatusGroup & {
  transportMode: TrackingTransportMode;
};
type TrackingEventTypeGroup = {
  eventType: TrackingEventType;
  _count: {
    _all: number;
  };
  _max: {
    occurredAt: Date | null;
  };
};
type TrackingWorkflowEvent = {
  payload: unknown;
};
type TrackingAdvisoryShipment = {
  id: string;
  referenceCode: string;
  cargoDescription: string;
  transportMode: TrackingTransportMode;
  status: TrackingShipmentStatus;
  priority: number;
  estimatedArrivalAt: Date | null;
  updatedAt: Date;
};
type TrackingAdvisoryCandidate = TrackingAdvisoryOutput["recommendations"][number] & {
  priorityScore: number;
};

type ExistingTrackingEvent = {
  id: string;
  eventType: TrackingEventType;
  occurredAt: Date;
  locationName: string | null;
  notes: string | null;
  payload: unknown;
  sourceSystem: string;
  correlationId: string;
  idempotencyKey: string | null;
  shipment: {
    id: string;
    referenceCode: string;
    status: TrackingShipmentStatus;
  };
};

const terminalTrackingShipmentStatuses: TrackingShipmentStatus[] = ["completed", "cancelled"];

@Injectable()
export class TrackingService {
  private readonly database: SaptmPrismaClient = getPrismaClient();

  async getOverview(input: GetTrackingOverviewInput): Promise<TrackingOverviewOutput> {
    const limit = normalizeLimit(input.limit);
    const [statusGroups, recentShipments] = await Promise.all([
      this.database.trackingShipment.groupBy({
        by: ["status"],
        where: {
          organizationId: input.organizationId,
        },
        _count: {
          _all: true,
        },
      }),
      this.database.trackingShipment.findMany({
        where: {
          organizationId: input.organizationId,
        },
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        take: limit,
        include: {
          events: {
            orderBy: {
              occurredAt: "desc",
            },
            take: 1,
            select: {
              eventType: true,
              occurredAt: true,
              locationName: true,
            },
          },
        },
      }),
    ]);

    const countByStatus = new Map(
      statusGroups.map((group) => [group.status as TrackingShipmentStatus, group._count._all]),
    );
    const statusCounts = trackingShipmentStatuses.map((status) => ({
      status,
      count: countByStatus.get(status) ?? 0,
    }));

    return {
      generatedAt: (input.generatedAt ?? new Date()).toISOString(),
      organizationId: input.organizationId,
      totals: {
        shipments: sumStatusCounts(statusCounts),
        activeShipments: sumActiveShipments(statusCounts),
        delayedShipments: countByStatus.get("delayed") ?? 0,
        exceptionShipments: countByStatus.get("exception") ?? 0,
      },
      statusCounts,
      recentShipments: recentShipments.map((shipment) => {
        const lastEvent = shipment.events.at(0);

        return {
          id: shipment.id,
          referenceCode: shipment.referenceCode,
          externalReference: shipment.externalReference,
          cargoDescription: shipment.cargoDescription,
          originName: shipment.originName,
          destinationName: shipment.destinationName,
          transportMode: shipment.transportMode,
          status: shipment.status,
          priority: shipment.priority,
          estimatedArrivalAt: toIsoStringOrNull(shipment.estimatedArrivalAt),
          lastEventAt: toIsoStringOrNull(lastEvent?.occurredAt),
          lastEventType: (lastEvent?.eventType as TrackingEventType | undefined) ?? null,
          lastKnownLocation: lastEvent?.locationName ?? null,
        };
      }),
    };
  }

  async getAnalytics(input: GetTrackingAnalyticsInput): Promise<TrackingAnalyticsOutput> {
    const lookbackDays = normalizeLookbackDays(input.lookbackDays);
    const generatedAt = input.generatedAt ?? new Date();
    const windowStart = subtractUtcDays(generatedAt, lookbackDays);
    const dueWithin24HoursEnd = addUtcHours(generatedAt, 24);
    const activeStatusFilter = {
      notIn: terminalTrackingShipmentStatuses,
    };
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
      this.database.trackingShipment.groupBy({
        by: ["status"],
        where: {
          organizationId: input.organizationId,
        },
        _count: {
          _all: true,
        },
      }),
      this.database.trackingShipment.groupBy({
        by: ["transportMode", "status"],
        where: {
          organizationId: input.organizationId,
        },
        _count: {
          _all: true,
        },
      }),
      this.database.trackingEvent.groupBy({
        by: ["eventType"],
        where: {
          organizationId: input.organizationId,
          occurredAt: {
            gte: windowStart,
            lte: generatedAt,
          },
        },
        _count: {
          _all: true,
        },
        _max: {
          occurredAt: true,
        },
      }),
      this.database.trackingEvent.findMany({
        where: {
          organizationId: input.organizationId,
          eventType: {
            in: ["customs_hold", "delayed", "exception", "released"],
          },
          occurredAt: {
            gte: windowStart,
            lte: generatedAt,
          },
        },
        orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
        take: 1000,
        select: {
          payload: true,
        },
      }),
      this.database.trackingShipment.count({
        where: {
          organizationId: input.organizationId,
          status: activeStatusFilter,
          priority: {
            lte: 2,
          },
        },
      }),
      this.database.trackingShipment.count({
        where: {
          organizationId: input.organizationId,
          status: activeStatusFilter,
          estimatedArrivalAt: {
            lt: generatedAt,
          },
        },
      }),
      this.database.trackingShipment.count({
        where: {
          organizationId: input.organizationId,
          status: activeStatusFilter,
          estimatedArrivalAt: {
            gte: generatedAt,
            lte: dueWithin24HoursEnd,
          },
        },
      }),
      this.database.trackingShipment.count({
        where: {
          organizationId: input.organizationId,
          status: activeStatusFilter,
          estimatedArrivalAt: null,
        },
      }),
    ]);
    const statusCounts = createStatusCounts(statusGroups);
    const totalShipments = sumStatusCounts(statusCounts);
    const activeShipments = sumActiveShipments(statusCounts);
    const delayedShipments = readStatusCount(statusCounts, "delayed");
    const exceptionShipments = readStatusCount(statusCounts, "exception");
    const completedShipments = readStatusCount(statusCounts, "completed");
    const eventTypeCounts = createEventTypeCounts(eventTypeGroups);
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
      modeDistribution: createModeDistribution(modeStatusGroups),
      eventTypeCounts,
      workflowStateCounts: createWorkflowStateCounts(workflowEvents),
    };
  }

  async getAdvisory(input: GetTrackingAdvisoryInput): Promise<TrackingAdvisoryOutput> {
    const limit = normalizeAdvisoryLimit(input.limit);
    const generatedAt = input.generatedAt ?? new Date();
    const shipments = await this.database.trackingShipment.findMany({
      where: {
        organizationId: input.organizationId,
        status: {
          notIn: terminalTrackingShipmentStatuses,
        },
      },
      orderBy: [{ priority: "asc" }, { estimatedArrivalAt: "asc" }, { updatedAt: "desc" }],
      take: 100,
      select: {
        id: true,
        referenceCode: true,
        cargoDescription: true,
        transportMode: true,
        status: true,
        priority: true,
        estimatedArrivalAt: true,
        updatedAt: true,
      },
    });
    const recommendations = createTrackingAdvisoryRecommendations({
      shipments: shipments.map((shipment) => ({
        id: shipment.id,
        referenceCode: shipment.referenceCode,
        cargoDescription: shipment.cargoDescription,
        transportMode: shipment.transportMode,
        status: shipment.status,
        priority: shipment.priority,
        estimatedArrivalAt: shipment.estimatedArrivalAt,
        updatedAt: shipment.updatedAt,
      })),
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
    const shipment = await this.database.trackingShipment.findFirst({
      where: {
        id: input.shipmentId,
        organizationId: input.organizationId,
      },
      include: {
        _count: {
          select: {
            events: true,
          },
        },
        events: {
          orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
          take: eventLimit,
          select: {
            id: true,
            eventType: true,
            occurredAt: true,
            locationName: true,
            notes: true,
            payload: true,
            sourceSystem: true,
            correlationId: true,
            idempotencyKey: true,
            createdAt: true,
          },
        },
      },
    });

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
        transportMode: shipment.transportMode,
        status: shipment.status,
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
        eventType: event.eventType,
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
    const replayedEvent = await this.findRecordedEventByIdempotencyKey(
      input.organizationId,
      input.idempotencyKey,
    );

    if (replayedEvent !== null) {
      return createManageExceptionOutput({
        organizationId: input.organizationId,
        event: replayedEvent,
        replayed: true,
      });
    }

    const shipment = await this.database.trackingShipment.findFirst({
      where: {
        id: input.shipmentId,
        organizationId: input.organizationId,
      },
      select: {
        id: true,
        referenceCode: true,
        status: true,
      },
    });

    if (shipment === null) {
      throw new NotFoundException("tracking.shipment_not_found");
    }

    const occurredAt = new Date(input.occurredAt);
    const eventType = resolveExceptionEventType(input.category);
    const nextStatus = resolveShipmentStatusAfterEvent(eventType, shipment.status);
    const expectedResolutionAt =
      input.expectedResolutionAt === undefined ? null : new Date(input.expectedResolutionAt);
    const notes = createExceptionNotes(input.summary, input.recoveryPlan);
    const operatorEvidence = createOperatorEvidenceContext(input.evidence);
    const workflowState = resolveManagedExceptionWorkflowState(input.evidence.approvalStatus);
    const eventPayload = createManagedExceptionPayload({
      category: input.category,
      severity: input.severity,
      summary: input.summary,
      recoveryPlan: input.recoveryPlan,
      operatorEvidence,
      workflowState,
      ownerTeam: input.ownerTeam ?? null,
      expectedResolutionAt: expectedResolutionAt?.toISOString() ?? null,
      previousStatus: shipment.status,
      currentStatus: nextStatus,
      operatorPayload: input.payload ?? null,
    });

    const result = await this.database.$transaction(async (transaction) => {
      const event = await transaction.trackingEvent.create({
        data: {
          organizationId: input.organizationId,
          shipmentId: shipment.id,
          eventType,
          occurredAt,
          sourceSystem: input.sourceSystem,
          correlationId: input.correlationId,
          idempotencyKey: input.idempotencyKey,
          notes,
          payload: eventPayload,
          ...(input.locationName === undefined ? {} : { locationName: input.locationName }),
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
        nextStatus === shipment.status
          ? shipment
          : await transaction.trackingShipment.update({
              where: {
                id: shipment.id,
              },
              data: {
                status: nextStatus,
              },
              select: {
                id: true,
                referenceCode: true,
                status: true,
              },
            });
      const auditAfter = createTrackingExceptionAuditAfter({
        eventId: event.id,
        shipmentId: shipment.id,
        referenceCode: shipment.referenceCode,
        category: input.category,
        severity: input.severity,
        summary: input.summary,
        recoveryPlan: input.recoveryPlan,
        operatorEvidence,
        workflowState,
        ownerTeam: input.ownerTeam ?? null,
        expectedResolutionAt: expectedResolutionAt?.toISOString() ?? null,
        previousStatus: shipment.status,
        currentStatus: updatedShipment.status,
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
          severity: input.severity,
          before: {
            status: shipment.status,
          },
          after: auditAfter,
          correlationId: input.correlationId,
          ...(input.ipAddress === undefined ? {} : { ipAddress: input.ipAddress }),
          ...(input.userAgent === undefined ? {} : { userAgent: input.userAgent }),
        },
      });

      await transaction.outboxEvent.create({
        data: {
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
        },
      });

      return {
        ...event,
        payload: eventPayload,
        shipment: {
          ...event.shipment,
          status: updatedShipment.status,
        },
      };
    });

    return createManageExceptionOutput({
      organizationId: input.organizationId,
      event: result,
      replayed: false,
    });
  }

  async resolveException(
    input: ResolveTrackingExceptionInput,
  ): Promise<TrackingExceptionResolveOutput> {
    const replayedEvent = await this.findRecordedEventByIdempotencyKey(
      input.organizationId,
      input.idempotencyKey,
    );

    if (replayedEvent !== null) {
      return createResolveExceptionOutput({
        organizationId: input.organizationId,
        event: replayedEvent,
        replayed: true,
      });
    }

    const shipment = await this.database.trackingShipment.findFirst({
      where: {
        id: input.shipmentId,
        organizationId: input.organizationId,
      },
      select: {
        id: true,
        referenceCode: true,
        status: true,
      },
    });

    if (shipment === null) {
      throw new NotFoundException("tracking.shipment_not_found");
    }

    if (!isResolvableExceptionStatus(shipment.status)) {
      throw new BadRequestException("tracking.exception_not_active");
    }

    const occurredAt = new Date(input.occurredAt);
    const notes = createResolutionNotes(input.summary, input.resolutionCode);
    const operatorEvidence = createOperatorEvidenceContext(input.evidence);
    const workflowState: TrackingExceptionWorkflowState = "closed";
    const eventPayload = createResolvedExceptionPayload({
      resolutionCode: input.resolutionCode,
      summary: input.summary,
      operatorEvidence,
      workflowState,
      ownerTeam: input.ownerTeam ?? null,
      previousStatus: shipment.status,
      currentStatus: input.nextStatus,
      operatorPayload: input.payload ?? null,
    });
    const shouldSetActualArrival =
      input.nextStatus === "arrived" || input.nextStatus === "completed";

    const result = await this.database.$transaction(async (transaction) => {
      const event = await transaction.trackingEvent.create({
        data: {
          organizationId: input.organizationId,
          shipmentId: shipment.id,
          eventType: "released",
          occurredAt,
          sourceSystem: input.sourceSystem,
          correlationId: input.correlationId,
          idempotencyKey: input.idempotencyKey,
          notes,
          payload: eventPayload,
          ...(input.locationName === undefined ? {} : { locationName: input.locationName }),
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
      const updatedShipment = await transaction.trackingShipment.update({
        where: {
          id: shipment.id,
        },
        data: {
          status: input.nextStatus,
          ...(shouldSetActualArrival ? { actualArrivalAt: occurredAt } : {}),
        },
        select: {
          id: true,
          referenceCode: true,
          status: true,
        },
      });
      const auditAfter = createTrackingExceptionResolutionAuditAfter({
        eventId: event.id,
        shipmentId: shipment.id,
        referenceCode: shipment.referenceCode,
        resolutionCode: input.resolutionCode,
        summary: input.summary,
        operatorEvidence,
        workflowState,
        ownerTeam: input.ownerTeam ?? null,
        previousStatus: shipment.status,
        currentStatus: updatedShipment.status,
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
          severity: "high",
          before: {
            status: shipment.status,
          },
          after: auditAfter,
          correlationId: input.correlationId,
          ...(input.ipAddress === undefined ? {} : { ipAddress: input.ipAddress }),
          ...(input.userAgent === undefined ? {} : { userAgent: input.userAgent }),
        },
      });

      await transaction.outboxEvent.create({
        data: {
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
        },
      });

      return {
        ...event,
        payload: eventPayload,
        shipment: {
          ...event.shipment,
          status: updatedShipment.status,
        },
      };
    });

    return createResolveExceptionOutput({
      organizationId: input.organizationId,
      event: result,
      replayed: false,
    });
  }

  async recordEvent(input: RecordTrackingEventInput): Promise<TrackingEventRecordOutput> {
    const replayedEvent = await this.findRecordedEventByIdempotencyKey(
      input.organizationId,
      input.idempotencyKey,
    );

    if (replayedEvent !== null) {
      return createRecordEventOutput({
        organizationId: input.organizationId,
        event: replayedEvent,
        replayed: true,
      });
    }

    const shipment = await this.database.trackingShipment.findFirst({
      where: {
        id: input.shipmentId,
        organizationId: input.organizationId,
      },
      select: {
        id: true,
        referenceCode: true,
        status: true,
      },
    });

    if (shipment === null) {
      throw new NotFoundException("tracking.shipment_not_found");
    }

    const occurredAt = new Date(input.occurredAt);
    const nextStatus = resolveShipmentStatusAfterEvent(input.eventType, shipment.status);
    const shouldSetActualArrival = input.eventType === "arrived";

    const result = await this.database.$transaction(async (transaction) => {
      const event = await transaction.trackingEvent.create({
        data: {
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
        nextStatus === shipment.status && !shouldSetActualArrival
          ? shipment
          : await transaction.trackingShipment.update({
              where: {
                id: shipment.id,
              },
              data: {
                ...(nextStatus === shipment.status ? {} : { status: nextStatus }),
                ...(shouldSetActualArrival ? { actualArrivalAt: occurredAt } : {}),
              },
              select: {
                id: true,
                referenceCode: true,
                status: true,
              },
            });
      const auditAfter = createTrackingEventAuditAfter({
        eventId: event.id,
        shipmentId: shipment.id,
        referenceCode: shipment.referenceCode,
        eventType: input.eventType,
        previousStatus: shipment.status,
        currentStatus: updatedShipment.status,
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
              ? "high"
              : "medium",
          before: {
            status: shipment.status,
          },
          after: auditAfter,
          correlationId: input.correlationId,
          ...(input.ipAddress === undefined ? {} : { ipAddress: input.ipAddress }),
          ...(input.userAgent === undefined ? {} : { userAgent: input.userAgent }),
        },
      });

      await transaction.outboxEvent.create({
        data: {
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
        },
      });

      return {
        ...event,
        shipment: {
          ...event.shipment,
          status: updatedShipment.status,
        },
      };
    });

    return createRecordEventOutput({
      organizationId: input.organizationId,
      event: result,
      replayed: false,
    });
  }

  private async findRecordedEventByIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<ExistingTrackingEvent | null> {
    return this.database.trackingEvent.findFirst({
      where: {
        organizationId,
        idempotencyKey,
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
  }
}

function normalizeLimit(limit: number | undefined): number {
  if (limit === undefined) {
    return 10;
  }

  return Math.min(Math.max(limit, 1), 50);
}

function normalizeLookbackDays(lookbackDays: number | undefined): number {
  if (lookbackDays === undefined) {
    return 30;
  }

  return Math.min(Math.max(lookbackDays, 1), 90);
}

function normalizeAdvisoryLimit(limit: number | undefined): number {
  if (limit === undefined) {
    return 5;
  }

  return Math.min(Math.max(limit, 1), 20);
}

function normalizeEventLimit(limit: number | undefined): number {
  if (limit === undefined) {
    return 50;
  }

  return Math.min(Math.max(limit, 1), 100);
}

function createTrackingAdvisoryRecommendations(input: {
  shipments: readonly TrackingAdvisoryShipment[];
  generatedAt: Date;
  limit: number;
}): TrackingAdvisoryOutput["recommendations"] {
  const candidates: TrackingAdvisoryCandidate[] = [];
  const recommendationKeys = new Set<string>();

  for (const shipment of input.shipments) {
    if (shipment.status === "exception" || shipment.status === "delayed") {
      candidates.push(
        createTrackingAdvisoryCandidate({
          shipment,
          type: "exception_recovery",
          severity: shipment.priority <= 1 ? "critical" : "high",
          title: "Validar recuperacao de excecao operacional",
          rationale:
            "A carga esta atrasada ou em excecao e deve ter evidencias, owner e plano de recuperacao revistos antes de qualquer release.",
          recommendedAction:
            "Confirmar evidencias aprovadas, atualizar owner operacional e executar resolucao apenas pelo fluxo governado.",
          approvalRequiredFor: "tracking.exception.resolve",
          confidenceScore: shipment.status === "exception" ? 0.88 : 0.82,
          priorityScore: shipment.priority <= 1 ? 100 : 90,
        }),
      );
      recommendationKeys.add(createAdvisoryKey(shipment.id, "exception_recovery"));
    }

    if (shipment.estimatedArrivalAt !== null && shipment.estimatedArrivalAt < input.generatedAt) {
      const type: TrackingAdvisoryRecommendationType = "sla_risk";

      if (!recommendationKeys.has(createAdvisoryKey(shipment.id, type))) {
        candidates.push(
          createTrackingAdvisoryCandidate({
            shipment,
            type,
            severity: shipment.priority <= 2 ? "high" : "medium",
            title: "Rever ETA vencido e risco de SLA",
            rationale:
              "A ETA planeada ja passou e a carga continua ativa; isto indica risco de SLA, atraso operacional ou evento pendente.",
            recommendedAction:
              "Registar evento atualizado, confirmar localizacao real e abrir excecao se o atraso ainda nao estiver formalizado.",
            approvalRequiredFor: "tracking.exception.manage",
            confidenceScore: 0.78,
            priorityScore: shipment.priority <= 2 ? 80 : 65,
          }),
        );
      }
    }

    if (shipment.priority <= 2 && shipment.estimatedArrivalAt === null) {
      candidates.push(
        createTrackingAdvisoryCandidate({
          shipment,
          type: "priority_review",
          severity: "medium",
          title: "Completar ETA de carga prioritaria",
          rationale:
            "Cargas de alta prioridade sem ETA reduzem previsibilidade operacional e qualidade dos alertas.",
          recommendedAction:
            "Validar ETA com a equipa responsavel e registar evento de localizacao ou handover quando aplicavel.",
          approvalRequiredFor: "tracking.event.record",
          confidenceScore: 0.7,
          priorityScore: 55,
        }),
      );
    }
  }

  if (candidates.length === 0 && input.shipments.length > 0) {
    const shipment = input.shipments[0];

    if (shipment === undefined) {
      return [];
    }

    candidates.push(
      createTrackingAdvisoryCandidate({
        shipment,
        type: "workflow_review",
        severity: "medium",
        title: "Manter revisao operacional preventiva",
        rationale:
          "Nao existem riscos criticos detectados, mas a carga ativa deve manter cadencia de eventos para rastreabilidade.",
        recommendedAction:
          "Confirmar ultimo evento operacional e manter a timeline auditavel atualizada.",
        approvalRequiredFor: "tracking.event.record",
        confidenceScore: 0.62,
        priorityScore: 40,
      }),
    );
  }

  return candidates
    .sort((left, right) => right.priorityScore - left.priorityScore)
    .slice(0, input.limit)
    .map(({ priorityScore: _priorityScore, ...recommendation }) => recommendation);
}

function createTrackingAdvisoryCandidate(input: {
  shipment: TrackingAdvisoryShipment;
  type: TrackingAdvisoryRecommendationType;
  severity: TrackingAdvisorySeverity;
  title: string;
  rationale: string;
  recommendedAction: string;
  approvalRequiredFor: TrackingAdvisoryOutput["recommendations"][number]["approvalRequiredFor"];
  confidenceScore: number;
  priorityScore: number;
}): TrackingAdvisoryCandidate {
  return {
    id: createAdvisoryKey(input.shipment.id, input.type),
    type: input.type,
    severity: input.severity,
    title: input.title,
    rationale: input.rationale,
    recommendedAction: input.recommendedAction,
    shipment: {
      id: input.shipment.id,
      referenceCode: input.shipment.referenceCode,
      cargoDescription: input.shipment.cargoDescription,
      status: input.shipment.status,
      transportMode: input.shipment.transportMode,
      estimatedArrivalAt: toIsoStringOrNull(input.shipment.estimatedArrivalAt),
    },
    humanApprovalRequired: true,
    approvalRequiredFor: input.approvalRequiredFor,
    confidenceScore: input.confidenceScore,
    source: "rule_based_operational_advisor",
    priorityScore: input.priorityScore,
  };
}

function createAdvisoryKey(shipmentId: string, type: TrackingAdvisoryRecommendationType): string {
  return `tracking-advisory:${type}:${shipmentId}`;
}

function createStatusCounts(
  statusGroups: readonly TrackingStatusGroup[],
): TrackingOverviewOutput["statusCounts"] {
  const countByStatus = new Map(
    statusGroups.map((group) => [group.status as TrackingShipmentStatus, group._count._all]),
  );

  return trackingShipmentStatuses.map((status) => ({
    status,
    count: countByStatus.get(status) ?? 0,
  }));
}

function sumStatusCounts(statusCounts: TrackingOverviewOutput["statusCounts"]): number {
  return statusCounts.reduce((total, item) => total + item.count, 0);
}

function sumActiveShipments(statusCounts: TrackingOverviewOutput["statusCounts"]): number {
  const terminalStatuses = new Set<TrackingShipmentStatus>(["completed", "cancelled"]);

  return statusCounts.reduce(
    (total, item) => (terminalStatuses.has(item.status) ? total : total + item.count),
    0,
  );
}

function readStatusCount(
  statusCounts: TrackingOverviewOutput["statusCounts"],
  status: TrackingShipmentStatus,
): number {
  return statusCounts.find((item) => item.status === status)?.count ?? 0;
}

function createModeDistribution(
  modeStatusGroups: readonly TrackingModeStatusGroup[],
): TrackingAnalyticsOutput["modeDistribution"] {
  const countsByModeAndStatus = new Map<string, number>();

  for (const group of modeStatusGroups) {
    countsByModeAndStatus.set(
      createModeStatusKey(group.transportMode, group.status),
      group._count._all,
    );
  }

  return trackingTransportModes.map((transportMode) => {
    const statusCounts = trackingShipmentStatuses.map((status) => ({
      status,
      count: countsByModeAndStatus.get(createModeStatusKey(transportMode, status)) ?? 0,
    }));

    return {
      transportMode,
      shipments: sumStatusCounts(statusCounts),
      activeShipments: sumActiveShipments(statusCounts),
      delayedShipments: readStatusCount(statusCounts, "delayed"),
      exceptionShipments: readStatusCount(statusCounts, "exception"),
    };
  });
}

function createEventTypeCounts(
  eventTypeGroups: readonly TrackingEventTypeGroup[],
): TrackingAnalyticsOutput["eventTypeCounts"] {
  const countByEventType = new Map(
    eventTypeGroups.map((group) => [
      group.eventType as TrackingEventType,
      {
        count: group._count._all,
        latestOccurredAt: toIsoStringOrNull(group._max.occurredAt),
      },
    ]),
  );

  return trackingEventTypes.map((eventType) => {
    const aggregate = countByEventType.get(eventType);

    return {
      eventType,
      count: aggregate?.count ?? 0,
      latestOccurredAt: aggregate?.latestOccurredAt ?? null,
    };
  });
}

function createWorkflowStateCounts(
  events: readonly TrackingWorkflowEvent[],
): TrackingAnalyticsOutput["workflowStateCounts"] {
  const countByState = new Map<TrackingExceptionWorkflowState, number>();

  for (const event of events) {
    const state = readNullableExceptionWorkflowState(getPayloadRecord(event.payload));

    if (state !== null) {
      countByState.set(state, (countByState.get(state) ?? 0) + 1);
    }
  }

  return trackingExceptionWorkflowStates.map((state) => ({
    state,
    count: countByState.get(state) ?? 0,
  }));
}

function createModeStatusKey(
  transportMode: TrackingTransportMode,
  status: TrackingShipmentStatus,
): string {
  return `${transportMode}:${status}`;
}

function subtractUtcDays(value: Date, days: number): Date {
  return new Date(value.getTime() - days * 24 * 60 * 60 * 1000);
}

function addUtcHours(value: Date, hours: number): Date {
  return new Date(value.getTime() + hours * 60 * 60 * 1000);
}

function roundRatio(numerator: number, denominator: number): number {
  if (denominator <= 0) {
    return 0;
  }

  return Math.round((numerator / denominator) * 100) / 100;
}

function roundRatioPercent(numerator: number, denominator: number): number {
  if (denominator <= 0) {
    return 0;
  }

  return Math.round((numerator / denominator) * 10_000) / 100;
}

function toIsoStringOrNull(value: Date | null | undefined): string | null {
  return value?.toISOString() ?? null;
}

function toTrackingEventPayloadOrNull(value: unknown): TrackingEventPayload | null {
  return isTrackingEventPayload(value) ? value : null;
}

function isTrackingEventPayload(value: unknown): value is TrackingEventPayload {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).every(isTrackingEventPayloadValue);
}

function isTrackingEventPayloadValue(value: unknown): value is TrackingEventPayload[string] {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isTrackingEventPayloadValue);
  }

  return isTrackingEventPayload(value);
}

function resolveShipmentStatusAfterEvent(
  eventType: TrackingEventType,
  currentStatus: TrackingShipmentStatus,
): TrackingShipmentStatus {
  if (currentStatus === "completed" || currentStatus === "cancelled") {
    return currentStatus;
  }

  if (eventType === "created") {
    return "planned";
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

function resolveExceptionEventType(
  category: TrackingExceptionCategory,
): TrackingExceptionEventType {
  if (category === "delay") {
    return "delayed";
  }

  if (category === "customs_hold") {
    return "customs_hold";
  }

  return "exception";
}

function resolveManagedExceptionOutputEventType(
  eventType: TrackingEventType,
): TrackingExceptionEventType | null {
  if (eventType === "delayed" || eventType === "customs_hold" || eventType === "exception") {
    return eventType;
  }

  return null;
}

function isResolvableExceptionStatus(status: TrackingShipmentStatus): boolean {
  return status === "exception" || status === "delayed";
}

function createExceptionNotes(summary: string, recoveryPlan: string): string {
  return `${summary}\n\nRecovery plan: ${recoveryPlan}`;
}

function createResolutionNotes(
  summary: string,
  resolutionCode: TrackingExceptionResolutionCode,
): string {
  return `${summary}\n\nResolution code: ${resolutionCode}`;
}

function createOperatorEvidenceContext(evidence: TrackingOperatorEvidence): TrackingEventPayload {
  return {
    operatorName: evidence.operatorName,
    evidenceType: evidence.evidenceType,
    evidenceReference: evidence.evidenceReference,
    evidenceSummary: evidence.evidenceSummary,
    approvalStatus: evidence.approvalStatus,
    approvalReference: evidence.approvalReference ?? null,
    approverName: evidence.approverName ?? null,
  };
}

function resolveManagedExceptionWorkflowState(
  approvalStatus: TrackingApprovalStatus,
): TrackingExceptionWorkflowState {
  return approvalStatus === "approved" ? "approved_for_resolution" : "pending_review";
}

function createExceptionWorkflowContext(input: {
  state: TrackingExceptionWorkflowState;
  terminal: boolean;
  releaseEvidenceRequired: boolean;
}): TrackingEventPayload {
  return {
    state: input.state,
    terminal: input.terminal,
    releaseEvidenceRequired: input.releaseEvidenceRequired,
  };
}

function createManagedExceptionPayload(input: {
  category: TrackingExceptionCategory;
  severity: TrackingExceptionSeverity;
  summary: string;
  recoveryPlan: string;
  operatorEvidence: TrackingEventPayload;
  workflowState: TrackingExceptionWorkflowState;
  ownerTeam: string | null;
  expectedResolutionAt: string | null;
  previousStatus: TrackingShipmentStatus;
  currentStatus: TrackingShipmentStatus;
  operatorPayload: TrackingEventPayload | null;
}): TrackingEventPayload {
  return {
    exceptionCategory: input.category,
    exceptionSeverity: input.severity,
    summary: input.summary,
    recoveryPlan: input.recoveryPlan,
    operatorEvidence: input.operatorEvidence,
    workflow: createExceptionWorkflowContext({
      state: input.workflowState,
      terminal: false,
      releaseEvidenceRequired: true,
    }),
    workflowState: input.workflowState,
    ownerTeam: input.ownerTeam,
    expectedResolutionAt: input.expectedResolutionAt,
    previousStatus: input.previousStatus,
    currentStatus: input.currentStatus,
    operatorPayload: input.operatorPayload,
  };
}

function createResolvedExceptionPayload(input: {
  resolutionCode: TrackingExceptionResolutionCode;
  summary: string;
  operatorEvidence: TrackingEventPayload;
  workflowState: TrackingExceptionWorkflowState;
  ownerTeam: string | null;
  previousStatus: TrackingShipmentStatus;
  currentStatus: TrackingExceptionResolutionStatus;
  operatorPayload: TrackingEventPayload | null;
}): TrackingEventPayload {
  return {
    resolutionCode: input.resolutionCode,
    summary: input.summary,
    operatorEvidence: input.operatorEvidence,
    workflow: createExceptionWorkflowContext({
      state: input.workflowState,
      terminal: true,
      releaseEvidenceRequired: false,
    }),
    workflowState: input.workflowState,
    ownerTeam: input.ownerTeam,
    previousStatus: input.previousStatus,
    currentStatus: input.currentStatus,
    operatorPayload: input.operatorPayload,
  };
}

function createTrackingEventAuditAfter(input: {
  eventId: string;
  shipmentId: string;
  referenceCode: string;
  eventType: TrackingEventType;
  previousStatus: TrackingShipmentStatus;
  currentStatus: TrackingShipmentStatus;
  idempotencyKey: string;
  sourceSystem: string;
}): AuditJsonValue {
  return {
    eventId: input.eventId,
    shipmentId: input.shipmentId,
    referenceCode: input.referenceCode,
    eventType: input.eventType,
    previousStatus: input.previousStatus,
    currentStatus: input.currentStatus,
    idempotencyKey: input.idempotencyKey,
    sourceSystem: input.sourceSystem,
  };
}

function createTrackingExceptionAuditAfter(input: {
  eventId: string;
  shipmentId: string;
  referenceCode: string;
  category: TrackingExceptionCategory;
  severity: TrackingExceptionSeverity;
  summary: string;
  recoveryPlan: string;
  operatorEvidence: TrackingEventPayload;
  workflowState: TrackingExceptionWorkflowState;
  ownerTeam: string | null;
  expectedResolutionAt: string | null;
  previousStatus: TrackingShipmentStatus;
  currentStatus: TrackingShipmentStatus;
  idempotencyKey: string;
  sourceSystem: string;
}): AuditJsonValue {
  return {
    eventId: input.eventId,
    shipmentId: input.shipmentId,
    referenceCode: input.referenceCode,
    category: input.category,
    severity: input.severity,
    summary: input.summary,
    recoveryPlan: input.recoveryPlan,
    operatorEvidence: input.operatorEvidence,
    workflow: createExceptionWorkflowContext({
      state: input.workflowState,
      terminal: false,
      releaseEvidenceRequired: true,
    }),
    workflowState: input.workflowState,
    ownerTeam: input.ownerTeam,
    expectedResolutionAt: input.expectedResolutionAt,
    previousStatus: input.previousStatus,
    currentStatus: input.currentStatus,
    idempotencyKey: input.idempotencyKey,
    sourceSystem: input.sourceSystem,
  };
}

function createTrackingExceptionResolutionAuditAfter(input: {
  eventId: string;
  shipmentId: string;
  referenceCode: string;
  resolutionCode: TrackingExceptionResolutionCode;
  summary: string;
  operatorEvidence: TrackingEventPayload;
  workflowState: TrackingExceptionWorkflowState;
  ownerTeam: string | null;
  previousStatus: TrackingShipmentStatus;
  currentStatus: TrackingShipmentStatus;
  idempotencyKey: string;
  sourceSystem: string;
}): AuditJsonValue {
  return {
    eventId: input.eventId,
    shipmentId: input.shipmentId,
    referenceCode: input.referenceCode,
    resolutionCode: input.resolutionCode,
    summary: input.summary,
    operatorEvidence: input.operatorEvidence,
    workflow: createExceptionWorkflowContext({
      state: input.workflowState,
      terminal: true,
      releaseEvidenceRequired: false,
    }),
    workflowState: input.workflowState,
    ownerTeam: input.ownerTeam,
    previousStatus: input.previousStatus,
    currentStatus: input.currentStatus,
    idempotencyKey: input.idempotencyKey,
    sourceSystem: input.sourceSystem,
  };
}

function createManageExceptionOutput(input: {
  organizationId: string;
  event: ExistingTrackingEvent;
  replayed: boolean;
}): TrackingExceptionManageOutput {
  if (input.event.idempotencyKey === null) {
    throw new Error("tracking.exception.idempotency_key_missing");
  }

  const eventType = resolveManagedExceptionOutputEventType(input.event.eventType);

  if (eventType === null) {
    throw new Error("tracking.exception.idempotency_key_conflict");
  }

  const payload = getPayloadRecord(input.event.payload);
  const category = readExceptionCategory(payload, eventType);
  const severity = readExceptionSeverity(payload);
  const summary = readPayloadString(payload, "summary") ?? input.event.notes ?? "Managed exception";
  const recoveryPlan = readPayloadString(payload, "recoveryPlan") ?? input.event.notes ?? summary;
  const previousStatus = readShipmentStatusPayload(
    payload,
    "previousStatus",
    input.event.shipment.status,
  );
  const currentStatus = readShipmentStatusPayload(
    payload,
    "currentStatus",
    input.event.shipment.status,
  );
  const operatorEvidence = readOperatorEvidencePayload(payload);
  const workflowState =
    readNullableExceptionWorkflowState(payload) ??
    resolveManagedExceptionWorkflowState(operatorEvidence.approvalStatus);

  return {
    organizationId: input.organizationId,
    shipmentId: input.event.shipment.id,
    exception: {
      category,
      severity,
      summary,
      recoveryPlan,
      ownerTeam: readNullablePayloadString(payload, "ownerTeam"),
      expectedResolutionAt: readNullablePayloadString(payload, "expectedResolutionAt"),
    },
    evidence: operatorEvidence,
    workflow: {
      state: workflowState,
      terminal: false,
      releaseEvidenceRequired: true,
    },
    event: {
      id: input.event.id,
      eventType,
      occurredAt: input.event.occurredAt.toISOString(),
      locationName: input.event.locationName,
      notes: input.event.notes ?? summary,
      sourceSystem: input.event.sourceSystem,
      correlationId: input.event.correlationId,
      idempotencyKey: input.event.idempotencyKey,
    },
    shipment: {
      id: input.event.shipment.id,
      referenceCode: input.event.shipment.referenceCode,
      previousStatus,
      currentStatus,
    },
    idempotency: {
      key: input.event.idempotencyKey,
      replayed: input.replayed,
    },
    audit: {
      action: "tracking.exception.managed",
      subjectType: "tracking.shipment",
      subjectId: input.event.shipment.id,
    },
    outbox: {
      eventType: "tracking.exception.managed",
      aggregateType: "tracking.shipment",
      aggregateId: input.event.shipment.id,
    },
  };
}

function createResolveExceptionOutput(input: {
  organizationId: string;
  event: ExistingTrackingEvent;
  replayed: boolean;
}): TrackingExceptionResolveOutput {
  if (input.event.idempotencyKey === null) {
    throw new Error("tracking.exception_resolution.idempotency_key_missing");
  }

  if (input.event.eventType !== "released") {
    throw new Error("tracking.exception_resolution.idempotency_key_conflict");
  }

  const payload = getPayloadRecord(input.event.payload);
  const resolutionCode = readExceptionResolutionCode(payload);
  const summary =
    readPayloadString(payload, "summary") ?? input.event.notes ?? "Resolved exception";
  const previousStatus = readShipmentStatusPayload(
    payload,
    "previousStatus",
    input.event.shipment.status,
  );
  const currentStatus = readExceptionResolutionStatus(payload, input.event.shipment.status);
  const operatorEvidence = readOperatorEvidencePayload(payload);
  const workflowState = readNullableExceptionWorkflowState(payload) ?? "closed";

  return {
    organizationId: input.organizationId,
    shipmentId: input.event.shipment.id,
    resolution: {
      resolutionCode,
      summary,
      ownerTeam: readNullablePayloadString(payload, "ownerTeam"),
      nextStatus: currentStatus,
    },
    evidence: operatorEvidence,
    workflow: {
      state: workflowState,
      terminal: true,
      releaseEvidenceRequired: false,
    },
    event: {
      id: input.event.id,
      eventType: "released",
      occurredAt: input.event.occurredAt.toISOString(),
      locationName: input.event.locationName,
      notes: input.event.notes ?? summary,
      sourceSystem: input.event.sourceSystem,
      correlationId: input.event.correlationId,
      idempotencyKey: input.event.idempotencyKey,
    },
    shipment: {
      id: input.event.shipment.id,
      referenceCode: input.event.shipment.referenceCode,
      previousStatus,
      currentStatus,
    },
    idempotency: {
      key: input.event.idempotencyKey,
      replayed: input.replayed,
    },
    audit: {
      action: "tracking.exception.resolved",
      subjectType: "tracking.shipment",
      subjectId: input.event.shipment.id,
    },
    outbox: {
      eventType: "tracking.exception.resolved",
      aggregateType: "tracking.shipment",
      aggregateId: input.event.shipment.id,
    },
  };
}

function getPayloadRecord(payload: unknown): Record<string, unknown> {
  return typeof payload === "object" && payload !== null && !Array.isArray(payload)
    ? (payload as Record<string, unknown>)
    : {};
}

function readPayloadString(payload: Record<string, unknown>, key: string): string | undefined {
  const value = payload[key];

  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function readNullablePayloadString(payload: Record<string, unknown>, key: string): string | null {
  return readPayloadString(payload, key) ?? null;
}

function readOperatorEvidencePayload(payload: Record<string, unknown>): {
  operatorName: string;
  evidenceType: TrackingOperatorEvidenceType;
  evidenceReference: string;
  evidenceSummary: string;
  approvalStatus: TrackingApprovalStatus;
  approvalReference: string | null;
  approverName: string | null;
} {
  const nestedEvidence = getPayloadRecord(payload.operatorEvidence);
  const evidence = Object.keys(nestedEvidence).length > 0 ? nestedEvidence : payload;

  return {
    operatorName: readPayloadString(evidence, "operatorName") ?? "Unknown operator",
    evidenceType: readOperatorEvidenceType(evidence),
    evidenceReference: readPayloadString(evidence, "evidenceReference") ?? "not-recorded",
    evidenceSummary:
      readPayloadString(evidence, "evidenceSummary") ??
      "Legacy exception event without explicit operator evidence.",
    approvalStatus: readApprovalStatus(evidence),
    approvalReference: readNullablePayloadString(evidence, "approvalReference"),
    approverName: readNullablePayloadString(evidence, "approverName"),
  };
}

function readExceptionCategory(
  payload: Record<string, unknown>,
  eventType: TrackingExceptionEventType,
): TrackingExceptionCategory {
  const value = payload.exceptionCategory;

  if (isTrackingExceptionCategory(value)) {
    return value;
  }

  if (eventType === "delayed") {
    return "delay";
  }

  if (eventType === "customs_hold") {
    return "customs_hold";
  }

  return "other";
}

function readExceptionSeverity(payload: Record<string, unknown>): TrackingExceptionSeverity {
  const value = payload.exceptionSeverity;

  return isTrackingExceptionSeverity(value) ? value : "high";
}

function readExceptionResolutionCode(
  payload: Record<string, unknown>,
): TrackingExceptionResolutionCode {
  const value = payload.resolutionCode;

  return isTrackingExceptionResolutionCode(value) ? value : "other";
}

function readExceptionResolutionStatus(
  payload: Record<string, unknown>,
  fallback: TrackingShipmentStatus,
): TrackingExceptionResolutionStatus {
  const value = payload.currentStatus;

  if (isTrackingExceptionResolutionStatus(value)) {
    return value;
  }

  return isTrackingExceptionResolutionStatus(fallback) ? fallback : "in_transit";
}

function readOperatorEvidenceType(payload: Record<string, unknown>): TrackingOperatorEvidenceType {
  const value = payload.evidenceType;

  return isTrackingOperatorEvidenceType(value) ? value : "operator_note";
}

function readApprovalStatus(payload: Record<string, unknown>): TrackingApprovalStatus {
  const value = payload.approvalStatus;

  return isTrackingApprovalStatus(value) ? value : "pending_review";
}

function readNullableExceptionWorkflowState(
  payload: Record<string, unknown>,
): TrackingExceptionWorkflowState | null {
  const nestedWorkflow = getPayloadRecord(payload.workflow);
  const workflowState =
    Object.keys(nestedWorkflow).length > 0 ? nestedWorkflow.state : payload.workflowState;

  return isTrackingExceptionWorkflowState(workflowState) ? workflowState : null;
}

function readShipmentStatusPayload(
  payload: Record<string, unknown>,
  key: string,
  fallback: TrackingShipmentStatus,
): TrackingShipmentStatus {
  const value = payload[key];

  return isTrackingShipmentStatus(value) ? value : fallback;
}

function isTrackingExceptionCategory(value: unknown): value is TrackingExceptionCategory {
  return (
    typeof value === "string" &&
    trackingExceptionCategories.includes(value as TrackingExceptionCategory)
  );
}

function isTrackingExceptionSeverity(value: unknown): value is TrackingExceptionSeverity {
  return (
    typeof value === "string" &&
    trackingExceptionSeverities.includes(value as TrackingExceptionSeverity)
  );
}

function isTrackingExceptionResolutionCode(
  value: unknown,
): value is TrackingExceptionResolutionCode {
  return (
    typeof value === "string" &&
    trackingExceptionResolutionCodes.includes(value as TrackingExceptionResolutionCode)
  );
}

function isTrackingExceptionResolutionStatus(
  value: unknown,
): value is TrackingExceptionResolutionStatus {
  return (
    typeof value === "string" &&
    trackingExceptionResolutionStatuses.includes(value as TrackingExceptionResolutionStatus)
  );
}

function isTrackingOperatorEvidenceType(value: unknown): value is TrackingOperatorEvidenceType {
  return (
    typeof value === "string" &&
    trackingOperatorEvidenceTypes.includes(value as TrackingOperatorEvidenceType)
  );
}

function isTrackingApprovalStatus(value: unknown): value is TrackingApprovalStatus {
  return (
    typeof value === "string" && trackingApprovalStatuses.includes(value as TrackingApprovalStatus)
  );
}

function isTrackingExceptionWorkflowState(value: unknown): value is TrackingExceptionWorkflowState {
  return (
    typeof value === "string" &&
    trackingExceptionWorkflowStates.includes(value as TrackingExceptionWorkflowState)
  );
}

function isTrackingShipmentStatus(value: unknown): value is TrackingShipmentStatus {
  return (
    typeof value === "string" && trackingShipmentStatuses.includes(value as TrackingShipmentStatus)
  );
}

function createRecordEventOutput(input: {
  organizationId: string;
  event: ExistingTrackingEvent;
  replayed: boolean;
}): TrackingEventRecordOutput {
  if (input.event.idempotencyKey === null) {
    throw new Error("tracking.event.idempotency_key_missing");
  }

  return {
    organizationId: input.organizationId,
    shipmentId: input.event.shipment.id,
    event: {
      id: input.event.id,
      eventType: input.event.eventType,
      occurredAt: input.event.occurredAt.toISOString(),
      locationName: input.event.locationName,
      notes: input.event.notes,
      sourceSystem: input.event.sourceSystem,
      correlationId: input.event.correlationId,
      idempotencyKey: input.event.idempotencyKey,
    },
    shipment: {
      id: input.event.shipment.id,
      referenceCode: input.event.shipment.referenceCode,
      currentStatus: input.event.shipment.status,
    },
    idempotency: {
      key: input.event.idempotencyKey,
      replayed: input.replayed,
    },
    audit: {
      action: "tracking.event.recorded",
      subjectType: "tracking.shipment",
      subjectId: input.event.shipment.id,
    },
    outbox: {
      eventType: "tracking.event.recorded",
      aggregateType: "tracking.shipment",
      aggregateId: input.event.shipment.id,
    },
  };
}
