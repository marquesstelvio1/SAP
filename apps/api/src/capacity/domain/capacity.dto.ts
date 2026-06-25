import {
  type CapacityAdvisoryDecisionAnalyticsOutput,
  type CapacityAdvisoryDecisionRecordOutput,
  type CapacityAdvisoryOutput,
  type CapacityOverviewOutput,
  type CapacityResourceRegisterOutput,
  type CapacitySlotCancelOutput,
  type CapacitySlotOpenOutput,
  type CapacitySlotReserveOutput,
  capacityAdvisoryApprovalPermissions,
  capacityAdvisoryRecommendationTypes,
} from "@saptm/rpc";
import type {
  CapacityAdvisoryDecisionRecord,
  CapacityAdvisoryRecommendationType,
  CapacityAdvisorySeverity,
  CapacityCargoRecord,
  CapacityResourceRecord,
  CapacitySlotReservationWithSlotCargo,
  CapacitySlotStatusGroup,
  CapacitySlotWithResource,
} from "./capacity.business-rules.js";
import {
  resolveCapacityAdvisoryDecisionBusinessRules,
  resolveCapacityResourceRegisterBusinessRules,
  resolveCapacitySlotCancelBusinessRules,
  resolveCapacitySlotOpenBusinessRules,
  resolveCapacitySlotReserveBusinessRules,
} from "./capacity.business-rules.js";

type CapacityAdvisoryCandidate = CapacityAdvisoryOutput["recommendations"][number] & {
  priorityScore: number;
};

// Normalize helpers

export function normalizeCapacityCode(value: string): string {
  return value.trim().toUpperCase();
}

export function normalizeLimit(limit: number | undefined): number {
  return Math.min(Math.max(limit ?? 10, 1), 50);
}

export function normalizeAdvisoryLimit(limit: number | undefined): number {
  return Math.min(Math.max(limit ?? 5, 1), 20);
}

export function normalizeAdvisoryDecisionAnalyticsLimit(limit: number | undefined): number {
  return Math.min(Math.max(limit ?? 10, 1), 50);
}

export function normalizeAdvisoryDecisionAnalyticsWindowDays(
  windowDays: number | undefined,
): number {
  return Math.min(Math.max(windowDays ?? 30, 1), 365);
}

// Math helpers

export function calculateCapacityAdvisoryDecisionApprovalRate(
  approved: number,
  total: number,
): number {
  if (total === 0) {
    return 0;
  }

  return Math.round((approved / total) * 10_000) / 100;
}

export function calculateCapacityAvailableUnits(slot: {
  capacityUnits: number;
  reservedUnits: number;
}): number {
  return Math.max(slot.capacityUnits - slot.reservedUnits, 0);
}

export function calculateCapacityUtilizationPercent(slot: {
  capacityUnits: number;
  reservedUnits: number;
}): number {
  if (slot.capacityUnits <= 0) {
    return 100;
  }

  return Math.min(Math.round((slot.reservedUnits / slot.capacityUnits) * 1000) / 10, 100);
}

export function calculateHoursUntilWindowEnd(
  slot: { windowEndAt: Date },
  generatedAt: Date,
): number | null {
  if (slot.windowEndAt.getTime() <= generatedAt.getTime()) {
    return 0;
  }

  return Math.round(((slot.windowEndAt.getTime() - generatedAt.getTime()) / 3_600_000) * 10) / 10;
}

export function toIsoStringOrNull(value: Date | null | undefined): string | null {
  return value?.toISOString() ?? null;
}

export function toRequiredIsoString(value: Date | null | undefined): string {
  if (value === null || value === undefined) {
    throw new Error("required_date_missing");
  }

  return value.toISOString();
}

// Advisory key

export function createCapacityAdvisoryKey(
  slotId: string,
  type: CapacityAdvisoryRecommendationType,
  reservationId?: string,
): string {
  return `capacity-advisory:${type}:${slotId}${reservationId === undefined ? "" : `:${reservationId}`}`;
}

// Permission normalization

export function normalizeCapacityAdvisoryRequiredPermission(
  value: string,
): CapacityAdvisoryDecisionRecordOutput["decision"]["requiredPermission"] {
  if (
    value === "capacity.manage" ||
    value === "capacity.slot.reserve" ||
    value === "capacity.slot.cancel"
  ) {
    return value;
  }

  throw new Error("capacity.advisory_decision.required_permission_invalid");
}

// Slot status counts

export function createCapacitySlotStatusCounts(groups: CapacitySlotStatusGroup[]): {
  open: number;
  blocked: number;
  closed: number;
} {
  const counts: { open: number; blocked: number; closed: number } = {
    open: 0,
    blocked: 0,
    closed: 0,
  };

  for (const group of groups) {
    counts[group.status] = group._count._all;
  }

  return counts;
}

// Summary builders

export function createCapacityResourceSummary(
  resource: CapacityResourceRecord,
): CapacityOverviewOutput["upcomingSlots"][number]["resourceType"] extends never
  ? never
  : CapacityResourceRegisterOutput["resource"] {
  return {
    id: resource.id,
    resourceCode: resource.resourceCode,
    resourceName: resource.resourceName,
    resourceType: resource.resourceType,
    locationName: resource.locationName,
    maxConcurrentBookings: resource.maxConcurrentBookings,
    sourceSystem: resource.sourceSystem,
    createdAt: resource.createdAt.toISOString(),
    updatedAt: resource.updatedAt.toISOString(),
  };
}

export function createCapacitySlotSummary(
  slot: CapacitySlotWithResource,
): CapacityOverviewOutput["upcomingSlots"][number] {
  return {
    id: slot.id,
    resourceId: slot.resourceId,
    resourceCode: slot.resource.resourceCode,
    resourceType: slot.resource.resourceType,
    locationName: slot.resource.locationName,
    slotReference: slot.slotReference,
    windowStartAt: slot.windowStartAt.toISOString(),
    windowEndAt: slot.windowEndAt.toISOString(),
    capacityUnits: slot.capacityUnits,
    reservedUnits: slot.reservedUnits,
    availableUnits: Math.max(slot.capacityUnits - slot.reservedUnits, 0),
    status: slot.status,
    sourceSystem: slot.sourceSystem,
    createdAt: slot.createdAt.toISOString(),
    updatedAt: slot.updatedAt.toISOString(),
  };
}

export function createCapacityReservationSummary(
  reservation: CapacitySlotReservationWithSlotCargo,
): CapacityOverviewOutput["recentReservations"][number] {
  return {
    id: reservation.id,
    cargoId: reservation.cargoId,
    cargoReference: reservation.cargo.cargoReference,
    slotId: reservation.slotId,
    reservationReference: reservation.reservationReference,
    reservationPurpose: reservation.reservationPurpose,
    status: reservation.status,
    reservedUnits: reservation.reservedUnits,
    reservedByName: reservation.reservedByName,
    reservedAt: reservation.reservedAt.toISOString(),
    cancellationReference: reservation.cancellationReference,
    cancelledByName: reservation.cancelledByName,
    cancellationReason: reservation.cancellationReason,
    cancelledAt: toIsoStringOrNull(reservation.cancelledAt),
    sourceSystem: reservation.sourceSystem,
    createdAt: reservation.createdAt.toISOString(),
    updatedAt: reservation.updatedAt.toISOString(),
  };
}

export function createCapacityCargoSummary(
  cargo: CapacityCargoRecord,
): CapacitySlotReserveOutput["cargo"] {
  return {
    id: cargo.id,
    cargoReference: cargo.cargoReference,
    cargoDescription: cargo.cargoDescription,
    status: cargo.status,
    custodyOwnerName: cargo.custodyOwnerName,
  };
}

export function createCapacityAdvisoryDecisionSummary(
  decision: CapacityAdvisoryDecisionRecord,
): CapacityAdvisoryDecisionRecordOutput["decision"] {
  return {
    id: decision.id,
    recommendationId: decision.recommendationId,
    recommendationType: decision.recommendationType,
    decisionStatus: decision.decisionStatus,
    decidedByName: decision.decidedByName,
    decisionReason: decision.decisionReason,
    approvalReference: decision.approvalReference,
    requiredPermission: normalizeCapacityAdvisoryRequiredPermission(decision.requiredPermission),
    slotId: decision.slotId,
    reservationId: decision.reservationId,
    sourceSystem: decision.sourceSystem,
    decidedAt: decision.decidedAt.toISOString(),
    createdAt: decision.createdAt.toISOString(),
    updatedAt: decision.updatedAt.toISOString(),
  };
}

// Output builders

export function createCapacityResourceRegisterOutput(input: {
  organizationId: string;
  resource: CapacityResourceRecord;
  replayed: boolean;
  businessRules?: CapacityResourceRegisterOutput["businessRules"];
}): CapacityResourceRegisterOutput {
  if (input.resource.recordIdempotencyKey === null) {
    throw new Error("capacity.resource.idempotency_key_missing");
  }

  return {
    organizationId: input.organizationId,
    resourceId: input.resource.id,
    resource: createCapacityResourceSummary(input.resource),
    businessRules:
      input.businessRules ??
      resolveCapacityResourceRegisterBusinessRules(null, {
        organizationId: input.organizationId,
        resourceCode: input.resource.resourceCode,
        resourceName: input.resource.resourceName,
        resourceType: input.resource.resourceType,
        locationName: input.resource.locationName,
        maxConcurrentBookings: input.resource.maxConcurrentBookings,
        idempotencyKey: input.resource.recordIdempotencyKey,
        sourceSystem: input.resource.sourceSystem,
      }),
    idempotency: {
      key: input.resource.recordIdempotencyKey,
      replayed: input.replayed,
    },
    audit: {
      action: "capacity.resource.registered",
      subjectType: "capacity_resource",
      subjectId: input.resource.id,
    },
    outbox: {
      eventType: "capacity.resource.registered",
      aggregateType: "capacity",
      aggregateId: input.resource.id,
    },
  };
}

export function createCapacitySlotOpenOutput(input: {
  organizationId: string;
  resource: CapacityResourceRecord;
  slot: CapacitySlotWithResource;
  replayed: boolean;
  businessRules?: CapacitySlotOpenOutput["businessRules"];
}): CapacitySlotOpenOutput {
  if (input.slot.recordIdempotencyKey === null) {
    throw new Error("capacity.slot.idempotency_key_missing");
  }

  return {
    organizationId: input.organizationId,
    resourceId: input.resource.id,
    slotId: input.slot.id,
    resource: createCapacityResourceSummary(input.resource),
    slot: createCapacitySlotSummary(input.slot),
    businessRules:
      input.businessRules ??
      resolveCapacitySlotOpenBusinessRules(input.resource, null, {
        organizationId: input.organizationId,
        resourceId: input.resource.id,
        slotReference: input.slot.slotReference,
        windowStartAt: input.slot.windowStartAt.toISOString(),
        windowEndAt: input.slot.windowEndAt.toISOString(),
        capacityUnits: input.slot.capacityUnits,
        idempotencyKey: input.slot.recordIdempotencyKey,
        sourceSystem: input.slot.sourceSystem,
      }),
    idempotency: {
      key: input.slot.recordIdempotencyKey,
      replayed: input.replayed,
    },
    audit: {
      action: "capacity.slot.opened",
      subjectType: "capacity_slot",
      subjectId: input.slot.id,
    },
    outbox: {
      eventType: "capacity.slot.opened",
      aggregateType: "capacity",
      aggregateId: input.slot.id,
    },
  };
}

export function createCapacitySlotReserveOutput(input: {
  organizationId: string;
  reservation: CapacitySlotReservationWithSlotCargo;
  replayed: boolean;
  businessRules?: CapacitySlotReserveOutput["businessRules"];
}): CapacitySlotReserveOutput {
  if (input.reservation.reserveIdempotencyKey === null) {
    throw new Error("capacity.reservation.reserve_idempotency_key_missing");
  }

  return {
    organizationId: input.organizationId,
    cargoId: input.reservation.cargoId,
    slotId: input.reservation.slotId,
    reservationId: input.reservation.id,
    cargo: createCapacityCargoSummary(input.reservation.cargo),
    resource: createCapacityResourceSummary(input.reservation.slot.resource),
    slot: createCapacitySlotSummary(input.reservation.slot),
    reservation: createCapacityReservationSummary(input.reservation),
    businessRules:
      input.businessRules ??
      resolveCapacitySlotReserveBusinessRules({
        cargo: input.reservation.cargo,
        slot: input.reservation.slot,
        duplicateReference: null,
        duplicateCargoSlot: null,
        input: {
          organizationId: input.organizationId,
          cargoId: input.reservation.cargoId,
          slotId: input.reservation.slotId,
          reservationReference: input.reservation.reservationReference,
          reservationPurpose: input.reservation.reservationPurpose,
          reservedUnits: input.reservation.reservedUnits,
          reservedByName: input.reservation.reservedByName,
          reservedAt: input.reservation.reservedAt.toISOString(),
          idempotencyKey: input.reservation.reserveIdempotencyKey,
          sourceSystem: input.reservation.sourceSystem,
        },
      }),
    idempotency: {
      key: input.reservation.reserveIdempotencyKey,
      replayed: input.replayed,
    },
    audit: {
      action: "capacity.slot.reserved",
      subjectType: "capacity_slot_reservation",
      subjectId: input.reservation.id,
    },
    outbox: {
      eventType: "capacity.slot.reserved",
      aggregateType: "capacity",
      aggregateId: input.reservation.id,
    },
  };
}

export function createCapacitySlotCancelOutput(input: {
  organizationId: string;
  reservation: CapacitySlotReservationWithSlotCargo;
  replayed: boolean;
  businessRules?: CapacitySlotCancelOutput["businessRules"];
}): CapacitySlotCancelOutput {
  if (input.reservation.cancelIdempotencyKey === null) {
    throw new Error("capacity.reservation.cancel_idempotency_key_missing");
  }

  return {
    organizationId: input.organizationId,
    cargoId: input.reservation.cargoId,
    slotId: input.reservation.slotId,
    reservationId: input.reservation.id,
    cargo: createCapacityCargoSummary(input.reservation.cargo),
    resource: createCapacityResourceSummary(input.reservation.slot.resource),
    slot: createCapacitySlotSummary(input.reservation.slot),
    reservation: createCapacityReservationSummary(input.reservation),
    businessRules:
      input.businessRules ??
      resolveCapacitySlotCancelBusinessRules(input.reservation, {
        organizationId: input.organizationId,
        reservationId: input.reservation.id,
        cancellationReference: input.reservation.cancellationReference ?? "REPLAY-CANCEL",
        cancelledByName: input.reservation.cancelledByName ?? "Replay",
        cancellationReason: input.reservation.cancellationReason ?? "Replay",
        cancelledAt: toRequiredIsoString(input.reservation.cancelledAt),
        idempotencyKey: input.reservation.cancelIdempotencyKey,
        sourceSystem: input.reservation.sourceSystem,
      }),
    idempotency: {
      key: input.reservation.cancelIdempotencyKey,
      replayed: input.replayed,
    },
    audit: {
      action: "capacity.slot_reservation.cancelled",
      subjectType: "capacity_slot_reservation",
      subjectId: input.reservation.id,
    },
    outbox: {
      eventType: "capacity.slot_reservation.cancelled",
      aggregateType: "capacity",
      aggregateId: input.reservation.id,
    },
  };
}

export function createCapacityAdvisoryDecisionRecordOutput(input: {
  organizationId: string;
  decision: CapacityAdvisoryDecisionRecord;
  replayed: boolean;
  businessRules?: CapacityAdvisoryDecisionRecordOutput["businessRules"];
}): CapacityAdvisoryDecisionRecordOutput {
  if (input.decision.decisionIdempotencyKey === null) {
    throw new Error("capacity.advisory_decision.idempotency_key_missing");
  }

  return {
    organizationId: input.organizationId,
    decisionId: input.decision.id,
    decision: createCapacityAdvisoryDecisionSummary(input.decision),
    businessRules:
      input.businessRules ??
      resolveCapacityAdvisoryDecisionBusinessRules({
        existingDecision: null,
        slot: {
          id: input.decision.slotId ?? "replay-slot",
          organizationId: input.organizationId,
          resourceId: "replay-resource",
          slotReference: "REPLAY-SLOT",
          windowStartAt: input.decision.decidedAt,
          windowEndAt: input.decision.decidedAt,
          capacityUnits: 1,
          reservedUnits: 0,
          status: "open",
          sourceSystem: input.decision.sourceSystem,
          recordIdempotencyKey: "replay",
          createdAt: input.decision.createdAt,
          updatedAt: input.decision.updatedAt,
          resource: {
            id: "replay-resource",
            organizationId: input.organizationId,
            resourceCode: "REPLAY",
            resourceName: "Replay",
            resourceType: "terminal",
            locationName: "Replay",
            maxConcurrentBookings: 1,
            sourceSystem: input.decision.sourceSystem,
            recordIdempotencyKey: "replay",
            createdAt: input.decision.createdAt,
            updatedAt: input.decision.updatedAt,
          },
        },
        reservation: null,
        input: {
          recommendationId: input.decision.recommendationId,
          recommendationType: input.decision.recommendationType,
          decisionStatus: input.decision.decisionStatus,
          decidedByName: input.decision.decidedByName,
          decisionReason: input.decision.decisionReason,
          ...(input.decision.approvalReference === null
            ? {}
            : { approvalReference: input.decision.approvalReference }),
          requiredPermission: normalizeCapacityAdvisoryRequiredPermission(
            input.decision.requiredPermission,
          ),
          ...(input.decision.slotId === null ? {} : { slotId: input.decision.slotId }),
          ...(input.decision.reservationId === null
            ? {}
            : { reservationId: input.decision.reservationId }),
          decidedAt: input.decision.decidedAt.toISOString(),
          idempotencyKey: input.decision.decisionIdempotencyKey,
          sourceSystem: input.decision.sourceSystem,
        },
      }),
    idempotency: {
      key: input.decision.decisionIdempotencyKey,
      replayed: input.replayed,
    },
    audit: {
      action: "capacity.advisory.decision.recorded",
      subjectType: "capacity_advisory_decision",
      subjectId: input.decision.id,
    },
    outbox: {
      eventType: "capacity.advisory.decision.recorded",
      aggregateType: "capacity",
      aggregateId: input.decision.id,
    },
  };
}

export function createCapacityAdvisoryDecisionAnalyticsOutput(input: {
  organizationId: string;
  generatedAt: Date;
  windowStartedAt: Date;
  windowDays: number;
  decisions: readonly CapacityAdvisoryDecisionRecord[];
  limit: number;
}): CapacityAdvisoryDecisionAnalyticsOutput {
  return {
    generatedAt: input.generatedAt.toISOString(),
    organizationId: input.organizationId,
    window: {
      startedAt: input.windowStartedAt.toISOString(),
      endedAt: input.generatedAt.toISOString(),
      windowDays: input.windowDays,
    },
    totals: {
      ...createCapacityAdvisoryDecisionAnalyticsGroup(input.decisions),
      decisionsWithApprovalReference: input.decisions.filter(
        (decision) => decision.approvalReference !== null,
      ).length,
      decisionsRequiringOperationalPermission: input.decisions.filter(
        (decision) => decision.requiredPermission.trim().length > 0,
      ).length,
    },
    byRecommendationType: createCapacityAdvisoryDecisionRecommendationTypeGroups(input.decisions),
    byRequiredPermission: createCapacityAdvisoryDecisionRequiredPermissionGroups(input.decisions),
    recentDecisions: input.decisions
      .slice(0, input.limit)
      .map(createCapacityAdvisoryDecisionSummary),
    governance: {
      readOnly: true,
      automationAllowed: false,
      humanApprovalRequired: true,
      source: "capacity_advisory_decision_analytics",
    },
  };
}

function createCapacityAdvisoryDecisionAnalyticsGroup(
  decisions: readonly CapacityAdvisoryDecisionRecord[],
) {
  const approved = decisions.filter((decision) => decision.decisionStatus === "approved").length;
  const rejected = decisions.filter((decision) => decision.decisionStatus === "rejected").length;
  const total = decisions.length;

  return {
    decisions: total,
    approved,
    rejected,
    approvalRatePercent: calculateCapacityAdvisoryDecisionApprovalRate(approved, total),
  };
}

function createCapacityAdvisoryDecisionRecommendationTypeGroups(
  decisions: readonly CapacityAdvisoryDecisionRecord[],
): CapacityAdvisoryDecisionAnalyticsOutput["byRecommendationType"] {
  return capacityAdvisoryRecommendationTypes
    .map((recommendationType) => {
      const groupDecisions = decisions.filter(
        (decision) => decision.recommendationType === recommendationType,
      );

      return {
        recommendationType,
        ...createCapacityAdvisoryDecisionAnalyticsGroup(groupDecisions),
      };
    })
    .filter((group) => group.decisions > 0);
}

function createCapacityAdvisoryDecisionRequiredPermissionGroups(
  decisions: readonly CapacityAdvisoryDecisionRecord[],
): CapacityAdvisoryDecisionAnalyticsOutput["byRequiredPermission"] {
  return capacityAdvisoryApprovalPermissions
    .map((requiredPermission) => {
      const groupDecisions = decisions.filter(
        (decision) =>
          normalizeCapacityAdvisoryRequiredPermission(decision.requiredPermission) ===
          requiredPermission,
      );

      return {
        requiredPermission,
        ...createCapacityAdvisoryDecisionAnalyticsGroup(groupDecisions),
      };
    })
    .filter((group) => group.decisions > 0);
}

// Advisory recommendations

export function createCapacityAdvisoryRecommendations(input: {
  slots: readonly CapacitySlotWithResource[];
  reservations: readonly CapacitySlotReservationWithSlotCargo[];
  generatedAt: Date;
  limit: number;
}): CapacityAdvisoryOutput["recommendations"] {
  const candidates: CapacityAdvisoryCandidate[] = [];
  const recommendationKeys = new Set<string>();
  const activeReservationsBySlot = new Map<string, CapacitySlotReservationWithSlotCargo[]>();
  const cancelledReservationsByResource = new Map<string, CapacitySlotReservationWithSlotCargo[]>();

  for (const reservation of input.reservations) {
    if (reservation.status === "reserved") {
      const reservations = activeReservationsBySlot.get(reservation.slotId) ?? [];
      reservations.push(reservation);
      activeReservationsBySlot.set(reservation.slotId, reservations);
    }

    if (reservation.status === "cancelled") {
      const reservations = cancelledReservationsByResource.get(reservation.slot.resourceId) ?? [];
      reservations.push(reservation);
      cancelledReservationsByResource.set(reservation.slot.resourceId, reservations);
    }
  }

  for (const slot of input.slots) {
    const utilizationPercent = calculateCapacityUtilizationPercent(slot);
    const availableUnits = calculateCapacityAvailableUnits(slot);
    const hoursUntilWindowEnd = calculateHoursUntilWindowEnd(slot, input.generatedAt);

    if (utilizationPercent >= 85) {
      candidates.push(
        createCapacityAdvisoryCandidate({
          type: "slot_saturation",
          severity: utilizationPercent >= 100 ? "critical" : "high",
          title: "Rever saturacao de slot operacional",
          rationale:
            "O slot esta proximo do limite de capacidade e pode bloquear novas reservas se nao houver replaneamento.",
          recommendedAction:
            "Abrir capacidade adicional, redistribuir reservas ou aprovar cancelamento/reallocacao pelo fluxo governado.",
          slot,
          reservation: null,
          approvalRequiredFor: "capacity.manage",
          confidenceScore: utilizationPercent >= 100 ? 0.9 : 0.84,
          priorityScore: utilizationPercent >= 100 ? 100 : 88,
          generatedAt: input.generatedAt,
        }),
      );
      recommendationKeys.add(createCapacityAdvisoryKey(slot.id, "slot_saturation"));
    }

    if (availableUnits > 0 && hoursUntilWindowEnd !== null && hoursUntilWindowEnd <= 24) {
      if (!recommendationKeys.has(createCapacityAdvisoryKey(slot.id, "expiring_slot"))) {
        candidates.push(
          createCapacityAdvisoryCandidate({
            type: "expiring_slot",
            severity: hoursUntilWindowEnd <= 6 ? "high" : "medium",
            title: "Aproveitar capacidade antes do fecho da janela",
            rationale:
              "O slot ainda tem unidades livres e a janela operacional termina em menos de 24 horas.",
            recommendedAction:
              "Priorizar reservas elegiveis ou fechar decisao de nao uso com owner operacional antes do fim da janela.",
            slot,
            reservation: null,
            approvalRequiredFor: "capacity.slot.reserve",
            confidenceScore: hoursUntilWindowEnd <= 6 ? 0.82 : 0.74,
            priorityScore: hoursUntilWindowEnd <= 6 ? 82 : 62,
            generatedAt: input.generatedAt,
          }),
        );
      }
    }

    if (
      slot.capacityUnits >= 4 &&
      utilizationPercent <= 25 &&
      slot.windowEndAt.getTime() > input.generatedAt.getTime()
    ) {
      candidates.push(
        createCapacityAdvisoryCandidate({
          type: "unused_capacity",
          severity: "low",
          title: "Rever capacidade aberta com baixa utilizacao",
          rationale:
            "O slot possui capacidade relevante aberta, mas baixa ocupacao para a janela operacional atual.",
          recommendedAction:
            "Confirmar procura pendente, consolidar slots ou reduzir capacidade aberta antes de nova liberacao.",
          slot,
          reservation: null,
          approvalRequiredFor: "capacity.manage",
          confidenceScore: 0.68,
          priorityScore: 38,
          generatedAt: input.generatedAt,
        }),
      );
    }
  }

  for (const [slotId, reservations] of activeReservationsBySlot.entries()) {
    const slot = reservations[0]?.slot;

    if (slot === undefined || reservations.length < 3) {
      continue;
    }

    const slotUtilizationPercent = calculateCapacityUtilizationPercent(slot);

    if (slotUtilizationPercent < 70) {
      continue;
    }

    candidates.push(
      createCapacityAdvisoryCandidate({
        type: "reservation_imbalance",
        severity: slotUtilizationPercent >= 90 ? "high" : "medium",
        title: "Balancear reservas concentradas no mesmo slot",
        rationale:
          "Multiplas reservas ativas estao concentradas no mesmo slot com ocupacao elevada, aumentando risco de gargalo.",
        recommendedAction:
          "Rever prioridades das cargas, redistribuir reservas elegiveis e aprovar mudancas apenas por comando governado.",
        slot,
        reservation: reservations[0] ?? null,
        approvalRequiredFor: "capacity.slot.reserve",
        confidenceScore: 0.76,
        priorityScore: slotUtilizationPercent >= 90 ? 86 : 70,
        generatedAt: input.generatedAt,
      }),
    );
    recommendationKeys.add(createCapacityAdvisoryKey(slotId, "reservation_imbalance"));
  }

  for (const reservations of cancelledReservationsByResource.values()) {
    if (reservations.length < 2) {
      continue;
    }

    const reservation = reservations[0];

    if (reservation === undefined) {
      continue;
    }

    candidates.push(
      createCapacityAdvisoryCandidate({
        type: "cancellation_review",
        severity: "medium",
        title: "Investigar cancelamentos recorrentes por recurso",
        rationale:
          "Cancelamentos recentes no mesmo recurso podem indicar indisponibilidade, janela mal dimensionada ou mudanca operacional recorrente.",
        recommendedAction:
          "Validar causa raiz com operacoes e ajustar abertura de slots antes de novas reservas.",
        slot: reservation.slot,
        reservation,
        approvalRequiredFor: "capacity.slot.cancel",
        confidenceScore: 0.72,
        priorityScore: 58,
        generatedAt: input.generatedAt,
      }),
    );
  }

  return candidates
    .sort((left, right) => right.priorityScore - left.priorityScore)
    .slice(0, input.limit)
    .map(({ priorityScore: _priorityScore, ...recommendation }) => recommendation);
}

function createCapacityAdvisoryCandidate(input: {
  type: CapacityAdvisoryRecommendationType;
  severity: CapacityAdvisorySeverity;
  title: string;
  rationale: string;
  recommendedAction: string;
  slot: CapacitySlotWithResource;
  reservation: CapacitySlotReservationWithSlotCargo | null;
  approvalRequiredFor: CapacityAdvisoryOutput["recommendations"][number]["approvalRequiredFor"];
  confidenceScore: number;
  priorityScore: number;
  generatedAt: Date;
}): CapacityAdvisoryCandidate {
  const hoursUntilWindowEnd = calculateHoursUntilWindowEnd(input.slot, input.generatedAt);

  return {
    id: createCapacityAdvisoryKey(input.slot.id, input.type, input.reservation?.id),
    type: input.type,
    severity: input.severity,
    title: input.title,
    rationale: input.rationale,
    recommendedAction: input.recommendedAction,
    slot: createCapacitySlotSummary(input.slot),
    reservation:
      input.reservation === null ? null : createCapacityReservationSummary(input.reservation),
    metrics: {
      utilizationPercent: calculateCapacityUtilizationPercent(input.slot),
      availableUnits: calculateCapacityAvailableUnits(input.slot),
      hoursUntilWindowEnd,
    },
    humanApprovalRequired: true,
    approvalRequiredFor: input.approvalRequiredFor,
    confidenceScore: input.confidenceScore,
    source: "rule_based_capacity_optimizer",
    priorityScore: input.priorityScore,
  };
}
