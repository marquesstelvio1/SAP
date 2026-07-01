"use server";

import type { PlatformPermission } from "@saptm/auth";
import { getClientEnv } from "@saptm/config";
import {
  type CapacityAdvisoryDecisionRecordInput,
  type CapacityResourceRegisterInput,
  type CapacitySlotCancelInput,
  type CapacitySlotOpenInput,
  type CapacitySlotReserveInput,
  capacityAdvisoryDecisionRecordInputSchema,
  capacityAdvisoryDecisionRecordOutputSchema,
  capacityResourceRegisterInputSchema,
  capacityResourceRegisterOutputSchema,
  capacitySlotCancelInputSchema,
  capacitySlotCancelOutputSchema,
  capacitySlotOpenInputSchema,
  capacitySlotOpenOutputSchema,
  capacitySlotReserveInputSchema,
  capacitySlotReserveOutputSchema,
} from "@saptm/rpc/capacity";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { requirePlatformSession } from "../../../../lib/auth-session";
import type {
  CapacityAdvisoryDecisionFormState,
  CapacityResourceRegisterFormState,
  CapacitySlotCancelFormState,
  CapacitySlotOpenFormState,
  CapacitySlotReserveFormState,
} from "./form-state";

const manageCapacityPermission: PlatformPermission = "capacity.manage";
const reserveCapacityPermission: PlatformPermission = "capacity.slot.reserve";
const cancelCapacityPermission: PlatformPermission = "capacity.slot.cancel";
const decideCapacityAdvisoryPermission: PlatformPermission = "capacity.advisory.decide";

type RpcJsonEnvelope = {
  json?: unknown;
};

type RpcOutputSchema<TOutput> = {
  safeParse: (value: unknown) =>
    | {
        success: true;
        data: TOutput;
      }
    | {
        success: false;
      };
};

export async function registerCapacityResourceAction(
  _previousState: CapacityResourceRegisterFormState,
  formData: FormData,
): Promise<CapacityResourceRegisterFormState> {
  const platformSession = await requirePlatformSession("/app/capacity");

  if (!platformSession.viewer.permissions.includes(manageCapacityPermission)) {
    return {
      status: "error",
      message: "A sessao nao possui capacity.manage para registar recursos.",
    };
  }

  const parsedInput = parseCapacityResourceRegisterFormData(formData);

  if (!("input" in parsedInput)) {
    return parsedInput;
  }

  const result = await postCapacityRpc(
    "/rpc/capacity/registerResource",
    parsedInput.input,
    capacityResourceRegisterOutputSchema,
  );

  if (result.status !== "ok") {
    return {
      status: "error",
      message: result.message,
    };
  }

  revalidatePath("/app/capacity");

  return {
    status: "success",
    message: result.output.idempotency.replayed
      ? "Recurso ja tinha sido registado; resposta idempotente reaproveitada."
      : "Recurso registado com regras de capacidade, audit trail e outbox.",
    resourceId: result.output.resourceId,
    resourceCode: result.output.resource.resourceCode,
    idempotencyKey: result.output.idempotency.key,
    resourceAccepted: result.output.businessRules.resourceAccepted,
  };
}

export async function openCapacitySlotAction(
  _previousState: CapacitySlotOpenFormState,
  formData: FormData,
): Promise<CapacitySlotOpenFormState> {
  const platformSession = await requirePlatformSession("/app/capacity");

  if (!platformSession.viewer.permissions.includes(manageCapacityPermission)) {
    return {
      status: "error",
      message: "A sessao nao possui capacity.manage para abrir slots.",
    };
  }

  const parsedInput = parseCapacitySlotOpenFormData(formData);

  if (!("input" in parsedInput)) {
    return parsedInput;
  }

  const result = await postCapacityRpc(
    "/rpc/capacity/openSlot",
    parsedInput.input,
    capacitySlotOpenOutputSchema,
  );

  if (result.status !== "ok") {
    return {
      status: "error",
      message: result.message,
    };
  }

  revalidatePath("/app/capacity");

  return {
    status: "success",
    message: result.output.idempotency.replayed
      ? "Slot ja tinha sido aberto; resposta idempotente reaproveitada."
      : "Slot aberto com janela valida, limite por recurso, audit trail e outbox.",
    resourceId: result.output.resourceId,
    slotId: result.output.slotId,
    slotReference: result.output.slot.slotReference,
    idempotencyKey: result.output.idempotency.key,
    slotOpened: result.output.businessRules.slotOpened,
    capacityWithinResourceLimit: result.output.businessRules.capacityWithinResourceLimit,
  };
}

export async function reserveCapacitySlotAction(
  _previousState: CapacitySlotReserveFormState,
  formData: FormData,
): Promise<CapacitySlotReserveFormState> {
  const platformSession = await requirePlatformSession("/app/capacity");

  if (!platformSession.viewer.permissions.includes(reserveCapacityPermission)) {
    return {
      status: "error",
      message: "A sessao nao possui capacity.slot.reserve para reservar capacidade.",
    };
  }

  const parsedInput = parseCapacitySlotReserveFormData(formData);

  if (!("input" in parsedInput)) {
    return parsedInput;
  }

  const result = await postCapacityRpc(
    "/rpc/capacity/reserveSlot",
    parsedInput.input,
    capacitySlotReserveOutputSchema,
  );

  if (result.status !== "ok") {
    return {
      status: "error",
      message: result.message,
    };
  }

  revalidatePath("/app/capacity");

  return {
    status: "success",
    message: result.output.idempotency.replayed
      ? "Reserva ja tinha sido processada; resposta idempotente reaproveitada."
      : "Capacidade reservada sem overbooking, com audit trail e outbox.",
    cargoId: result.output.cargoId,
    slotId: result.output.slotId,
    reservationId: result.output.reservationId,
    reservationReference: result.output.reservation.reservationReference,
    idempotencyKey: result.output.idempotency.key,
    reservationAllowed: result.output.businessRules.reservationAllowed,
    capacityAvailable: result.output.businessRules.capacityAvailable,
  };
}

export async function cancelCapacitySlotReservationAction(
  _previousState: CapacitySlotCancelFormState,
  formData: FormData,
): Promise<CapacitySlotCancelFormState> {
  const platformSession = await requirePlatformSession("/app/capacity");

  if (!platformSession.viewer.permissions.includes(cancelCapacityPermission)) {
    return {
      status: "error",
      message: "A sessao nao possui capacity.slot.cancel para cancelar reservas.",
    };
  }

  const parsedInput = parseCapacitySlotCancelFormData(formData);

  if (!("input" in parsedInput)) {
    return parsedInput;
  }

  const result = await postCapacityRpc(
    "/rpc/capacity/cancelSlotReservation",
    parsedInput.input,
    capacitySlotCancelOutputSchema,
  );

  if (result.status !== "ok") {
    return {
      status: "error",
      message: result.message,
    };
  }

  revalidatePath("/app/capacity");

  return {
    status: "success",
    message: result.output.idempotency.replayed
      ? "Cancelamento ja tinha sido processado; resposta idempotente reaproveitada."
      : "Reserva cancelada e unidades libertadas com audit trail e outbox.",
    cargoId: result.output.cargoId,
    slotId: result.output.slotId,
    reservationId: result.output.reservationId,
    idempotencyKey: result.output.idempotency.key,
    cancellationAllowed: result.output.businessRules.cancellationAllowed,
    ...(result.output.reservation.cancellationReference === null
      ? {}
      : { cancellationReference: result.output.reservation.cancellationReference }),
  };
}

export async function recordCapacityAdvisoryDecisionAction(
  _previousState: CapacityAdvisoryDecisionFormState,
  formData: FormData,
): Promise<CapacityAdvisoryDecisionFormState> {
  const platformSession = await requirePlatformSession("/app/capacity");

  if (!platformSession.viewer.permissions.includes(decideCapacityAdvisoryPermission)) {
    return {
      status: "error",
      message: "A sessao nao possui capacity.advisory.decide para decidir recomendacoes.",
    };
  }

  const parsedInput = parseCapacityAdvisoryDecisionFormData(formData);

  if (!("input" in parsedInput)) {
    return parsedInput;
  }

  const result = await postCapacityRpc(
    "/rpc/capacity/recordAdvisoryDecision",
    parsedInput.input,
    capacityAdvisoryDecisionRecordOutputSchema,
  );

  if (result.status !== "ok") {
    return {
      status: "error",
      message: result.message,
    };
  }

  revalidatePath("/app/capacity");

  return {
    status: "success",
    message: result.output.idempotency.replayed
      ? "Decisao de advisory ja tinha sido registada; resposta idempotente reaproveitada."
      : "Decisao humana registada com audit trail e outbox, sem executar automacao.",
    decisionId: result.output.decisionId,
    recommendationId: result.output.decision.recommendationId,
    decisionStatus: result.output.decision.decisionStatus,
    idempotencyKey: result.output.idempotency.key,
    decisionAccepted: result.output.businessRules.decisionAccepted,
  };
}

async function postCapacityRpc<TOutput>(
  path: string,
  input:
    | CapacityAdvisoryDecisionRecordInput
    | CapacityResourceRegisterInput
    | CapacitySlotOpenInput
    | CapacitySlotReserveInput
    | CapacitySlotCancelInput,
  outputSchema: RpcOutputSchema<TOutput>,
): Promise<
  | {
      status: "ok";
      output: TOutput;
    }
  | {
      status: "error";
      message: string;
    }
> {
  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie");
  const url = new URL(path, getClientEnv().NEXT_PUBLIC_API_URL);
  const response = await fetch(url, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader === null ? {} : { cookie: cookieHeader }),
    },
    body: JSON.stringify({
      json: input,
    }),
  });

  if (response.status === 401 || response.status === 403) {
    return {
      status: "error",
      message: "API recusou o comando por sessao, organizacao ou permissao insuficiente.",
    };
  }

  if (!response.ok) {
    const errorCode = await readRpcErrorCode(response);

    return {
      status: "error",
      message:
        errorCode === undefined
          ? `API de capacidade recusou o comando: HTTP ${response.status}.`
          : `API de capacidade recusou o comando: HTTP ${response.status} (${errorCode}).`,
    };
  }

  const envelope = (await response.json()) as RpcJsonEnvelope;
  const parsedOutput = outputSchema.safeParse(envelope.json);

  if (!parsedOutput.success) {
    return {
      status: "error",
      message: "Contrato RPC de capacidade retornou resposta invalida.",
    };
  }

  return {
    status: "ok",
    output: parsedOutput.data,
  };
}

function parseCapacityResourceRegisterFormData(formData: FormData):
  | {
      status: "ok";
      input: CapacityResourceRegisterInput;
    }
  | CapacityResourceRegisterFormState {
  const input = {
    resourceCode: readFormString(formData, "resourceCode"),
    resourceName: readFormString(formData, "resourceName"),
    resourceType: readFormString(formData, "resourceType"),
    locationName: readFormString(formData, "locationName"),
    maxConcurrentBookings: readFormInteger(formData, "maxConcurrentBookings"),
    idempotencyKey: readFormString(formData, "idempotencyKey"),
    sourceSystem: readFormString(formData, "sourceSystem"),
  };
  const parsed = capacityResourceRegisterInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues.map((issue) => issue.message).join(" "),
    };
  }

  return {
    status: "ok",
    input: parsed.data,
  };
}

function parseCapacitySlotOpenFormData(formData: FormData):
  | {
      status: "ok";
      input: CapacitySlotOpenInput;
    }
  | CapacitySlotOpenFormState {
  const input = {
    resourceId: readFormString(formData, "resourceId"),
    slotReference: readFormString(formData, "slotReference"),
    windowStartAt: readDatetimeLocal(formData, "windowStartAt"),
    windowEndAt: readDatetimeLocal(formData, "windowEndAt"),
    capacityUnits: readFormInteger(formData, "capacityUnits"),
    idempotencyKey: readFormString(formData, "idempotencyKey"),
    sourceSystem: readFormString(formData, "sourceSystem"),
  };
  const parsed = capacitySlotOpenInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues.map((issue) => issue.message).join(" "),
    };
  }

  return {
    status: "ok",
    input: parsed.data,
  };
}

function parseCapacitySlotReserveFormData(formData: FormData):
  | {
      status: "ok";
      input: CapacitySlotReserveInput;
    }
  | CapacitySlotReserveFormState {
  const input = {
    cargoId: readFormString(formData, "cargoId"),
    slotId: readFormString(formData, "slotId"),
    reservationReference: readFormString(formData, "reservationReference"),
    reservationPurpose: readFormString(formData, "reservationPurpose"),
    reservedUnits: readFormInteger(formData, "reservedUnits"),
    reservedByName: readFormString(formData, "reservedByName"),
    reservedAt: readDatetimeLocal(formData, "reservedAt"),
    idempotencyKey: readFormString(formData, "idempotencyKey"),
    sourceSystem: readFormString(formData, "sourceSystem"),
  };
  const parsed = capacitySlotReserveInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues.map((issue) => issue.message).join(" "),
    };
  }

  return {
    status: "ok",
    input: parsed.data,
  };
}

function parseCapacitySlotCancelFormData(formData: FormData):
  | {
      status: "ok";
      input: CapacitySlotCancelInput;
    }
  | CapacitySlotCancelFormState {
  const input = {
    reservationId: readFormString(formData, "reservationId"),
    cancellationReference: readFormString(formData, "cancellationReference"),
    cancelledByName: readFormString(formData, "cancelledByName"),
    cancellationReason: readFormString(formData, "cancellationReason"),
    cancelledAt: readDatetimeLocal(formData, "cancelledAt"),
    idempotencyKey: readFormString(formData, "idempotencyKey"),
    sourceSystem: readFormString(formData, "sourceSystem"),
  };
  const parsed = capacitySlotCancelInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues.map((issue) => issue.message).join(" "),
    };
  }

  return {
    status: "ok",
    input: parsed.data,
  };
}

function parseCapacityAdvisoryDecisionFormData(formData: FormData):
  | {
      status: "ok";
      input: CapacityAdvisoryDecisionRecordInput;
    }
  | CapacityAdvisoryDecisionFormState {
  const slotId = readOptionalFormString(formData, "slotId");
  const reservationId = readOptionalFormString(formData, "reservationId");
  const approvalReference = readOptionalFormString(formData, "approvalReference");
  const input = {
    recommendationId: readFormString(formData, "recommendationId"),
    recommendationType: readFormString(formData, "recommendationType"),
    decisionStatus: readFormString(formData, "decisionStatus"),
    decidedByName: readFormString(formData, "decidedByName"),
    decisionReason: readFormString(formData, "decisionReason"),
    ...(approvalReference === undefined ? {} : { approvalReference }),
    requiredPermission: readFormString(formData, "requiredPermission"),
    ...(slotId === undefined ? {} : { slotId }),
    ...(reservationId === undefined ? {} : { reservationId }),
    decidedAt: readDatetimeLocal(formData, "decidedAt"),
    idempotencyKey: readFormString(formData, "idempotencyKey"),
    sourceSystem: readFormString(formData, "sourceSystem"),
  };
  const parsed = capacityAdvisoryDecisionRecordInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues.map((issue) => issue.message).join(" "),
    };
  }

  return {
    status: "ok",
    input: parsed.data,
  };
}

function readFormString(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function readOptionalFormString(formData: FormData, key: string): string | undefined {
  const value = readFormString(formData, key);

  return value.length === 0 ? undefined : value;
}

function readFormInteger(formData: FormData, key: string): number {
  return Number.parseInt(readFormString(formData, key), 10);
}

function readDatetimeLocal(formData: FormData, key: string): string {
  const value = readFormString(formData, key);
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

async function readRpcErrorCode(response: Response): Promise<string | undefined> {
  const body = await response.text();

  if (body.length === 0) {
    return undefined;
  }

  try {
    return findErrorCode(JSON.parse(body));
  } catch {
    return body.slice(0, 160);
  }
}

function findErrorCode(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value.slice(0, 160);
  }

  if (value === null || typeof value !== "object") {
    return undefined;
  }

  for (const key of ["message", "code", "error", "name"]) {
    const candidate = (value as Record<string, unknown>)[key];

    if (typeof candidate === "string" && candidate.length > 0) {
      return candidate.slice(0, 160);
    }
  }

  for (const nestedValue of Object.values(value)) {
    const nestedErrorCode = findErrorCode(nestedValue);

    if (nestedErrorCode !== undefined) {
      return nestedErrorCode;
    }
  }

  return undefined;
}
