"use server";

import type { PlatformPermission } from "@saptm/auth";
import { getClientEnv } from "@saptm/config";
import {
  type TransportOrderCancelInput,
  type TransportOrderConfirmInput,
  type TransportOrderDispatchInput,
  type TransportOrderRescheduleInput,
  transportOrderCancelInputSchema,
  transportOrderCancelOutputSchema,
  transportOrderConfirmInputSchema,
  transportOrderConfirmOutputSchema,
  transportOrderDispatchInputSchema,
  transportOrderDispatchOutputSchema,
  transportOrderRescheduleInputSchema,
  transportOrderRescheduleOutputSchema,
} from "@saptm/rpc/planning";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { requirePlatformSession } from "../../../../lib/auth-session";
import type {
  TransportOrderCancelFormState,
  TransportOrderConfirmFormState,
  TransportOrderDispatchFormState,
  TransportOrderRescheduleFormState,
} from "./form-state";

const confirmPlanningPermission: PlatformPermission = "planning.order.confirm";
const cancelPlanningPermission: PlatformPermission = "planning.order.cancel";
const reschedulePlanningPermission: PlatformPermission = "planning.order.reschedule";
const dispatchPlanningPermission: PlatformPermission = "planning.order.dispatch";

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

export async function confirmTransportOrderAction(
  _previousState: TransportOrderConfirmFormState,
  formData: FormData,
): Promise<TransportOrderConfirmFormState> {
  const platformSession = await requirePlatformSession("/app/planning");

  if (!platformSession.viewer.permissions.includes(confirmPlanningPermission)) {
    return {
      status: "error",
      message: "A sessão não possui planning.order.confirm para confirmar transport orders.",
    };
  }

  const parsedInput = parseTransportOrderConfirmFormData(formData);

  if (!("input" in parsedInput)) {
    return parsedInput;
  }

  const result = await postPlanningRpc(
    "/rpc/planning/confirmTransportOrder",
    parsedInput.input,
    transportOrderConfirmOutputSchema,
  );

  if (result.status !== "ok") {
    return {
      status: "error",
      message: result.message,
    };
  }

  revalidatePath("/app/planning");

  return {
    status: "success",
    message: result.output.idempotency.replayed
      ? "Transport order já tinha sido confirmada; resposta idempotente reaproveitada."
      : "Transport order confirmada com carga, rota, timing, audit trail e outbox.",
    orderId: result.output.orderId,
    orderReference: result.output.transportOrder.orderReference,
    cargoId: result.output.cargoId,
    idempotencyKey: result.output.idempotency.key,
    orderConfirmed: result.output.businessRules.orderConfirmed,
  };
}

export async function cancelTransportOrderAction(
  _previousState: TransportOrderCancelFormState,
  formData: FormData,
): Promise<TransportOrderCancelFormState> {
  const platformSession = await requirePlatformSession("/app/planning");

  if (!platformSession.viewer.permissions.includes(cancelPlanningPermission)) {
    return {
      status: "error",
      message: "A sessão não possui planning.order.cancel para cancelar transport orders.",
    };
  }

  const parsedInput = parseTransportOrderCancelFormData(formData);

  if (!("input" in parsedInput)) {
    return parsedInput;
  }

  const result = await postPlanningRpc(
    "/rpc/planning/cancelTransportOrder",
    parsedInput.input,
    transportOrderCancelOutputSchema,
  );

  if (result.status !== "ok") {
    return {
      status: "error",
      message: result.message,
    };
  }

  revalidatePath("/app/planning");

  return {
    status: "success",
    message: result.output.idempotency.replayed
      ? "Transport order já tinha sido cancelada; resposta idempotente reaproveitada."
      : "Transport order cancelada com motivo, audit trail e outbox.",
    orderId: result.output.orderId,
    orderReference: result.output.transportOrder.orderReference,
    cargoId: result.output.cargoId,
    idempotencyKey: result.output.idempotency.key,
    orderCancelled: result.output.businessRules.orderCancelled,
  };
}

export async function rescheduleTransportOrderAction(
  _previousState: TransportOrderRescheduleFormState,
  formData: FormData,
): Promise<TransportOrderRescheduleFormState> {
  const platformSession = await requirePlatformSession("/app/planning");

  if (!platformSession.viewer.permissions.includes(reschedulePlanningPermission)) {
    return {
      status: "error",
      message: "A sessão não possui planning.order.reschedule para replanear transport orders.",
    };
  }

  const parsedInput = parseTransportOrderRescheduleFormData(formData);

  if (!("input" in parsedInput)) {
    return parsedInput;
  }

  const result = await postPlanningRpc(
    "/rpc/planning/rescheduleTransportOrder",
    parsedInput.input,
    transportOrderRescheduleOutputSchema,
  );

  if (result.status !== "ok") {
    return {
      status: "error",
      message: result.message,
    };
  }

  revalidatePath("/app/planning");

  return {
    status: "success",
    message: result.output.idempotency.replayed
      ? "Transport order já tinha sido replaneada; resposta idempotente reaproveitada."
      : "Transport order replaneada com rota, janela, audit trail e outbox.",
    orderId: result.output.orderId,
    orderReference: result.output.transportOrder.orderReference,
    cargoId: result.output.cargoId,
    revisionId: result.output.revisionId,
    revisionReference: result.output.revisionReference,
    idempotencyKey: result.output.idempotency.key,
    orderRescheduled: result.output.businessRules.orderRescheduled,
  };
}

export async function dispatchTransportOrderAction(
  _previousState: TransportOrderDispatchFormState,
  formData: FormData,
): Promise<TransportOrderDispatchFormState> {
  const platformSession = await requirePlatformSession("/app/planning");

  if (!platformSession.viewer.permissions.includes(dispatchPlanningPermission)) {
    return {
      status: "error",
      message: "A sessão não possui planning.order.dispatch para despachar transport orders.",
    };
  }

  const parsedInput = parseTransportOrderDispatchFormData(formData);

  if (!("input" in parsedInput)) {
    return parsedInput;
  }

  const result = await postPlanningRpc(
    "/rpc/planning/dispatchTransportOrder",
    parsedInput.input,
    transportOrderDispatchOutputSchema,
  );

  if (result.status !== "ok") {
    return {
      status: "error",
      message: result.message,
    };
  }

  revalidatePath("/app/planning");

  return {
    status: "success",
    message: result.output.idempotency.replayed
      ? "Transport order já tinha sido despachada; resposta idempotente reaproveitada."
      : "Transport order despachada com instruções, audit trail e outbox.",
    orderId: result.output.orderId,
    orderReference: result.output.transportOrder.orderReference,
    cargoId: result.output.cargoId,
    dispatchId: result.output.dispatchId,
    dispatchReference: result.output.dispatchReference,
    idempotencyKey: result.output.idempotency.key,
    orderDispatched: result.output.businessRules.orderDispatched,
  };
}

async function postPlanningRpc<TOutput>(
  path: string,
  input:
    | TransportOrderCancelInput
    | TransportOrderConfirmInput
    | TransportOrderDispatchInput
    | TransportOrderRescheduleInput,
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
      message: "API recusou o comando por sessão, organização ou permissão insuficiente.",
    };
  }

  if (!response.ok) {
    const errorCode = await readRpcErrorCode(response);

    return {
      status: "error",
      message:
        errorCode === undefined
          ? `API de planeamento recusou o comando: HTTP ${response.status}.`
          : `API de planeamento recusou o comando: HTTP ${response.status} (${errorCode}).`,
    };
  }

  const envelope = (await response.json()) as RpcJsonEnvelope;
  const parsedOutput = outputSchema.safeParse(envelope.json);

  if (!parsedOutput.success) {
    return {
      status: "error",
      message: "Contrato RPC de planeamento retornou resposta inválida.",
    };
  }

  return {
    status: "ok",
    output: parsedOutput.data,
  };
}

function parseTransportOrderDispatchFormData(formData: FormData):
  | {
      status: "ok";
      input: TransportOrderDispatchInput;
    }
  | TransportOrderDispatchFormState {
  const input = {
    orderId: readFormString(formData, "orderId"),
    dispatchReference: readFormString(formData, "dispatchReference"),
    dispatchedByName: readFormString(formData, "dispatchedByName"),
    dispatchInstructions: readFormString(formData, "dispatchInstructions"),
    dispatchedAt: readDatetimeLocal(formData, "dispatchedAt"),
    idempotencyKey: readFormString(formData, "idempotencyKey"),
    sourceSystem: readFormString(formData, "sourceSystem"),
  };
  const parsed = transportOrderDispatchInputSchema.safeParse(input);

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

function parseTransportOrderRescheduleFormData(formData: FormData):
  | {
      status: "ok";
      input: TransportOrderRescheduleInput;
    }
  | TransportOrderRescheduleFormState {
  const input = {
    orderId: readFormString(formData, "orderId"),
    revisionReference: readFormString(formData, "revisionReference"),
    mode: readFormString(formData, "mode"),
    carrierName: readFormString(formData, "carrierName"),
    routeSummary: readFormString(formData, "routeSummary"),
    originName: readFormString(formData, "originName"),
    destinationName: readFormString(formData, "destinationName"),
    plannedDepartureAt: readDatetimeLocal(formData, "plannedDepartureAt"),
    plannedArrivalAt: readDatetimeLocal(formData, "plannedArrivalAt"),
    rescheduledByName: readFormString(formData, "rescheduledByName"),
    rescheduleReason: readFormString(formData, "rescheduleReason"),
    rescheduledAt: readDatetimeLocal(formData, "rescheduledAt"),
    idempotencyKey: readFormString(formData, "idempotencyKey"),
    sourceSystem: readFormString(formData, "sourceSystem"),
  };
  const parsed = transportOrderRescheduleInputSchema.safeParse(input);

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

function parseTransportOrderCancelFormData(formData: FormData):
  | {
      status: "ok";
      input: TransportOrderCancelInput;
    }
  | TransportOrderCancelFormState {
  const input = {
    orderId: readFormString(formData, "orderId"),
    cancellationReference: readFormString(formData, "cancellationReference"),
    cancelledByName: readFormString(formData, "cancelledByName"),
    cancellationReason: readFormString(formData, "cancellationReason"),
    cancelledAt: readDatetimeLocal(formData, "cancelledAt"),
    idempotencyKey: readFormString(formData, "idempotencyKey"),
    sourceSystem: readFormString(formData, "sourceSystem"),
  };
  const parsed = transportOrderCancelInputSchema.safeParse(input);

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

function parseTransportOrderConfirmFormData(formData: FormData):
  | {
      status: "ok";
      input: TransportOrderConfirmInput;
    }
  | TransportOrderConfirmFormState {
  const trackingShipmentId = readOptionalFormString(formData, "trackingShipmentId");
  const capacityReservationId = readOptionalFormString(formData, "capacityReservationId");
  const input = {
    cargoId: readFormString(formData, "cargoId"),
    ...(trackingShipmentId === undefined ? {} : { trackingShipmentId }),
    ...(capacityReservationId === undefined ? {} : { capacityReservationId }),
    orderReference: readFormString(formData, "orderReference"),
    mode: readFormString(formData, "mode"),
    carrierName: readFormString(formData, "carrierName"),
    routeSummary: readFormString(formData, "routeSummary"),
    originName: readFormString(formData, "originName"),
    destinationName: readFormString(formData, "destinationName"),
    plannedDepartureAt: readDatetimeLocal(formData, "plannedDepartureAt"),
    plannedArrivalAt: readDatetimeLocal(formData, "plannedArrivalAt"),
    responsiblePlannerName: readFormString(formData, "responsiblePlannerName"),
    confirmationReference: readFormString(formData, "confirmationReference"),
    confirmedAt: readDatetimeLocal(formData, "confirmedAt"),
    idempotencyKey: readFormString(formData, "idempotencyKey"),
    sourceSystem: readFormString(formData, "sourceSystem"),
  };
  const parsed = transportOrderConfirmInputSchema.safeParse(input);

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
