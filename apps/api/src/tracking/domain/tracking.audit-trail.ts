import type { AuditJsonValue } from "@saptm/database";
import type { TrackingEventPayload } from "@saptm/rpc";
import type {
  TrackingEventType,
  TrackingExceptionCategory,
  TrackingExceptionResolutionCode,
  TrackingExceptionSeverity,
  TrackingExceptionWorkflowState,
  TrackingShipmentStatus,
} from "./tracking.business-rules.js";
import { createExceptionWorkflowContext } from "./tracking.business-rules.js";

export function createTrackingEventAuditAfter(input: {
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

export function createTrackingExceptionAuditAfter(input: {
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

export function createTrackingExceptionResolutionAuditAfter(input: {
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
