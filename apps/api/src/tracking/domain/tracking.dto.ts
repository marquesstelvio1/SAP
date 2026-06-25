import type {
  TrackingAdvisoryOutput,
  TrackingAnalyticsOutput,
  TrackingEventPayload,
  TrackingEventRecordOutput,
  TrackingExceptionManageOutput,
  TrackingExceptionResolveOutput,
  TrackingOverviewOutput,
} from "@saptm/rpc";
import {
  trackingEventTypes,
  trackingExceptionWorkflowStates,
  trackingShipmentStatuses,
  trackingTransportModes,
} from "@saptm/rpc";
import type {
  TrackingAdvisoryRecommendationType,
  TrackingAdvisorySeverity,
  TrackingApprovalStatus,
  TrackingEventType,
  TrackingExceptionCategory,
  TrackingExceptionEventType,
  TrackingExceptionResolutionCode,
  TrackingExceptionResolutionStatus,
  TrackingExceptionSeverity,
  TrackingExceptionWorkflowState,
  TrackingOperatorEvidenceType,
  TrackingShipmentStatus,
  TrackingTransportMode,
} from "./tracking.business-rules.js";
import {
  isTrackingApprovalStatus,
  isTrackingExceptionCategory,
  isTrackingExceptionResolutionCode,
  isTrackingExceptionResolutionStatus,
  isTrackingExceptionSeverity,
  isTrackingExceptionWorkflowState,
  isTrackingOperatorEvidenceType,
  isTrackingShipmentStatus,
  resolveManagedExceptionOutputEventType,
  resolveManagedExceptionWorkflowState,
} from "./tracking.business-rules.js";

export type ExistingTrackingEvent = {
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

export type TrackingStatusGroup = {
  status: TrackingShipmentStatus;
  _count: {
    _all: number;
  };
};

export type TrackingModeStatusGroup = TrackingStatusGroup & {
  transportMode: TrackingTransportMode;
};

export type TrackingEventTypeGroup = {
  eventType: TrackingEventType;
  _count: {
    _all: number;
  };
  _max: {
    occurredAt: Date | null;
  };
};

export type TrackingWorkflowEvent = {
  payload: unknown;
};

export type TrackingAdvisoryShipment = {
  id: string;
  referenceCode: string;
  cargoDescription: string;
  transportMode: TrackingTransportMode;
  status: TrackingShipmentStatus;
  priority: number;
  estimatedArrivalAt: Date | null;
  updatedAt: Date;
};

export type TrackingAdvisoryCandidate = TrackingAdvisoryOutput["recommendations"][number] & {
  priorityScore: number;
};

// Normalize functions

export function normalizeLimit(limit: number | undefined): number {
  if (limit === undefined) {
    return 10;
  }

  return Math.min(Math.max(limit, 1), 50);
}

export function normalizeLookbackDays(lookbackDays: number | undefined): number {
  if (lookbackDays === undefined) {
    return 30;
  }

  return Math.min(Math.max(lookbackDays, 1), 90);
}

export function normalizeAdvisoryLimit(limit: number | undefined): number {
  if (limit === undefined) {
    return 5;
  }

  return Math.min(Math.max(limit, 1), 20);
}

export function normalizeEventLimit(limit: number | undefined): number {
  if (limit === undefined) {
    return 50;
  }

  return Math.min(Math.max(limit, 1), 100);
}

// Advisory functions

export function createAdvisoryKey(
  shipmentId: string,
  type: TrackingAdvisoryRecommendationType,
): string {
  return `tracking-advisory:${type}:${shipmentId}`;
}

export function createTrackingAdvisoryCandidate(input: {
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

export function createTrackingAdvisoryRecommendations(input: {
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

    if (shipment !== undefined) {
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
  }

  return candidates
    .sort((left, right) => right.priorityScore - left.priorityScore)
    .slice(0, input.limit)
    .map(({ priorityScore: _priorityScore, ...recommendation }) => recommendation);
}

// Status count helpers

export function createStatusCounts(
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

export function sumStatusCounts(statusCounts: TrackingOverviewOutput["statusCounts"]): number {
  return statusCounts.reduce((total, item) => total + item.count, 0);
}

export function sumActiveShipments(statusCounts: TrackingOverviewOutput["statusCounts"]): number {
  const terminalStatuses = new Set<TrackingShipmentStatus>(["completed", "cancelled"]);

  return statusCounts.reduce(
    (total, item) => (terminalStatuses.has(item.status) ? total : total + item.count),
    0,
  );
}

export function readStatusCount(
  statusCounts: TrackingOverviewOutput["statusCounts"],
  status: TrackingShipmentStatus,
): number {
  return statusCounts.find((item) => item.status === status)?.count ?? 0;
}

// Mode distribution

export function createModeStatusKey(
  transportMode: TrackingTransportMode,
  status: TrackingShipmentStatus,
): string {
  return `${transportMode}:${status}`;
}

export function createModeDistribution(
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
      delayedShipments: readStatusCount(statusCounts, "delayed" as TrackingShipmentStatus),
      exceptionShipments: readStatusCount(statusCounts, "exception" as TrackingShipmentStatus),
    };
  });
}

// Event type counts

export function createEventTypeCounts(
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

// Workflow state counts

export function createWorkflowStateCounts(
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

// Date math

export function subtractUtcDays(value: Date, days: number): Date {
  return new Date(value.getTime() - days * 24 * 60 * 60 * 1000);
}

export function addUtcHours(value: Date, hours: number): Date {
  return new Date(value.getTime() + hours * 60 * 60 * 1000);
}

// Math helpers

export function roundRatio(numerator: number, denominator: number): number {
  if (denominator <= 0) {
    return 0;
  }

  return Math.round((numerator / denominator) * 100) / 100;
}

export function roundRatioPercent(numerator: number, denominator: number): number {
  if (denominator <= 0) {
    return 0;
  }

  return Math.round((numerator / denominator) * 10_000) / 100;
}

// Type conversion

export function toIsoStringOrNull(value: Date | null | undefined): string | null {
  return value?.toISOString() ?? null;
}

export function toTrackingEventPayloadOrNull(value: unknown): TrackingEventPayload | null {
  return isTrackingEventPayload(value) ? value : null;
}

export function isTrackingEventPayload(value: unknown): value is TrackingEventPayload {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).every(isTrackingEventPayloadValue);
}

export function isTrackingEventPayloadValue(value: unknown): value is TrackingEventPayload[string] {
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

// Payload readers

export function getPayloadRecord(payload: unknown): Record<string, unknown> {
  return typeof payload === "object" && payload !== null && !Array.isArray(payload)
    ? (payload as Record<string, unknown>)
    : {};
}

export function readPayloadString(
  payload: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = payload[key];

  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function readNullablePayloadString(
  payload: Record<string, unknown>,
  key: string,
): string | null {
  return readPayloadString(payload, key) ?? null;
}

export function readOperatorEvidencePayload(payload: Record<string, unknown>): {
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

export function readExceptionCategory(
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

export function readExceptionSeverity(payload: Record<string, unknown>): TrackingExceptionSeverity {
  const value = payload.exceptionSeverity;

  return isTrackingExceptionSeverity(value) ? value : "high";
}

export function readExceptionResolutionCode(
  payload: Record<string, unknown>,
): TrackingExceptionResolutionCode {
  const value = payload.resolutionCode;

  return isTrackingExceptionResolutionCode(value) ? value : "other";
}

export function readExceptionResolutionStatus(
  payload: Record<string, unknown>,
  fallback: TrackingShipmentStatus,
): TrackingExceptionResolutionStatus {
  const value = payload.currentStatus;

  if (isTrackingExceptionResolutionStatus(value)) {
    return value;
  }

  return isTrackingExceptionResolutionStatus(fallback)
    ? fallback
    : ("in_transit" as TrackingExceptionResolutionStatus);
}

export function readOperatorEvidenceType(
  payload: Record<string, unknown>,
): TrackingOperatorEvidenceType {
  const value = payload.evidenceType;

  return isTrackingOperatorEvidenceType(value) ? value : "operator_note";
}

export function readApprovalStatus(payload: Record<string, unknown>): TrackingApprovalStatus {
  const value = payload.approvalStatus;

  return isTrackingApprovalStatus(value) ? value : "pending_review";
}

export function readNullableExceptionWorkflowState(
  payload: Record<string, unknown>,
): TrackingExceptionWorkflowState | null {
  const nestedWorkflow = getPayloadRecord(payload.workflow);
  const workflowState =
    Object.keys(nestedWorkflow).length > 0 ? nestedWorkflow.state : payload.workflowState;

  return isTrackingExceptionWorkflowState(workflowState) ? workflowState : null;
}

export function readShipmentStatusPayload(
  payload: Record<string, unknown>,
  key: string,
  fallback: TrackingShipmentStatus,
): TrackingShipmentStatus {
  const value = payload[key];

  return isTrackingShipmentStatus(value) ? value : fallback;
}

// Output builders

export function createManageExceptionOutput(input: {
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

export function createResolveExceptionOutput(input: {
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

export function createRecordEventOutput(input: {
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
