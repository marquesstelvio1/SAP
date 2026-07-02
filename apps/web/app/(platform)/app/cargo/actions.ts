"use server";

import type { PlatformPermission } from "@saptm/auth";
import { getClientEnv } from "@saptm/config";
import {
  type CargoClaimSettlementRecordInput,
  type CargoComplianceEvidenceRecordInput,
  type CargoComplianceEvidenceVerifyInput,
  type CargoDeliveryCompleteInput,
  type CargoDeliveryExceptionRecordInput,
  type CargoDeliveryExceptionResolveInput,
  type CargoOperationalHandoffRecordInput,
  type CargoRegisterInput,
  type CargoReleaseInput,
  type CargoTransportArriveInput,
  type CargoTransportDepartInput,
  type CargoTransportPlanInput,
  cargoClaimSettlementRecordInputSchema,
  cargoClaimSettlementRecordOutputSchema,
  cargoComplianceEvidenceRecordInputSchema,
  cargoComplianceEvidenceRecordOutputSchema,
  cargoComplianceEvidenceVerifyInputSchema,
  cargoComplianceEvidenceVerifyOutputSchema,
  cargoDeliveryCompleteInputSchema,
  cargoDeliveryCompleteOutputSchema,
  cargoDeliveryExceptionRecordInputSchema,
  cargoDeliveryExceptionRecordOutputSchema,
  cargoDeliveryExceptionResolveInputSchema,
  cargoDeliveryExceptionResolveOutputSchema,
  cargoOperationalHandoffRecordInputSchema,
  cargoOperationalHandoffRecordOutputSchema,
  cargoRegisterInputSchema,
  cargoRegisterOutputSchema,
  cargoReleaseInputSchema,
  cargoReleaseOutputSchema,
  cargoTransportArriveInputSchema,
  cargoTransportArriveOutputSchema,
  cargoTransportDepartInputSchema,
  cargoTransportDepartOutputSchema,
  cargoTransportPlanInputSchema,
  cargoTransportPlanOutputSchema,
} from "@saptm/rpc/cargo";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { requirePlatformSession } from "../../../../lib/auth-session";
import type {
  CargoClaimSettlementRecordFormState,
  CargoComplianceEvidenceRecordFormState,
  CargoComplianceEvidenceVerifyFormState,
  CargoDeliveryCompleteFormState,
  CargoDeliveryExceptionRecordFormState,
  CargoDeliveryExceptionResolveFormState,
  CargoOperationalHandoffRecordFormState,
  CargoRegisterFormState,
  CargoReleaseFormState,
  CargoTransportArriveFormState,
  CargoTransportDepartFormState,
  CargoTransportPlanFormState,
} from "./form-state";

const registerCargoPermission: PlatformPermission = "cargo.register";
const releaseCargoPermission: PlatformPermission = "cargo.release";
const planCargoTransportPermission: PlatformPermission = "cargo.transport.plan";
const departCargoTransportPermission: PlatformPermission = "cargo.transport.depart";
const arriveCargoTransportPermission: PlatformPermission = "cargo.transport.arrive";
const recordCargoOperationalHandoffPermission: PlatformPermission = "cargo.handoff.record";
const recordCargoClaimSettlementPermission: PlatformPermission = "cargo.claim.settle";
const completeCargoDeliveryPermission: PlatformPermission = "cargo.delivery.complete";
const recordCargoDeliveryExceptionPermission: PlatformPermission =
  "cargo.delivery.exception.record";
const resolveCargoDeliveryExceptionPermission: PlatformPermission =
  "cargo.delivery.exception.resolve";
const recordComplianceEvidencePermission: PlatformPermission = "cargo.compliance.record";
const verifyComplianceEvidencePermission: PlatformPermission = "cargo.compliance.verify";

type RpcJsonEnvelope = {
  json?: unknown;
};

const parseCargoReleaseFormDataCombined = (
  formData: FormData,
  cargoId: string,
):
  | {
      status: "ok";
      input: CargoReleaseInput;
    }
  | CargoReleaseFormState => {
  const input = {
    cargoId,
    customsStatus: "cleared",
    inspectionOutcome: readFormString(formData, "inspectionOutcome") || "not_required",
    releaseReference: readOptionalFormString(formData, "releaseReference"),
    releaseReason: readFormString(formData, "releaseReason"),
    releasedAt: new Date().toISOString(),
    idempotencyKey: `combined_${readFormString(formData, "idempotencyKey")}`,
    sourceSystem: readFormString(formData, "sourceSystem") || "saptm",
  };
  const parsed = cargoReleaseInputSchema.safeParse(input);

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
};

export async function registerCargoAction(
  _previousState: CargoRegisterFormState,
  formData: FormData,
): Promise<CargoRegisterFormState> {
  const platformSession = await requirePlatformSession("/app/cargo");

  if (!platformSession.viewer.permissions.includes(registerCargoPermission)) {
    return {
      status: "error",
      message: "A sessao nao tem autorizacao para registar cargas.",
    };
  }

  const parsedInput = parseCargoRegisterFormData(formData);

  if (!("input" in parsedInput)) {
    return parsedInput;
  }

  const releaseImmediately = formData.get("releaseImmediately") === "on";
  const hasReleasePermission =
    releaseImmediately && platformSession.viewer.permissions.includes(releaseCargoPermission);

  if (releaseImmediately && !hasReleasePermission) {
    return {
      status: "error",
      message: "A sessao nao possui cargo.release para libertar cargas apos registo.",
    };
  }

  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie");

  // 1. Register cargo
  const registerUrl = new URL("/rpc/cargo/register", getClientEnv().NEXT_PUBLIC_API_URL);
  const registerResponse = await fetch(registerUrl, {
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

  if (registerResponse.status === 401 || registerResponse.status === 403) {
    return {
      status: "error",
      message: "API recusou o registo por sessao, organizacao ou permissao insuficiente.",
    };
  }

  if (!registerResponse.ok) {
    return {
      status: "error",
      message: `API de cargas recusou o registo: HTTP ${registerResponse.status}.`,
    };
  }

  const registerEnvelope = (await registerResponse.json()) as RpcJsonEnvelope;
  const parsedRegisterOutput = cargoRegisterOutputSchema.safeParse(registerEnvelope.json);

  if (!parsedRegisterOutput.success) {
    return {
      status: "error",
      message: "Contrato RPC de cargas retornou resposta invalida para o registo.",
    };
  }

  const cargoId = parsedRegisterOutput.data.cargoId;
  const cargoReference = parsedRegisterOutput.data.cargo.cargoReference;
  const movementBlocked = parsedRegisterOutput.data.businessRules.movementBlocked;
  const inspectionRequired = parsedRegisterOutput.data.businessRules.inspectionRequired;

  // 2. If releaseImmediately, also release the cargo
  if (releaseImmediately && hasReleasePermission) {
    const parsedRelease = parseCargoReleaseFormDataCombined(formData, cargoId);

    if (!("input" in parsedRelease)) {
      // Register succeeded but release parsing failed
      return {
        status: "success",
        message: `Carga registada mas libertacao falhou: ${parsedRelease.message}`,
        cargoId,
        cargoReference,
        idempotencyKey: parsedRegisterOutput.data.idempotency.key,
        movementBlocked,
        inspectionRequired,
        releaseStatus: "release_parse_error",
        releaseCargoId: cargoId,
      };
    }

    const releaseUrl = new URL("/rpc/cargo/release", getClientEnv().NEXT_PUBLIC_API_URL);
    const releaseResponse = await fetch(releaseUrl, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(cookieHeader === null ? {} : { cookie: cookieHeader }),
      },
      body: JSON.stringify({
        json: parsedRelease.input,
      }),
    });

    if (releaseResponse.status === 401 || releaseResponse.status === 403) {
      return {
        status: "success",
        message: "Carga registada mas API recusou a libertacao por permissoes.",
        cargoId,
        cargoReference,
        idempotencyKey: parsedRegisterOutput.data.idempotency.key,
        movementBlocked,
        inspectionRequired,
        releaseStatus: "release_auth_error",
        releaseCargoId: cargoId,
      };
    }

    if (!releaseResponse.ok) {
      return {
        status: "success",
        message: `Carga registada mas API recusou a libertacao: HTTP ${releaseResponse.status}.`,
        cargoId,
        cargoReference,
        idempotencyKey: parsedRegisterOutput.data.idempotency.key,
        movementBlocked,
        inspectionRequired,
        releaseStatus: "release_api_error",
        releaseCargoId: cargoId,
      };
    }

    const releaseEnvelope = (await releaseResponse.json()) as RpcJsonEnvelope;
    const parsedReleaseOutput = cargoReleaseOutputSchema.safeParse(releaseEnvelope.json);

    if (!parsedReleaseOutput.success) {
      return {
        status: "success",
        message: "Carga registada mas resposta de libertacao invalida do RPC.",
        cargoId,
        cargoReference,
        idempotencyKey: parsedRegisterOutput.data.idempotency.key,
        movementBlocked,
        inspectionRequired,
        releaseStatus: "release_output_error",
        releaseCargoId: cargoId,
      };
    }

    revalidatePath("/app/cargo");

    return {
      status: "success",
      message: parsedReleaseOutput.data.idempotency.replayed
        ? "Carga registada e libertacao ja tinha sido processada (idempotente)."
        : "Carga registada e libertada com regras de negocio, audit trail e outbox.",
      cargoId,
      cargoReference,
      idempotencyKey: parsedReleaseOutput.data.idempotency.key,
      movementBlocked: parsedReleaseOutput.data.businessRules.movementBlocked,
      inspectionRequired: false,
      releaseStatus: "released",
      releaseCargoId: cargoId,
    };
  }

  revalidatePath("/app/cargo");

  return {
    status: "success",
    message: parsedRegisterOutput.data.idempotency.replayed
      ? "Carga ja tinha sido registada; resposta idempotente reaproveitada."
      : "Carga registada com regras de negocio, audit trail e outbox.",
    cargoId,
    cargoReference,
    idempotencyKey: parsedRegisterOutput.data.idempotency.key,
    movementBlocked,
    inspectionRequired,
  };
}

export async function releaseCargoAction(
  _previousState: CargoReleaseFormState,
  formData: FormData,
): Promise<CargoReleaseFormState> {
  const platformSession = await requirePlatformSession("/app/cargo");

  if (!platformSession.viewer.permissions.includes(releaseCargoPermission)) {
    return {
      status: "error",
      message: "A sessao nao possui cargo.release para liberar cargas.",
    };
  }

  const parsedInput = parseCargoReleaseFormData(formData);

  if (!("input" in parsedInput)) {
    return parsedInput;
  }

  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie");
  const url = new URL("/rpc/cargo/release", getClientEnv().NEXT_PUBLIC_API_URL);
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
      message: "API recusou a liberacao por sessao, organizacao ou permissao insuficiente.",
    };
  }

  if (!response.ok) {
    return {
      status: "error",
      message: `API de cargas recusou a liberacao: HTTP ${response.status}.`,
    };
  }

  const envelope = (await response.json()) as RpcJsonEnvelope;
  const parsedOutput = cargoReleaseOutputSchema.safeParse(envelope.json);

  if (!parsedOutput.success) {
    return {
      status: "error",
      message: "Contrato RPC de cargas retornou resposta invalida para liberacao.",
    };
  }

  revalidatePath("/app/cargo");

  return {
    status: "success",
    message: parsedOutput.data.idempotency.replayed
      ? "Liberacao ja tinha sido processada; resposta idempotente reaproveitada."
      : "Carga liberada para transporte com regras de negocio, audit trail e outbox.",
    cargoId: parsedOutput.data.cargoId,
    cargoReference: parsedOutput.data.cargo.cargoReference,
    idempotencyKey: parsedOutput.data.idempotency.key,
    releaseAllowed: parsedOutput.data.businessRules.releaseAllowed,
    movementBlocked: parsedOutput.data.businessRules.movementBlocked,
  };
}

export async function planCargoTransportAction(
  _previousState: CargoTransportPlanFormState,
  formData: FormData,
): Promise<CargoTransportPlanFormState> {
  const platformSession = await requirePlatformSession("/app/cargo");

  if (!platformSession.viewer.permissions.includes(planCargoTransportPermission)) {
    return {
      status: "error",
      message: "A sessao nao possui cargo.transport.plan para criar tracking operacional.",
    };
  }

  const parsedInput = parseCargoTransportPlanFormData(formData);

  if (!("input" in parsedInput)) {
    return parsedInput;
  }

  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie");
  const url = new URL("/rpc/cargo/planTransport", getClientEnv().NEXT_PUBLIC_API_URL);
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
      message: "API recusou o plano por sessao, organizacao ou permissao insuficiente.",
    };
  }

  if (!response.ok) {
    return {
      status: "error",
      message: `API de cargas recusou o plano de transporte: HTTP ${response.status}.`,
    };
  }

  const envelope = (await response.json()) as RpcJsonEnvelope;
  const parsedOutput = cargoTransportPlanOutputSchema.safeParse(envelope.json);

  if (!parsedOutput.success) {
    return {
      status: "error",
      message: "Contrato RPC de cargas retornou resposta invalida para plano de transporte.",
    };
  }

  revalidatePath("/app/cargo");
  revalidatePath("/app/tracking");

  return {
    status: "success",
    message: parsedOutput.data.idempotency.replayed
      ? "Plano de transporte ja tinha sido processado; resposta idempotente reaproveitada."
      : "Tracking operacional criado a partir da carga liberada com audit trail e outbox.",
    cargoId: parsedOutput.data.cargoId,
    cargoReference: parsedOutput.data.cargo.cargoReference,
    shipmentId: parsedOutput.data.shipmentId,
    shipmentReferenceCode: parsedOutput.data.shipment.referenceCode,
    idempotencyKey: parsedOutput.data.idempotency.key,
    planningAllowed: parsedOutput.data.businessRules.planningAllowed,
    trackingLinked: parsedOutput.data.businessRules.trackingLinked,
  };
}

export async function departCargoTransportAction(
  _previousState: CargoTransportDepartFormState,
  formData: FormData,
): Promise<CargoTransportDepartFormState> {
  const platformSession = await requirePlatformSession("/app/cargo");

  if (!platformSession.viewer.permissions.includes(departCargoTransportPermission)) {
    return {
      status: "error",
      message: "A sessao nao possui cargo.transport.depart para iniciar partida.",
    };
  }

  const parsedInput = parseCargoTransportDepartFormData(formData);

  if (!("input" in parsedInput)) {
    return parsedInput;
  }

  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie");
  const url = new URL("/rpc/cargo/departTransport", getClientEnv().NEXT_PUBLIC_API_URL);
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
      message: "API recusou a partida por sessao, organizacao ou permissao insuficiente.",
    };
  }

  if (!response.ok) {
    return {
      status: "error",
      message: `API de cargas recusou a partida: HTTP ${response.status}.`,
    };
  }

  const envelope = (await response.json()) as RpcJsonEnvelope;
  const parsedOutput = cargoTransportDepartOutputSchema.safeParse(envelope.json);

  if (!parsedOutput.success) {
    return {
      status: "error",
      message: "Contrato RPC de cargas retornou resposta invalida para partida.",
    };
  }

  revalidatePath("/app/cargo");
  revalidatePath("/app/tracking");

  return {
    status: "success",
    message: parsedOutput.data.idempotency.replayed
      ? "Partida ja tinha sido processada; resposta idempotente reaproveitada."
      : "Carga partiu com compliance aprovado, tracking departed, audit trail e outbox.",
    cargoId: parsedOutput.data.cargoId,
    cargoReference: parsedOutput.data.cargo.cargoReference,
    shipmentId: parsedOutput.data.shipmentId,
    eventId: parsedOutput.data.eventId,
    idempotencyKey: parsedOutput.data.idempotency.key,
    departureAllowed: parsedOutput.data.businessRules.departureAllowed,
    approvedComplianceEvidencePresent:
      parsedOutput.data.businessRules.approvedComplianceEvidencePresent,
  };
}

export async function arriveCargoTransportAction(
  _previousState: CargoTransportArriveFormState,
  formData: FormData,
): Promise<CargoTransportArriveFormState> {
  const platformSession = await requirePlatformSession("/app/cargo");

  if (!platformSession.viewer.permissions.includes(arriveCargoTransportPermission)) {
    return {
      status: "error",
      message: "A sessao nao tem autorizacao para confirmar chegadas.",
    };
  }

  const parsedInput = parseCargoTransportArriveFormData(formData);

  if (!("input" in parsedInput)) {
    return parsedInput;
  }

  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie");
  const url = new URL("/rpc/cargo/arriveTransport", getClientEnv().NEXT_PUBLIC_API_URL);
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
      message: "API recusou a chegada por sessao, organizacao ou permissao insuficiente.",
    };
  }

  if (!response.ok) {
    return {
      status: "error",
      message: `API de cargas recusou a chegada: HTTP ${response.status}.`,
    };
  }

  const envelope = (await response.json()) as RpcJsonEnvelope;
  const parsedOutput = cargoTransportArriveOutputSchema.safeParse(envelope.json);

  if (!parsedOutput.success) {
    return {
      status: "error",
      message: "Contrato RPC de cargas retornou resposta invalida para chegada.",
    };
  }

  revalidatePath("/app/cargo");
  revalidatePath("/app/tracking");

  return {
    status: "success",
    message: parsedOutput.data.idempotency.replayed
      ? "Chegada ja tinha sido processada; resposta idempotente reaproveitada."
      : "Chegada confirmada com tracking arrived, audit trail e outbox.",
    cargoId: parsedOutput.data.cargoId,
    cargoReference: parsedOutput.data.cargo.cargoReference,
    shipmentId: parsedOutput.data.shipmentId,
    eventId: parsedOutput.data.eventId,
    idempotencyKey: parsedOutput.data.idempotency.key,
    arrivalAllowed: parsedOutput.data.businessRules.arrivalAllowed,
    trackingShipmentInTransit: parsedOutput.data.businessRules.trackingShipmentInTransit,
  };
}

export async function completeCargoDeliveryAction(
  _previousState: CargoDeliveryCompleteFormState,
  formData: FormData,
): Promise<CargoDeliveryCompleteFormState> {
  const platformSession = await requirePlatformSession("/app/cargo");

  if (!platformSession.viewer.permissions.includes(completeCargoDeliveryPermission)) {
    return {
      status: "error",
      message: "A sessao nao possui cargo.delivery.complete para concluir entrega.",
    };
  }

  const parsedInput = parseCargoDeliveryCompleteFormData(formData);

  if (!("input" in parsedInput)) {
    return parsedInput;
  }

  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie");
  const url = new URL("/rpc/cargo/completeDelivery", getClientEnv().NEXT_PUBLIC_API_URL);
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
      message: "API recusou a entrega por sessao, organizacao ou permissao insuficiente.",
    };
  }

  if (!response.ok) {
    return {
      status: "error",
      message: `API de cargas recusou a entrega: HTTP ${response.status}.`,
    };
  }

  const envelope = (await response.json()) as RpcJsonEnvelope;
  const parsedOutput = cargoDeliveryCompleteOutputSchema.safeParse(envelope.json);

  if (!parsedOutput.success) {
    return {
      status: "error",
      message: "Contrato RPC de cargas retornou resposta invalida para entrega.",
    };
  }

  revalidatePath("/app/cargo");
  revalidatePath("/app/tracking");

  return {
    status: "success",
    message: parsedOutput.data.idempotency.replayed
      ? "Entrega ja tinha sido processada; resposta idempotente reaproveitada."
      : "Entrega concluida com cargo delivered, tracking completed, audit trail e outbox.",
    cargoId: parsedOutput.data.cargoId,
    cargoReference: parsedOutput.data.cargo.cargoReference,
    shipmentId: parsedOutput.data.shipmentId,
    eventId: parsedOutput.data.eventId,
    idempotencyKey: parsedOutput.data.idempotency.key,
    deliveryAllowed: parsedOutput.data.businessRules.deliveryAllowed,
    deliveryConditionAccepted: parsedOutput.data.businessRules.deliveryConditionAccepted,
  };
}

export async function recordCargoOperationalHandoffAction(
  _previousState: CargoOperationalHandoffRecordFormState,
  formData: FormData,
): Promise<CargoOperationalHandoffRecordFormState> {
  const platformSession = await requirePlatformSession("/app/cargo");

  if (!platformSession.viewer.permissions.includes(recordCargoOperationalHandoffPermission)) {
    return {
      status: "error",
      message: "A sessao nao possui cargo.handoff.record para registar handoff operacional.",
    };
  }

  const parsedInput = parseCargoOperationalHandoffRecordFormData(formData);

  if (!("input" in parsedInput)) {
    return parsedInput;
  }

  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie");
  const url = new URL("/rpc/cargo/recordOperationalHandoff", getClientEnv().NEXT_PUBLIC_API_URL);
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
      message: "API recusou o handoff por sessao, organizacao ou permissao insuficiente.",
    };
  }

  if (!response.ok) {
    return {
      status: "error",
      message: `API de cargas recusou o handoff operacional: HTTP ${response.status}.`,
    };
  }

  const envelope = (await response.json()) as RpcJsonEnvelope;
  const parsedOutput = cargoOperationalHandoffRecordOutputSchema.safeParse(envelope.json);

  if (!parsedOutput.success) {
    return {
      status: "error",
      message: "Contrato RPC de cargas retornou resposta invalida para handoff operacional.",
    };
  }

  revalidatePath("/app/cargo");
  revalidatePath("/app/tracking");

  return {
    status: "success",
    message: parsedOutput.data.idempotency.replayed
      ? "Handoff ja tinha sido registado; resposta idempotente reaproveitada."
      : "Handoff operacional registado com transferencia de custodia, tracking, audit e outbox.",
    cargoId: parsedOutput.data.cargoId,
    cargoReference: parsedOutput.data.cargo.cargoReference,
    handoffId: parsedOutput.data.handoffId,
    shipmentId: parsedOutput.data.shipmentId,
    eventId: parsedOutput.data.eventId,
    idempotencyKey: parsedOutput.data.idempotency.key,
    handoffAllowed: parsedOutput.data.businessRules.handoffAllowed,
    custodyChanged: parsedOutput.data.businessRules.custodyChanged,
  };
}

export async function recordCargoDeliveryExceptionAction(
  _previousState: CargoDeliveryExceptionRecordFormState,
  formData: FormData,
): Promise<CargoDeliveryExceptionRecordFormState> {
  const platformSession = await requirePlatformSession("/app/cargo");

  if (!platformSession.viewer.permissions.includes(recordCargoDeliveryExceptionPermission)) {
    return {
      status: "error",
      message:
        "A sessao nao possui cargo.delivery.exception.record para registar excecao de entrega.",
    };
  }

  const parsedInput = parseCargoDeliveryExceptionRecordFormData(formData);

  if (!("input" in parsedInput)) {
    return parsedInput;
  }

  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie");
  const url = new URL("/rpc/cargo/recordDeliveryException", getClientEnv().NEXT_PUBLIC_API_URL);
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
      message: "API recusou a excecao por sessao, organizacao ou permissao insuficiente.",
    };
  }

  if (!response.ok) {
    return {
      status: "error",
      message: `API de cargas recusou a excecao de entrega: HTTP ${response.status}.`,
    };
  }

  const envelope = (await response.json()) as RpcJsonEnvelope;
  const parsedOutput = cargoDeliveryExceptionRecordOutputSchema.safeParse(envelope.json);

  if (!parsedOutput.success) {
    return {
      status: "error",
      message: "Contrato RPC de cargas retornou resposta invalida para excecao de entrega.",
    };
  }

  revalidatePath("/app/cargo");
  revalidatePath("/app/tracking");

  return {
    status: "success",
    message: parsedOutput.data.idempotency.replayed
      ? "Excecao ja tinha sido registada; resposta idempotente reaproveitada."
      : "Excecao de entrega registada com cargo held, tracking exception, audit e outbox.",
    cargoId: parsedOutput.data.cargoId,
    exceptionId: parsedOutput.data.exceptionId,
    shipmentId: parsedOutput.data.shipmentId,
    eventId: parsedOutput.data.eventId,
    idempotencyKey: parsedOutput.data.idempotency.key,
    exceptionAccepted: parsedOutput.data.businessRules.exceptionAccepted,
  };
}

export async function recordCargoClaimSettlementAction(
  _previousState: CargoClaimSettlementRecordFormState,
  formData: FormData,
): Promise<CargoClaimSettlementRecordFormState> {
  const platformSession = await requirePlatformSession("/app/cargo");

  if (!platformSession.viewer.permissions.includes(recordCargoClaimSettlementPermission)) {
    return {
      status: "error",
      message: "A sessao nao possui cargo.claim.settle para liquidar claims de carga.",
    };
  }

  const parsedInput = parseCargoClaimSettlementRecordFormData(formData);

  if (!("input" in parsedInput)) {
    return parsedInput;
  }

  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie");
  const url = new URL("/rpc/cargo/recordClaimSettlement", getClientEnv().NEXT_PUBLIC_API_URL);
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
      message: "API recusou o settlement por sessao, organizacao ou permissao insuficiente.",
    };
  }

  if (!response.ok) {
    return {
      status: "error",
      message: `API de cargas recusou a liquidacao da claim: HTTP ${response.status}.`,
    };
  }

  const envelope = (await response.json()) as RpcJsonEnvelope;
  const parsedOutput = cargoClaimSettlementRecordOutputSchema.safeParse(envelope.json);

  if (!parsedOutput.success) {
    return {
      status: "error",
      message: "Contrato RPC de cargas retornou resposta invalida para settlement de claim.",
    };
  }

  revalidatePath("/app/cargo");

  return {
    status: "success",
    message: parsedOutput.data.idempotency.replayed
      ? "Settlement da claim ja tinha sido registado; resposta idempotente reaproveitada."
      : "Settlement contabilistico registado com regras P8, audit trail e outbox.",
    cargoId: parsedOutput.data.cargoId,
    exceptionId: parsedOutput.data.exceptionId,
    settlementId: parsedOutput.data.settlementId,
    settlementReference: parsedOutput.data.settlement.settlementReference,
    idempotencyKey: parsedOutput.data.idempotency.key,
    settlementAllowed: parsedOutput.data.businessRules.settlementAllowed,
    claimReferenceMatched: parsedOutput.data.businessRules.claimReferenceMatched,
  };
}

export async function resolveCargoDeliveryExceptionAction(
  _previousState: CargoDeliveryExceptionResolveFormState,
  formData: FormData,
): Promise<CargoDeliveryExceptionResolveFormState> {
  const platformSession = await requirePlatformSession("/app/cargo");

  if (!platformSession.viewer.permissions.includes(resolveCargoDeliveryExceptionPermission)) {
    return {
      status: "error",
      message:
        "A sessao nao possui cargo.delivery.exception.resolve para resolver excecao de entrega.",
    };
  }

  const parsedInput = parseCargoDeliveryExceptionResolveFormData(formData);

  if (!("input" in parsedInput)) {
    return parsedInput;
  }

  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie");
  const url = new URL("/rpc/cargo/resolveDeliveryException", getClientEnv().NEXT_PUBLIC_API_URL);
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
      message:
        "API recusou a resolucao da excecao por sessao, organizacao ou permissao insuficiente.",
    };
  }

  if (!response.ok) {
    return {
      status: "error",
      message: `API de cargas recusou a resolucao da excecao: HTTP ${response.status}.`,
    };
  }

  const envelope = (await response.json()) as RpcJsonEnvelope;
  const parsedOutput = cargoDeliveryExceptionResolveOutputSchema.safeParse(envelope.json);

  if (!parsedOutput.success) {
    return {
      status: "error",
      message: "Contrato RPC de cargas retornou resposta invalida para resolucao de excecao.",
    };
  }

  revalidatePath("/app/cargo");
  revalidatePath("/app/tracking");

  return {
    status: "success",
    message: parsedOutput.data.idempotency.replayed
      ? "Resolucao ja tinha sido processada; resposta idempotente reaproveitada."
      : "Excecao resolvida; carga restaurada para entrega final com audit e outbox.",
    cargoId: parsedOutput.data.cargoId,
    exceptionId: parsedOutput.data.exceptionId,
    shipmentId: parsedOutput.data.shipmentId,
    eventId: parsedOutput.data.eventId,
    idempotencyKey: parsedOutput.data.idempotency.key,
    resolutionAllowed: parsedOutput.data.businessRules.resolutionAllowed,
  };
}

export async function recordCargoComplianceEvidenceAction(
  _previousState: CargoComplianceEvidenceRecordFormState,
  formData: FormData,
): Promise<CargoComplianceEvidenceRecordFormState> {
  const platformSession = await requirePlatformSession("/app/cargo");

  if (!platformSession.viewer.permissions.includes(recordComplianceEvidencePermission)) {
    return {
      status: "error",
      message: "A sessao nao possui cargo.compliance.record para registar evidencias.",
    };
  }

  const parsedInput = parseCargoComplianceEvidenceRecordFormData(formData);

  if (!("input" in parsedInput)) {
    return parsedInput;
  }

  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie");
  const url = new URL("/rpc/cargo/recordComplianceEvidence", getClientEnv().NEXT_PUBLIC_API_URL);
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
      message: "API recusou a evidencia por sessao, organizacao ou permissao insuficiente.",
    };
  }

  if (!response.ok) {
    return {
      status: "error",
      message: `API de cargas recusou a evidencia: HTTP ${response.status}.`,
    };
  }

  const envelope = (await response.json()) as RpcJsonEnvelope;
  const parsedOutput = cargoComplianceEvidenceRecordOutputSchema.safeParse(envelope.json);

  if (!parsedOutput.success) {
    return {
      status: "error",
      message: "Contrato RPC de cargas retornou resposta invalida para evidencia.",
    };
  }

  revalidatePath("/app/cargo");

  return {
    status: "success",
    message: parsedOutput.data.idempotency.replayed
      ? "Evidencia ja tinha sido registada; resposta idempotente reaproveitada."
      : "Evidencia registada para revisao com audit trail e outbox.",
    cargoId: parsedOutput.data.cargoId,
    evidenceId: parsedOutput.data.evidenceId,
    evidenceType: parsedOutput.data.evidence.evidenceType,
    documentReference: parsedOutput.data.evidence.documentReference,
    idempotencyKey: parsedOutput.data.idempotency.key,
    reviewRequired: parsedOutput.data.businessRules.reviewRequired,
  };
}

export async function verifyCargoComplianceEvidenceAction(
  _previousState: CargoComplianceEvidenceVerifyFormState,
  formData: FormData,
): Promise<CargoComplianceEvidenceVerifyFormState> {
  const platformSession = await requirePlatformSession("/app/cargo");

  if (!platformSession.viewer.permissions.includes(verifyComplianceEvidencePermission)) {
    return {
      status: "error",
      message: "A sessao nao possui cargo.compliance.verify para verificar evidencias.",
    };
  }

  const parsedInput = parseCargoComplianceEvidenceVerifyFormData(formData);

  if (!("input" in parsedInput)) {
    return parsedInput;
  }

  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie");
  const url = new URL("/rpc/cargo/verifyComplianceEvidence", getClientEnv().NEXT_PUBLIC_API_URL);
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
      message: "API recusou a verificacao por sessao, organizacao ou permissao insuficiente.",
    };
  }

  if (!response.ok) {
    return {
      status: "error",
      message: `API de cargas recusou a verificacao: HTTP ${response.status}.`,
    };
  }

  const envelope = (await response.json()) as RpcJsonEnvelope;
  const parsedOutput = cargoComplianceEvidenceVerifyOutputSchema.safeParse(envelope.json);

  if (!parsedOutput.success) {
    return {
      status: "error",
      message: "Contrato RPC de cargas retornou resposta invalida para verificacao.",
    };
  }

  revalidatePath("/app/cargo");

  return {
    status: "success",
    message: parsedOutput.data.idempotency.replayed
      ? "Verificacao ja tinha sido processada; resposta idempotente reaproveitada."
      : "Evidencia verificada com regras de negocio, audit trail e outbox.",
    cargoId: parsedOutput.data.cargoId,
    evidenceId: parsedOutput.data.evidenceId,
    statusValue: parsedOutput.data.evidence.status,
    idempotencyKey: parsedOutput.data.idempotency.key,
    evidenceApproved: parsedOutput.data.businessRules.evidenceApproved,
    evidenceRejected: parsedOutput.data.businessRules.evidenceRejected,
  };
}

function parseCargoRegisterFormData(formData: FormData):
  | {
      status: "ok";
      input: CargoRegisterInput;
    }
  | CargoRegisterFormState {
  const input = {
    cargoReference: readFormString(formData, "cargoReference"),
    externalReference: readOptionalFormString(formData, "externalReference"),
    cargoDescription: readFormString(formData, "cargoDescription"),
    cargoType: readFormString(formData, "cargoType"),
    grossWeightKg: readFormNumber(formData, "grossWeightKg"),
    packageCount: readFormInteger(formData, "packageCount"),
    volumeM3: readOptionalFormNumber(formData, "volumeM3"),
    shipperName: readFormString(formData, "shipperName"),
    consigneeName: readFormString(formData, "consigneeName"),
    originName: readFormString(formData, "originName"),
    destinationName: readFormString(formData, "destinationName"),
    custodyOwnerName: readFormString(formData, "custodyOwnerName"),
    priority: readFormInteger(formData, "priority"),
    customsStatus: readFormString(formData, "customsStatus"),
    customsReference: readOptionalFormString(formData, "customsReference"),
    conditionStatus: readFormString(formData, "conditionStatus"),
    hazardous: formData.get("hazardous") === "on",
    unNumber: readOptionalFormString(formData, "unNumber"),
    hazardClass: readOptionalFormString(formData, "hazardClass"),
    requiresInspection: formData.get("requiresInspection") === "on",
    expectedReadyAt: readOptionalDatetimeLocal(formData, "expectedReadyAt"),
    idempotencyKey: readFormString(formData, "idempotencyKey"),
    sourceSystem: readFormString(formData, "sourceSystem"),
  };
  const parsed = cargoRegisterInputSchema.safeParse(input);

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

function parseCargoReleaseFormData(formData: FormData):
  | {
      status: "ok";
      input: CargoReleaseInput;
    }
  | CargoReleaseFormState {
  const input = {
    cargoId: readFormString(formData, "cargoId"),
    customsStatus: readFormString(formData, "customsStatus"),
    inspectionOutcome: readFormString(formData, "inspectionOutcome"),
    releaseReference: readOptionalFormString(formData, "releaseReference"),
    releaseReason: readFormString(formData, "releaseReason"),
    releasedAt: readOptionalDatetimeLocal(formData, "releasedAt"),
    idempotencyKey: readFormString(formData, "idempotencyKey"),
    sourceSystem: readFormString(formData, "sourceSystem"),
  };
  const parsed = cargoReleaseInputSchema.safeParse(input);

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

function parseCargoTransportPlanFormData(formData: FormData):
  | {
      status: "ok";
      input: CargoTransportPlanInput;
    }
  | CargoTransportPlanFormState {
  const input = {
    cargoId: readFormString(formData, "cargoId"),
    referenceCode: readOptionalFormString(formData, "referenceCode"),
    transportMode: readFormString(formData, "transportMode"),
    plannedDepartureAt: readDatetimeLocal(formData, "plannedDepartureAt"),
    estimatedArrivalAt: readDatetimeLocal(formData, "estimatedArrivalAt"),
    operationsOwnerTeam: readFormString(formData, "operationsOwnerTeam"),
    planningReference: readOptionalFormString(formData, "planningReference"),
    firstCheckpointName: readOptionalFormString(formData, "firstCheckpointName"),
    idempotencyKey: readFormString(formData, "idempotencyKey"),
    sourceSystem: readFormString(formData, "sourceSystem"),
  };
  const parsed = cargoTransportPlanInputSchema.safeParse(input);

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

function parseCargoTransportDepartFormData(formData: FormData):
  | {
      status: "ok";
      input: CargoTransportDepartInput;
    }
  | CargoTransportDepartFormState {
  const input = {
    cargoId: readFormString(formData, "cargoId"),
    departedAt: readDatetimeLocal(formData, "departedAt"),
    departureLocationName: readFormString(formData, "departureLocationName"),
    operatorName: readFormString(formData, "operatorName"),
    departureReference: readOptionalFormString(formData, "departureReference"),
    carrierReference: readOptionalFormString(formData, "carrierReference"),
    idempotencyKey: readFormString(formData, "idempotencyKey"),
    sourceSystem: readFormString(formData, "sourceSystem"),
  };
  const parsed = cargoTransportDepartInputSchema.safeParse(input);

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

function parseCargoTransportArriveFormData(formData: FormData):
  | {
      status: "ok";
      input: CargoTransportArriveInput;
    }
  | CargoTransportArriveFormState {
  const input = {
    cargoId: readFormString(formData, "cargoId"),
    arrivedAt: readDatetimeLocal(formData, "arrivedAt"),
    arrivalLocationName: readFormString(formData, "arrivalLocationName"),
    operatorName: readFormString(formData, "operatorName"),
    arrivalReference: readOptionalFormString(formData, "arrivalReference"),
    idempotencyKey: readFormString(formData, "idempotencyKey"),
    sourceSystem: readFormString(formData, "sourceSystem"),
  };
  const parsed = cargoTransportArriveInputSchema.safeParse(input);

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

function parseCargoDeliveryCompleteFormData(formData: FormData):
  | {
      status: "ok";
      input: CargoDeliveryCompleteInput;
    }
  | CargoDeliveryCompleteFormState {
  const input = {
    cargoId: readFormString(formData, "cargoId"),
    deliveredAt: readDatetimeLocal(formData, "deliveredAt"),
    receivedByName: readFormString(formData, "receivedByName"),
    deliveryReference: readFormString(formData, "deliveryReference"),
    deliveryConditionStatus: readFormString(formData, "deliveryConditionStatus"),
    deliveryNotes: readOptionalFormString(formData, "deliveryNotes"),
    idempotencyKey: readFormString(formData, "idempotencyKey"),
    sourceSystem: readFormString(formData, "sourceSystem"),
  };
  const parsed = cargoDeliveryCompleteInputSchema.safeParse(input);

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

function parseCargoDeliveryExceptionRecordFormData(formData: FormData):
  | {
      status: "ok";
      input: CargoDeliveryExceptionRecordInput;
    }
  | CargoDeliveryExceptionRecordFormState {
  const input = {
    cargoId: readFormString(formData, "cargoId"),
    exceptionType: readFormString(formData, "exceptionType"),
    deliveryConditionStatus: readFormString(formData, "deliveryConditionStatus"),
    occurredAt: readDatetimeLocal(formData, "occurredAt"),
    reportedByName: readFormString(formData, "reportedByName"),
    exceptionSummary: readFormString(formData, "exceptionSummary"),
    evidenceReference: readFormString(formData, "evidenceReference"),
    claimReference: readOptionalFormString(formData, "claimReference"),
    idempotencyKey: readFormString(formData, "idempotencyKey"),
    sourceSystem: readFormString(formData, "sourceSystem"),
  };
  const parsed = cargoDeliveryExceptionRecordInputSchema.safeParse(input);

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

function parseCargoOperationalHandoffRecordFormData(formData: FormData):
  | {
      status: "ok";
      input: CargoOperationalHandoffRecordInput;
    }
  | CargoOperationalHandoffRecordFormState {
  const input = {
    cargoId: readFormString(formData, "cargoId"),
    handoffType: readFormString(formData, "handoffType"),
    handoffAt: readDatetimeLocal(formData, "handoffAt"),
    handoffLocationName: readFormString(formData, "handoffLocationName"),
    fromCustodyOwnerName: readFormString(formData, "fromCustodyOwnerName"),
    toCustodyOwnerName: readFormString(formData, "toCustodyOwnerName"),
    operatorName: readFormString(formData, "operatorName"),
    handoffReference: readFormString(formData, "handoffReference"),
    sealReference: readOptionalFormString(formData, "sealReference"),
    conditionStatus: "sound",
    handoffNotes: readOptionalFormString(formData, "handoffNotes"),
    idempotencyKey: readFormString(formData, "idempotencyKey"),
    sourceSystem: readFormString(formData, "sourceSystem"),
  };
  const parsed = cargoOperationalHandoffRecordInputSchema.safeParse(input);

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

function parseCargoClaimSettlementRecordFormData(formData: FormData):
  | {
      status: "ok";
      input: CargoClaimSettlementRecordInput;
    }
  | CargoClaimSettlementRecordFormState {
  const input = {
    exceptionId: readFormString(formData, "exceptionId"),
    claimReference: readFormString(formData, "claimReference"),
    settlementReference: readFormString(formData, "settlementReference"),
    settlementType: readFormString(formData, "settlementType"),
    currencyCode: readFormString(formData, "currencyCode"),
    settlementAmount: readFormNumber(formData, "settlementAmount"),
    settledByName: readFormString(formData, "settledByName"),
    counterpartyName: readFormString(formData, "counterpartyName"),
    settlementSummary: readFormString(formData, "settlementSummary"),
    settledAt: readDatetimeLocal(formData, "settledAt"),
    idempotencyKey: readFormString(formData, "idempotencyKey"),
    sourceSystem: readFormString(formData, "sourceSystem"),
  };
  const parsed = cargoClaimSettlementRecordInputSchema.safeParse(input);

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

function parseCargoDeliveryExceptionResolveFormData(formData: FormData):
  | {
      status: "ok";
      input: CargoDeliveryExceptionResolveInput;
    }
  | CargoDeliveryExceptionResolveFormState {
  const input = {
    exceptionId: readFormString(formData, "exceptionId"),
    resolutionCode: readFormString(formData, "resolutionCode"),
    resolvedAt: readDatetimeLocal(formData, "resolvedAt"),
    resolverName: readFormString(formData, "resolverName"),
    resolutionReference: readFormString(formData, "resolutionReference"),
    resolutionSummary: readFormString(formData, "resolutionSummary"),
    finalConditionStatus: "sound",
    idempotencyKey: readFormString(formData, "idempotencyKey"),
    sourceSystem: readFormString(formData, "sourceSystem"),
  };
  const parsed = cargoDeliveryExceptionResolveInputSchema.safeParse(input);

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

function parseCargoComplianceEvidenceRecordFormData(formData: FormData):
  | {
      status: "ok";
      input: CargoComplianceEvidenceRecordInput;
    }
  | CargoComplianceEvidenceRecordFormState {
  const input = {
    cargoId: readFormString(formData, "cargoId"),
    evidenceType: readFormString(formData, "evidenceType"),
    documentReference: readFormString(formData, "documentReference"),
    documentTitle: readFormString(formData, "documentTitle"),
    documentUri: readOptionalFormString(formData, "documentUri"),
    issuerName: readFormString(formData, "issuerName"),
    issuedAt: readOptionalDatetimeLocal(formData, "issuedAt"),
    expiresAt: readOptionalDatetimeLocal(formData, "expiresAt"),
    idempotencyKey: readFormString(formData, "idempotencyKey"),
    sourceSystem: readFormString(formData, "sourceSystem"),
  };
  const parsed = cargoComplianceEvidenceRecordInputSchema.safeParse(input);

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

function parseCargoComplianceEvidenceVerifyFormData(formData: FormData):
  | {
      status: "ok";
      input: CargoComplianceEvidenceVerifyInput;
    }
  | CargoComplianceEvidenceVerifyFormState {
  const input = {
    evidenceId: readFormString(formData, "evidenceId"),
    status: readFormString(formData, "status"),
    reviewerName: readFormString(formData, "reviewerName"),
    reviewReference: readFormString(formData, "reviewReference"),
    reviewSummary: readFormString(formData, "reviewSummary"),
    rejectionReason: readOptionalFormString(formData, "rejectionReason"),
    reviewedAt: readOptionalDatetimeLocal(formData, "reviewedAt"),
    idempotencyKey: readFormString(formData, "idempotencyKey"),
    sourceSystem: readFormString(formData, "sourceSystem"),
  };
  const parsed = cargoComplianceEvidenceVerifyInputSchema.safeParse(input);

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

function readFormNumber(formData: FormData, key: string): number {
  return Number(readFormString(formData, key));
}

function readOptionalFormNumber(formData: FormData, key: string): number | undefined {
  const value = readOptionalFormString(formData, key);

  return value === undefined ? undefined : Number(value);
}

function readFormInteger(formData: FormData, key: string): number {
  return Number.parseInt(readFormString(formData, key), 10);
}

function readOptionalDatetimeLocal(formData: FormData, key: string): string | undefined {
  const value = readOptionalFormString(formData, key);

  return value === undefined ? undefined : new Date(value).toISOString();
}

function readDatetimeLocal(formData: FormData, key: string): string {
  const value = readFormString(formData, key);
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}
