import type { TrackingEventPayload } from "@saptm/rpc";
import {
  type trackingAdvisoryRecommendationTypes,
  type trackingAdvisorySeverities,
  trackingApprovalStatuses,
  type trackingEventTypes,
  trackingExceptionCategories,
  trackingExceptionResolutionCodes,
  trackingExceptionResolutionStatuses,
  trackingExceptionSeverities,
  trackingExceptionWorkflowStates,
  trackingOperatorEvidenceTypes,
  trackingShipmentStatuses,
  type trackingTransportModes,
} from "@saptm/rpc";

export type TrackingEventType = (typeof trackingEventTypes)[number];
export type TrackingShipmentStatus = (typeof trackingShipmentStatuses)[number];
export type TrackingExceptionCategory = (typeof trackingExceptionCategories)[number];
export type TrackingExceptionSeverity = (typeof trackingExceptionSeverities)[number];
export type TrackingExceptionResolutionCode = (typeof trackingExceptionResolutionCodes)[number];
export type TrackingExceptionResolutionStatus =
  (typeof trackingExceptionResolutionStatuses)[number];
export type TrackingExceptionWorkflowState = (typeof trackingExceptionWorkflowStates)[number];
export type TrackingOperatorEvidenceType = (typeof trackingOperatorEvidenceTypes)[number];
export type TrackingApprovalStatus = (typeof trackingApprovalStatuses)[number];
export type TrackingTransportMode = (typeof trackingTransportModes)[number];
export type TrackingAdvisoryRecommendationType =
  (typeof trackingAdvisoryRecommendationTypes)[number];
export type TrackingAdvisorySeverity = (typeof trackingAdvisorySeverities)[number];

export type TrackingExceptionEventType = Extract<
  TrackingEventType,
  "customs_hold" | "delayed" | "exception"
>;

export type TrackingOperatorEvidence = {
  operatorName: string;
  evidenceType: TrackingOperatorEvidenceType;
  evidenceReference: string;
  evidenceSummary: string;
  approvalStatus: TrackingApprovalStatus;
  approvalReference: string | null;
  approverName: string | null;
};

export const terminalTrackingShipmentStatuses: TrackingShipmentStatus[] = [
  "completed",
  "cancelled",
];

export function resolveShipmentStatusAfterEvent(
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

export function resolveExceptionEventType(
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

export function resolveManagedExceptionOutputEventType(
  eventType: TrackingEventType,
): TrackingExceptionEventType | null {
  if (eventType === "delayed" || eventType === "customs_hold" || eventType === "exception") {
    return eventType;
  }

  return null;
}

export function isResolvableExceptionStatus(status: TrackingShipmentStatus): boolean {
  return status === "exception" || status === "delayed";
}

export function createExceptionNotes(summary: string, recoveryPlan: string): string {
  return `${summary}\n\nRecovery plan: ${recoveryPlan}`;
}

export function createResolutionNotes(
  summary: string,
  resolutionCode: TrackingExceptionResolutionCode,
): string {
  return `${summary}\n\nResolution code: ${resolutionCode}`;
}

export function createOperatorEvidenceContext(
  evidence: TrackingOperatorEvidence,
): TrackingEventPayload {
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

export function resolveManagedExceptionWorkflowState(
  approvalStatus: TrackingApprovalStatus,
): TrackingExceptionWorkflowState {
  return approvalStatus === "approved" ? "approved_for_resolution" : "pending_review";
}

export function createExceptionWorkflowContext(input: {
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

export function createManagedExceptionPayload(input: {
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

export function createResolvedExceptionPayload(input: {
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

export function isTrackingExceptionCategory(value: unknown): value is TrackingExceptionCategory {
  return (
    typeof value === "string" &&
    trackingExceptionCategories.includes(value as TrackingExceptionCategory)
  );
}

export function isTrackingExceptionSeverity(value: unknown): value is TrackingExceptionSeverity {
  return (
    typeof value === "string" &&
    trackingExceptionSeverities.includes(value as TrackingExceptionSeverity)
  );
}

export function isTrackingExceptionResolutionCode(
  value: unknown,
): value is TrackingExceptionResolutionCode {
  return (
    typeof value === "string" &&
    trackingExceptionResolutionCodes.includes(value as TrackingExceptionResolutionCode)
  );
}

export function isTrackingExceptionResolutionStatus(
  value: unknown,
): value is TrackingExceptionResolutionStatus {
  return (
    typeof value === "string" &&
    trackingExceptionResolutionStatuses.includes(value as TrackingExceptionResolutionStatus)
  );
}

export function isTrackingOperatorEvidenceType(
  value: unknown,
): value is TrackingOperatorEvidenceType {
  return (
    typeof value === "string" &&
    trackingOperatorEvidenceTypes.includes(value as TrackingOperatorEvidenceType)
  );
}

export function isTrackingApprovalStatus(value: unknown): value is TrackingApprovalStatus {
  return (
    typeof value === "string" && trackingApprovalStatuses.includes(value as TrackingApprovalStatus)
  );
}

export function isTrackingExceptionWorkflowState(
  value: unknown,
): value is TrackingExceptionWorkflowState {
  return (
    typeof value === "string" &&
    trackingExceptionWorkflowStates.includes(value as TrackingExceptionWorkflowState)
  );
}

export function isTrackingShipmentStatus(value: unknown): value is TrackingShipmentStatus {
  return (
    typeof value === "string" && trackingShipmentStatuses.includes(value as TrackingShipmentStatus)
  );
}
