"use server";

import type { PlatformPermission } from "@saptm/auth";
import { getClientEnv } from "@saptm/config";
import {
  type TrackingEventRecordInput,
  type TrackingExceptionManageInput,
  type TrackingExceptionResolveInput,
  trackingEventRecordInputSchema,
  trackingEventRecordOutputSchema,
  trackingExceptionManageInputSchema,
  trackingExceptionManageOutputSchema,
  trackingExceptionResolveInputSchema,
  trackingExceptionResolveOutputSchema,
} from "@saptm/rpc/tracking";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { requirePlatformSession } from "../../../../lib/auth-session";
import type {
  TrackingEventRecordFormState,
  TrackingExceptionManageFormState,
  TrackingExceptionResolveFormState,
} from "./form-state";

const recordTrackingPermission: PlatformPermission = "tracking.event.record";
const manageTrackingExceptionPermission: PlatformPermission = "tracking.exception.manage";
const resolveTrackingExceptionPermission: PlatformPermission = "tracking.exception.resolve";

type RpcJsonEnvelope = {
  json?: unknown;
};

export async function recordTrackingEventAction(
  _previousState: TrackingEventRecordFormState,
  formData: FormData,
): Promise<TrackingEventRecordFormState> {
  const platformSession = await requirePlatformSession("/app/tracking");

  if (!platformSession.viewer.permissions.includes(recordTrackingPermission)) {
    return {
      status: "error",
      message: "A sessão não tem autorização para registar eventos.",
    };
  }

  const parsedInput = parseTrackingEventFormData(formData);

  if (parsedInput.status === "error") {
    return parsedInput;
  }

  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie");
  const url = new URL("/rpc/tracking/events", getClientEnv().NEXT_PUBLIC_API_URL);
  const response = await fetch(url, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader === null ? {} : { cookie: cookieHeader }),
    },
    body: JSON.stringify({
      json: parsedInput.input,
    }),
  });

  if (response.status === 401 || response.status === 403) {
    return {
      status: "error",
      message: "Operação recusada por sessão, organização ou autorização insuficiente.",
    };
  }

  if (!response.ok) {
    return {
      status: "error",
      message: `API de tracking recusou o evento: HTTP ${response.status}.`,
    };
  }

  const envelope = (await response.json()) as RpcJsonEnvelope;
  const parsedOutput = trackingEventRecordOutputSchema.safeParse(envelope.json);

  if (!parsedOutput.success) {
    return {
      status: "error",
      message: "Contrato RPC de tracking retornou resposta inválida para o evento.",
    };
  }

  revalidatePath("/app/tracking");

  return {
    status: "success",
    message: parsedOutput.data.idempotency.replayed
      ? "Evento já tinha sido registado; resposta idempotente reaproveitada."
      : "Evento operacional registado com auditoria.",
    eventId: parsedOutput.data.event.id,
    idempotencyKey: parsedOutput.data.event.idempotencyKey,
  };
}

export async function manageTrackingExceptionAction(
  _previousState: TrackingExceptionManageFormState,
  formData: FormData,
): Promise<TrackingExceptionManageFormState> {
  const shipmentId = readFormString(formData, "shipmentId");
  const returnPath = `/app/tracking/${shipmentId}`;
  const platformSession = await requirePlatformSession(returnPath);

  if (!platformSession.viewer.permissions.includes(manageTrackingExceptionPermission)) {
    return {
      status: "error",
      message: "A sessão não possui tracking.exception.manage para gerir exceções.",
    };
  }

  const parsedInput = parseTrackingExceptionFormData(formData);

  if (parsedInput.status === "error") {
    return parsedInput;
  }

  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie");
  const url = new URL("/rpc/tracking/exceptions", getClientEnv().NEXT_PUBLIC_API_URL);
  const response = await fetch(url, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader === null ? {} : { cookie: cookieHeader }),
    },
    body: JSON.stringify({
      json: parsedInput.input,
    }),
  });

  if (response.status === 401 || response.status === 403) {
    return {
      status: "error",
      message: "API recusou a exceção por sessão, organização ou permissão insuficiente.",
    };
  }

  if (!response.ok) {
    return {
      status: "error",
      message: `API de tracking recusou a exceção: HTTP ${response.status}.`,
    };
  }

  const envelope = (await response.json()) as RpcJsonEnvelope;
  const parsedOutput = trackingExceptionManageOutputSchema.safeParse(envelope.json);

  if (!parsedOutput.success) {
    return {
      status: "error",
      message: "Contrato RPC de tracking retornou resposta inválida para a exceção.",
    };
  }

  revalidatePath("/app/tracking");
  revalidatePath(returnPath);

  return {
    status: "success",
    message: parsedOutput.data.idempotency.replayed
      ? "Exceção já tinha sido gerida; resposta idempotente reaproveitada."
      : "Exceção operacional gerida com audit trail, outbox e status atualizado.",
    eventId: parsedOutput.data.event.id,
    idempotencyKey: parsedOutput.data.event.idempotencyKey,
    currentStatus: parsedOutput.data.shipment.currentStatus,
    evidenceReference: parsedOutput.data.evidence.evidenceReference,
    approvalStatus: parsedOutput.data.evidence.approvalStatus,
    workflowState: parsedOutput.data.workflow.state,
  };
}

export async function resolveTrackingExceptionAction(
  _previousState: TrackingExceptionResolveFormState,
  formData: FormData,
): Promise<TrackingExceptionResolveFormState> {
  const shipmentId = readFormString(formData, "shipmentId");
  const returnPath = `/app/tracking/${shipmentId}`;
  const platformSession = await requirePlatformSession(returnPath);

  if (!platformSession.viewer.permissions.includes(resolveTrackingExceptionPermission)) {
    return {
      status: "error",
      message: "A sessão não possui tracking.exception.resolve para resolver exceções.",
    };
  }

  const parsedInput = parseTrackingExceptionResolutionFormData(formData);

  if (parsedInput.status === "error") {
    return parsedInput;
  }

  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie");
  const url = new URL("/rpc/tracking/exceptionResolution", getClientEnv().NEXT_PUBLIC_API_URL);
  const response = await fetch(url, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader === null ? {} : { cookie: cookieHeader }),
    },
    body: JSON.stringify({
      json: parsedInput.input,
    }),
  });

  if (response.status === 401 || response.status === 403) {
    return {
      status: "error",
      message: "API recusou a resolução por sessão, organização ou permissão insuficiente.",
    };
  }

  if (response.status === 400) {
    return {
      status: "error",
      message: "API recusou a resolução: a carga precisa estar atrasada ou em exceção.",
    };
  }

  if (!response.ok) {
    return {
      status: "error",
      message: `API de tracking recusou a resolução: HTTP ${response.status}.`,
    };
  }

  const envelope = (await response.json()) as RpcJsonEnvelope;
  const parsedOutput = trackingExceptionResolveOutputSchema.safeParse(envelope.json);

  if (!parsedOutput.success) {
    return {
      status: "error",
      message: "Contrato RPC de tracking retornou resposta inválida para a resolução.",
    };
  }

  revalidatePath("/app/tracking");
  revalidatePath(returnPath);

  return {
    status: "success",
    message: parsedOutput.data.idempotency.replayed
      ? "Resolução já tinha sido registada; resposta idempotente reaproveitada."
      : "Exceção operacional resolvida com release event, audit trail e outbox.",
    eventId: parsedOutput.data.event.id,
    idempotencyKey: parsedOutput.data.event.idempotencyKey,
    currentStatus: parsedOutput.data.shipment.currentStatus,
    evidenceReference: parsedOutput.data.evidence.evidenceReference,
    approvalStatus: parsedOutput.data.evidence.approvalStatus,
    workflowState: parsedOutput.data.workflow.state,
  };
}

type ParseTrackingEventFormDataResult =
  | {
      status: "ok";
      input: TrackingEventRecordInput;
    }
  | {
      status: "error";
      message: string;
    };

function parseTrackingEventFormData(formData: FormData): ParseTrackingEventFormDataResult {
  const occurredAtValue = readFormString(formData, "occurredAt");
  const occurredAt = normalizeDatetimeLocalValue(occurredAtValue);
  const payloadResult = parsePayload(readFormString(formData, "payload"));

  if (occurredAt === null) {
    return {
      status: "error",
      message: "Informe uma data/hora válida para o evento operacional.",
    };
  }

  if (payloadResult.status === "error") {
    return payloadResult;
  }

  const input = trackingEventRecordInputSchema.safeParse({
    shipmentId: readFormString(formData, "shipmentId"),
    eventType: readFormString(formData, "eventType"),
    occurredAt,
    idempotencyKey: readFormString(formData, "idempotencyKey"),
    locationName: readOptionalFormString(formData, "locationName"),
    notes: readOptionalFormString(formData, "notes"),
    sourceSystem: readOptionalFormString(formData, "sourceSystem") ?? "saptm",
    ...(payloadResult.payload === undefined ? {} : { payload: payloadResult.payload }),
  });

  if (!input.success) {
    return {
      status: "error",
      message: input.error.issues.at(0)?.message ?? "Dados do evento operacional inválidos.",
    };
  }

  return {
    status: "ok",
    input: input.data,
  };
}

type ParseTrackingExceptionFormDataResult =
  | {
      status: "ok";
      input: TrackingExceptionManageInput;
    }
  | {
      status: "error";
      message: string;
    };

function parseTrackingExceptionFormData(formData: FormData): ParseTrackingExceptionFormDataResult {
  const occurredAt = normalizeDatetimeLocalValue(readFormString(formData, "occurredAt"));
  const expectedResolutionValue = readFormString(formData, "expectedResolutionAt");
  const expectedResolutionAt =
    expectedResolutionValue.length === 0
      ? undefined
      : normalizeDatetimeLocalValue(expectedResolutionValue);
  const payloadResult = parsePayload(readFormString(formData, "payload"));

  if (occurredAt === null) {
    return {
      status: "error",
      message: "Informe uma data/hora válida para a exceção operacional.",
    };
  }

  if (expectedResolutionAt === null) {
    return {
      status: "error",
      message: "Informe uma previsão de resolução válida ou deixe o campo vazio.",
    };
  }

  if (payloadResult.status === "error") {
    return payloadResult;
  }

  const input = trackingExceptionManageInputSchema.safeParse({
    shipmentId: readFormString(formData, "shipmentId"),
    category: readFormString(formData, "category"),
    severity: readFormString(formData, "severity"),
    occurredAt,
    idempotencyKey: readFormString(formData, "idempotencyKey"),
    summary: readFormString(formData, "summary"),
    recoveryPlan: readFormString(formData, "recoveryPlan"),
    evidence: readOperatorEvidenceFormData(formData, "pending_review"),
    ownerTeam: readOptionalFormString(formData, "ownerTeam"),
    ...(expectedResolutionAt === undefined ? {} : { expectedResolutionAt }),
    locationName: readOptionalFormString(formData, "locationName"),
    sourceSystem: readOptionalFormString(formData, "sourceSystem") ?? "saptm",
    ...(payloadResult.payload === undefined ? {} : { payload: payloadResult.payload }),
  });

  if (!input.success) {
    return {
      status: "error",
      message: input.error.issues.at(0)?.message ?? "Dados da exceção operacional inválidos.",
    };
  }

  return {
    status: "ok",
    input: input.data,
  };
}

type ParseTrackingExceptionResolutionFormDataResult =
  | {
      status: "ok";
      input: TrackingExceptionResolveInput;
    }
  | {
      status: "error";
      message: string;
    };

function parseTrackingExceptionResolutionFormData(
  formData: FormData,
): ParseTrackingExceptionResolutionFormDataResult {
  const occurredAt = normalizeDatetimeLocalValue(readFormString(formData, "occurredAt"));
  const payloadResult = parsePayload(readFormString(formData, "payload"));

  if (occurredAt === null) {
    return {
      status: "error",
      message: "Informe uma data/hora válida para a resolução operacional.",
    };
  }

  if (payloadResult.status === "error") {
    return payloadResult;
  }

  const input = trackingExceptionResolveInputSchema.safeParse({
    shipmentId: readFormString(formData, "shipmentId"),
    occurredAt,
    idempotencyKey: readFormString(formData, "idempotencyKey"),
    resolutionCode: readFormString(formData, "resolutionCode"),
    summary: readFormString(formData, "summary"),
    nextStatus: readFormString(formData, "nextStatus"),
    evidence: readOperatorEvidenceFormData(formData, "approved"),
    ownerTeam: readOptionalFormString(formData, "ownerTeam"),
    locationName: readOptionalFormString(formData, "locationName"),
    sourceSystem: readOptionalFormString(formData, "sourceSystem") ?? "saptm",
    ...(payloadResult.payload === undefined ? {} : { payload: payloadResult.payload }),
  });

  if (!input.success) {
    return {
      status: "error",
      message: input.error.issues.at(0)?.message ?? "Dados da resolução operacional inválidos.",
    };
  }

  return {
    status: "ok",
    input: input.data,
  };
}

function readFormString(formData: FormData, name: string): string {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

function readOptionalFormString(formData: FormData, name: string): string | undefined {
  const value = readFormString(formData, name);

  return value.length === 0 ? undefined : value;
}

function readOperatorEvidenceFormData(
  formData: FormData,
  fallbackApprovalStatus: "pending_review" | "approved",
) {
  const approvalStatus = readFormString(formData, "approvalStatus");

  return {
    operatorName: readFormString(formData, "operatorName"),
    evidenceType: readFormString(formData, "evidenceType"),
    evidenceReference: readFormString(formData, "evidenceReference"),
    evidenceSummary: readFormString(formData, "evidenceSummary"),
    approvalStatus: approvalStatus.length === 0 ? fallbackApprovalStatus : approvalStatus,
    approvalReference: readOptionalFormString(formData, "approvalReference"),
    approverName: readOptionalFormString(formData, "approverName"),
  };
}

function normalizeDatetimeLocalValue(value: string): string | null {
  if (value.length === 0) {
    return null;
  }

  const normalized = value.length === 16 ? `${value}:00` : value;
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

type ParsePayloadResult =
  | {
      status: "ok";
      payload?: Record<string, unknown>;
    }
  | {
      status: "error";
      message: string;
    };

function parsePayload(value: string): ParsePayloadResult {
  if (value.length === 0) {
    return {
      status: "ok",
    };
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    if (!isPlainRecord(parsed)) {
      return {
        status: "error",
        message: "Payload deve ser um objeto JSON.",
      };
    }

    return {
      status: "ok",
      payload: parsed,
    };
  } catch {
    return {
      status: "error",
      message: "Payload JSON invalido.",
    };
  }
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
