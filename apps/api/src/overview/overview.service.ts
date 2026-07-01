import { Inject, Injectable } from "@nestjs/common";
import type {
  ComplianceOverviewOutput,
  DeliveryOverviewOutput,
  DispatchOverviewOutput,
  ExceptionOverviewOutput,
} from "@saptm/rpc";
import {
  cargoComplianceEvidenceStatuses,
  cargoDeliveryExceptionStatuses,
  cargoStatuses,
  trackingExceptionWorkflowStates,
} from "@saptm/rpc";

import { CARGO_REPOSITORY, type CargoRepository } from "../cargo/domain/cargo.repository.js";
import {
  createCargoComplianceEvidenceSummary,
  createCargoDeliveryExceptionSummary,
  createCargoSummary,
} from "../cargo/domain/dto.js";
import { createTransportOrderSummary } from "../planning/domain/planning.dto.js";
import {
  PLANNING_REPOSITORY,
  type PlanningRepository,
} from "../planning/domain/planning.repository.js";
import {
  TRACKING_REPOSITORY,
  type TrackingRepository,
} from "../tracking/domain/tracking.repository.js";

export type GetOverviewInput = {
  organizationId: string;
  limit?: number;
  offset?: number;
  generatedAt?: Date;
};

@Injectable()
export class OverviewService {
  constructor(
    @Inject(CARGO_REPOSITORY) private readonly cargoRepo: CargoRepository,
    @Inject(PLANNING_REPOSITORY) private readonly planningRepo: PlanningRepository,
    @Inject(TRACKING_REPOSITORY) private readonly trackingRepo: TrackingRepository,
  ) {}

  async getComplianceOverview(input: GetOverviewInput): Promise<ComplianceOverviewOutput> {
    const limit = normalizeLimit(input.limit);
    const offset = input.offset ?? 0;
    const data = await this.cargoRepo.getComplianceEvidenceOverview(
      input.organizationId,
      limit,
      offset,
    );
    const statusCounts = createComplianceStatusCounts(data.statusGroups);
    const typeCounts = createComplianceTypeCounts(data.typeGroups);

    return {
      generatedAt: (input.generatedAt ?? new Date()).toISOString(),
      organizationId: input.organizationId,
      totals: {
        evidence: data.totalCount,
        pendingReview: readStatusCount(statusCounts, "pending_review"),
        approved: readStatusCount(statusCounts, "approved"),
        rejected: readStatusCount(statusCounts, "rejected"),
        expiringWithin7Days: data.expiringCount,
        expired: data.expiredCount,
      },
      statusCounts,
      evidenceTypeCounts: typeCounts,
      recentEvidence: data.recentEvidence.map(createCargoComplianceEvidenceSummary),
      pagination: {
        totalCount: data.totalCount,
        limit,
        offset,
      },
    };
  }

  async getDispatchOverview(input: GetOverviewInput): Promise<DispatchOverviewOutput> {
    const limit = normalizeLimit(input.limit);
    const offset = input.offset ?? 0;
    const now = input.generatedAt ?? new Date();
    const [dispatchable, dispatched, upcomingDepartures, recentOrders] = await Promise.all([
      this.planningRepo.countDispatchableOrders(input.organizationId, now),
      this.planningRepo.countDispatchedOrders(input.organizationId),
      this.planningRepo.countUpcomingDepartures(input.organizationId, now),
      this.planningRepo.findRecentDispatchableOrders(input.organizationId, limit, offset, now),
    ]);

    return {
      generatedAt: now.toISOString(),
      organizationId: input.organizationId,
      totals: {
        dispatchable,
        dispatched,
        upcomingDepartures,
      },
      recentDispatchableOrders: recentOrders.map(createTransportOrderSummary),
      pagination: {
        totalCount: dispatchable,
        limit,
        offset,
      },
    };
  }

  async getExceptionOverview(input: GetOverviewInput): Promise<ExceptionOverviewOutput> {
    const limit = normalizeLimit(input.limit);
    const offset = input.offset ?? 0;
    const [cargoStatusGroups, cargoExceptions, trackingExceptionEvents, trackingStatusGroups] =
      await Promise.all([
        this.cargoRepo.countDeliveryExceptionsByStatus(input.organizationId),
        this.cargoRepo.findRecentDeliveryExceptions(input.organizationId, limit, offset),
        this.trackingRepo.countExceptionEvents(input.organizationId),
        this.trackingRepo.countShipmentsByStatus(input.organizationId),
      ]);

    const cargoStatusCounts = createCargoDeliveryExceptionStatusCounts(cargoStatusGroups);
    const openCargoDeliveryExceptions = readCargoExceptionStatusCount(cargoStatusCounts, "open");
    const totalCargoDeliveryExceptions = cargoStatusCounts.reduce(
      (total, item) => total + item.count,
      0,
    );

    const trackingExceptionEventsTotal = trackingExceptionEvents.reduce(
      (total, item) => total + item._count._all,
      0,
    );

    const trackingStatusCountMap = new Map(
      trackingStatusGroups.map((g) => [g.status, g._count._all]),
    );
    const trackingExceptionShipments = trackingStatusCountMap.get("exception") ?? 0;

    const recentTrackingExceptions = await this.trackingRepo.findRecentExceptionEvents(
      input.organizationId,
      limit,
      offset,
    );

    return {
      generatedAt: (input.generatedAt ?? new Date()).toISOString(),
      organizationId: input.organizationId,
      totals: {
        cargoDeliveryExceptions: totalCargoDeliveryExceptions,
        openCargoDeliveryExceptions,
        trackingExceptionEvents: trackingExceptionEventsTotal,
        trackingExceptionShipments,
      },
      statusCounts: {
        cargo: cargoStatusCounts,
        tracking: createTrackingExceptionStatusCounts(),
      },
      recentCargoDeliveryExceptions: cargoExceptions.map(createCargoDeliveryExceptionSummary),
      recentTrackingExceptions: recentTrackingExceptions.map((event) =>
        createTrackingExceptionSummary(event),
      ),
      pagination: {
        totalCount: totalCargoDeliveryExceptions + trackingExceptionEventsTotal,
        limit,
        offset,
      },
    };
  }

  async getDeliveryOverview(input: GetOverviewInput): Promise<DeliveryOverviewOutput> {
    const limit = normalizeLimit(input.limit);
    const offset = input.offset ?? 0;
    const data = await this.cargoRepo.getOverview(input.organizationId, limit, offset);
    const statusCounts = createCargoStatusCounts([...data.statusGroups]);

    return {
      generatedAt: (input.generatedAt ?? new Date()).toISOString(),
      organizationId: input.organizationId,
      totals: {
        delivered: readCargoStatusCount(statusCounts, "delivered"),
        inTransport: readCargoStatusCount(statusCounts, "in_transport"),
        arrived: readCargoStatusCount(statusCounts, "held"),
        readyForTransport: readCargoStatusCount(statusCounts, "ready_for_transport"),
        exceptions: readCargoStatusCount(statusCounts, "held"),
      },
      statusCounts,
      recentDeliveries: data.recentCargo.map(createCargoSummary),
      pagination: {
        totalCount: data.totalCount,
        limit,
        offset,
      },
    };
  }
}

function normalizeLimit(limit: number | undefined): number {
  return Math.min(Math.max(limit ?? 10, 1), 50);
}

function createComplianceStatusCounts(
  groups: { status: string; count: number }[],
): ComplianceOverviewOutput["statusCounts"] {
  const countByStatus = new Map(groups.map((g) => [g.status, g.count]));

  return cargoComplianceEvidenceStatuses.map((status) => ({
    status,
    count: countByStatus.get(status) ?? 0,
  }));
}

function createComplianceTypeCounts(
  groups: { evidenceType: string; count: number }[],
): ComplianceOverviewOutput["evidenceTypeCounts"] {
  const countByType = new Map(groups.map((g) => [g.evidenceType, g.count]));

  return [
    "bill_of_lading",
    "customs_declaration",
    "inspection_certificate",
    "hazardous_goods_declaration",
    "packing_list",
    "insurance_certificate",
    "release_authorization",
    "other",
  ].map((evidenceType) => ({
    evidenceType:
      evidenceType as ComplianceOverviewOutput["evidenceTypeCounts"][number]["evidenceType"],
    count: countByType.get(evidenceType) ?? 0,
  }));
}

function readStatusCount(
  statusCounts: ComplianceOverviewOutput["statusCounts"],
  status: ComplianceOverviewOutput["statusCounts"][number]["status"],
): number {
  return statusCounts.find((item) => item.status === status)?.count ?? 0;
}

function createCargoDeliveryExceptionStatusCounts(
  groups: { status: string; count: number }[],
): ExceptionOverviewOutput["statusCounts"]["cargo"] {
  const countByStatus = new Map(groups.map((g) => [g.status, g.count]));

  return cargoDeliveryExceptionStatuses.map((status) => ({
    status,
    count: countByStatus.get(status) ?? 0,
  }));
}

function readCargoExceptionStatusCount(
  statusCounts: ExceptionOverviewOutput["statusCounts"]["cargo"],
  status: ExceptionOverviewOutput["statusCounts"]["cargo"][number]["status"],
): number {
  return statusCounts.find((item) => item.status === status)?.count ?? 0;
}

function createTrackingExceptionStatusCounts(): ExceptionOverviewOutput["statusCounts"]["tracking"] {
  return trackingExceptionWorkflowStates.map((status) => ({
    status,
    count: 0,
  }));
}

function createTrackingExceptionSummary(
  event: Awaited<ReturnType<TrackingRepository["findRecentExceptionEvents"]>>[number],
): ExceptionOverviewOutput["recentTrackingExceptions"][number] {
  const payload = (event.payload ?? {}) as Record<string, unknown>;
  const category =
    typeof payload.category === "string"
      ? payload.category
      : typeof payload.eventCategory === "string"
        ? payload.eventCategory
        : null;
  const severity =
    typeof payload.severity === "string"
      ? payload.severity
      : typeof payload.eventSeverity === "string"
        ? payload.eventSeverity
        : null;
  const summary =
    typeof payload.summary === "string"
      ? payload.summary
      : typeof payload.eventSummary === "string"
        ? payload.eventSummary
        : null;
  const workflowState =
    typeof payload.workflowState === "string"
      ? payload.workflowState
      : typeof payload.state === "string"
        ? payload.state
        : null;

  return {
    id: event.id,
    shipmentId: event.shipment.id,
    referenceCode: event.shipment.referenceCode,
    transportMode: event.shipment
      .transportMode as ExceptionOverviewOutput["recentTrackingExceptions"][number]["transportMode"],
    eventType:
      event.eventType as ExceptionOverviewOutput["recentTrackingExceptions"][number]["eventType"],
    category,
    severity,
    summary,
    workflowState:
      workflowState as ExceptionOverviewOutput["recentTrackingExceptions"][number]["workflowState"],
    occurredAt: event.occurredAt.toISOString(),
    locationName: event.locationName,
  };
}

function createCargoStatusCounts(
  groups: { status: string; _count: { _all: number } }[],
): DeliveryOverviewOutput["statusCounts"] {
  const countByStatus = new Map(groups.map((g) => [g.status, g._count._all]));

  return cargoStatuses.map((status) => ({
    status,
    count: countByStatus.get(status) ?? 0,
  }));
}

function readCargoStatusCount(
  statusCounts: DeliveryOverviewOutput["statusCounts"],
  status: DeliveryOverviewOutput["statusCounts"][number]["status"],
): number {
  return statusCounts.find((item) => item.status === status)?.count ?? 0;
}
