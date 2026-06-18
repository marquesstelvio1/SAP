"use server";

import type { PlatformPermission } from "@saptm/auth";
import { getClientEnv } from "@saptm/config";
import {
  integrationCarrierTmsMovementInputSchema,
  integrationCarrierTmsMovementOutputSchema,
  integrationCustomsErpStatusInputSchema,
  integrationCustomsErpStatusOutputSchema,
  integrationEventRecordInputSchema,
  integrationEventRecordOutputSchema,
  integrationPortTosMovementInputSchema,
  integrationPortTosMovementOutputSchema,
  integrationRailTmsMovementInputSchema,
  integrationRailTmsMovementOutputSchema,
  integrationServiceAccountCreateInputSchema,
  integrationServiceAccountCreateOutputSchema,
  integrationTelematicsGpsPositionInputSchema,
  integrationTelematicsGpsPositionOutputSchema,
  integrationWarehouseWmsActivityInputSchema,
  integrationWarehouseWmsActivityOutputSchema,
} from "@saptm/rpc";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { requirePlatformSession } from "../../../../lib/auth-session";
import type {
  IntegrationCarrierTmsMovementFormState,
  IntegrationCustomsErpStatusFormState,
  IntegrationEventRecordFormState,
  IntegrationPortTosMovementFormState,
  IntegrationRailTmsMovementFormState,
  IntegrationServiceAccountCreateFormState,
  IntegrationTelematicsGpsPositionFormState,
  IntegrationWarehouseWmsActivityFormState,
} from "./form-state";

const manageApiKeyPermission: PlatformPermission = "integration.api_key.manage";
const ingestEventPermission: PlatformPermission = "integration.event.ingest";

type RpcJsonEnvelope = {
  json?: unknown;
};

export async function createIntegrationServiceAccountAction(
  _previousState: IntegrationServiceAccountCreateFormState,
  formData: FormData,
): Promise<IntegrationServiceAccountCreateFormState> {
  const platformSession = await requirePlatformSession("/app/integrations");

  if (!platformSession.viewer.permissions.includes(manageApiKeyPermission)) {
    return {
      status: "error",
      message: "A sessao nao possui integration.api_key.manage para criar credenciais.",
    };
  }

  const parsedInput = parseServiceAccountFormData(formData);

  if (!("input" in parsedInput)) {
    return parsedInput;
  }

  const result = await callIntegrationMutation(
    "/rpc/integrations/createServiceAccount",
    parsedInput.input,
  );

  if (result.status !== "ok") {
    return {
      status: "error",
      message: result.message,
    };
  }

  const parsedOutput = integrationServiceAccountCreateOutputSchema.safeParse(result.envelope.json);

  if (!parsedOutput.success) {
    return {
      status: "error",
      message: "Contrato RPC de integracoes retornou resposta invalida para service account.",
    };
  }

  revalidatePath("/app/integrations");

  return {
    status: "success",
    message:
      parsedOutput.data.apiKey.plaintext === null
        ? "Service account ja existia por idempotencia; segredo nao e reexibido."
        : "Service account criado com API key hash-only, audit trail e outbox.",
    serviceAccountId: parsedOutput.data.serviceAccount.id,
    apiKeyPrefix: parsedOutput.data.apiKey.prefix,
    plaintextApiKey: parsedOutput.data.apiKey.plaintext,
    replayed: parsedOutput.data.idempotency.replayed,
  };
}

export async function recordIntegrationEventAction(
  _previousState: IntegrationEventRecordFormState,
  formData: FormData,
): Promise<IntegrationEventRecordFormState> {
  const platformSession = await requirePlatformSession("/app/integrations");

  if (!platformSession.viewer.permissions.includes(ingestEventPermission)) {
    return {
      status: "error",
      message: "A sessao nao possui integration.event.ingest para registar eventos externos.",
    };
  }

  const parsedInput = parseIntegrationEventFormData(formData);

  if (!("input" in parsedInput)) {
    return parsedInput;
  }

  const result = await callIntegrationMutation("/rpc/integrations/recordEvent", parsedInput.input);

  if (result.status !== "ok") {
    return {
      status: "error",
      message: result.message,
    };
  }

  const parsedOutput = integrationEventRecordOutputSchema.safeParse(result.envelope.json);

  if (!parsedOutput.success) {
    return {
      status: "error",
      message: "Contrato RPC de integracoes retornou resposta invalida para evento externo.",
    };
  }

  revalidatePath("/app/integrations");

  return {
    status: "success",
    message: "Evento externo registado com idempotencia tenant-scoped, audit trail e outbox.",
    eventId: parsedOutput.data.event.id,
    idempotencyKey: parsedOutput.data.idempotency.key,
    replayed: parsedOutput.data.idempotency.replayed,
  };
}

export async function processPortTosMovementAction(
  _previousState: IntegrationPortTosMovementFormState,
  formData: FormData,
): Promise<IntegrationPortTosMovementFormState> {
  const platformSession = await requirePlatformSession("/app/integrations");

  if (
    !platformSession.viewer.permissions.includes(ingestEventPermission) ||
    !platformSession.viewer.permissions.includes("tracking.event.record")
  ) {
    return {
      status: "error",
      message:
        "A sessao precisa de integration.event.ingest e tracking.event.record para processar Port TOS.",
    };
  }

  const parsedInput = parsePortTosMovementFormData(formData);

  if (!("input" in parsedInput)) {
    return parsedInput;
  }

  const result = await callIntegrationMutation(
    "/rpc/integrations/processPortTosMovement",
    parsedInput.input,
  );

  if (result.status !== "ok") {
    return {
      status: "error",
      message: result.message,
    };
  }

  const parsedOutput = integrationPortTosMovementOutputSchema.safeParse(result.envelope.json);

  if (!parsedOutput.success) {
    return {
      status: "error",
      message: "Contrato RPC de integracoes retornou resposta invalida para Port TOS.",
    };
  }

  revalidatePath("/app/integrations");
  revalidatePath("/app/tracking");

  return {
    status: "success",
    message: "Movimento Port TOS processado em tracking com idempotencia, audit trail e outbox.",
    integrationEventId: parsedOutput.data.integrationEvent.id,
    trackingEventId: parsedOutput.data.trackingEvent.id,
    idempotencyKey: parsedOutput.data.idempotency.key,
    replayed: parsedOutput.data.idempotency.replayed,
  };
}

export async function processRailTmsMovementAction(
  _previousState: IntegrationRailTmsMovementFormState,
  formData: FormData,
): Promise<IntegrationRailTmsMovementFormState> {
  const platformSession = await requirePlatformSession("/app/integrations");

  if (
    !platformSession.viewer.permissions.includes(ingestEventPermission) ||
    !platformSession.viewer.permissions.includes("tracking.event.record")
  ) {
    return {
      status: "error",
      message:
        "A sessao precisa de integration.event.ingest e tracking.event.record para processar Rail TMS.",
    };
  }

  const parsedInput = parseRailTmsMovementFormData(formData);

  if (!("input" in parsedInput)) {
    return parsedInput;
  }

  const result = await callIntegrationMutation(
    "/rpc/integrations/processRailTmsMovement",
    parsedInput.input,
  );

  if (result.status !== "ok") {
    return {
      status: "error",
      message: result.message,
    };
  }

  const parsedOutput = integrationRailTmsMovementOutputSchema.safeParse(result.envelope.json);

  if (!parsedOutput.success) {
    return {
      status: "error",
      message: "Contrato RPC de integracoes retornou resposta invalida para Rail TMS.",
    };
  }

  revalidatePath("/app/integrations");
  revalidatePath("/app/tracking");

  return {
    status: "success",
    message: "Movimento Rail TMS processado em tracking com idempotencia, audit trail e outbox.",
    integrationEventId: parsedOutput.data.integrationEvent.id,
    trackingEventId: parsedOutput.data.trackingEvent.id,
    idempotencyKey: parsedOutput.data.idempotency.key,
    replayed: parsedOutput.data.idempotency.replayed,
  };
}

export async function processCarrierTmsMovementAction(
  _previousState: IntegrationCarrierTmsMovementFormState,
  formData: FormData,
): Promise<IntegrationCarrierTmsMovementFormState> {
  const platformSession = await requirePlatformSession("/app/integrations");

  if (
    !platformSession.viewer.permissions.includes(ingestEventPermission) ||
    !platformSession.viewer.permissions.includes("tracking.event.record")
  ) {
    return {
      status: "error",
      message:
        "A sessao precisa de integration.event.ingest e tracking.event.record para processar Carrier TMS.",
    };
  }

  const parsedInput = parseCarrierTmsMovementFormData(formData);

  if (!("input" in parsedInput)) {
    return parsedInput;
  }

  const result = await callIntegrationMutation(
    "/rpc/integrations/processCarrierTmsMovement",
    parsedInput.input,
  );

  if (result.status !== "ok") {
    return {
      status: "error",
      message: result.message,
    };
  }

  const parsedOutput = integrationCarrierTmsMovementOutputSchema.safeParse(result.envelope.json);

  if (!parsedOutput.success) {
    return {
      status: "error",
      message: "Contrato RPC de integracoes retornou resposta invalida para Carrier TMS.",
    };
  }

  revalidatePath("/app/integrations");
  revalidatePath("/app/tracking");

  return {
    status: "success",
    message: "Movimento Carrier TMS processado em tracking com idempotencia, audit trail e outbox.",
    integrationEventId: parsedOutput.data.integrationEvent.id,
    trackingEventId: parsedOutput.data.trackingEvent.id,
    idempotencyKey: parsedOutput.data.idempotency.key,
    replayed: parsedOutput.data.idempotency.replayed,
  };
}

export async function processTelematicsGpsPositionAction(
  _previousState: IntegrationTelematicsGpsPositionFormState,
  formData: FormData,
): Promise<IntegrationTelematicsGpsPositionFormState> {
  const platformSession = await requirePlatformSession("/app/integrations");

  if (
    !platformSession.viewer.permissions.includes(ingestEventPermission) ||
    !platformSession.viewer.permissions.includes("tracking.event.record")
  ) {
    return {
      status: "error",
      message:
        "A sessao precisa de integration.event.ingest e tracking.event.record para processar Telematics/GPS.",
    };
  }

  const parsedInput = parseTelematicsGpsPositionFormData(formData);

  if (!("input" in parsedInput)) {
    return parsedInput;
  }

  const result = await callIntegrationMutation(
    "/rpc/integrations/processTelematicsGpsPosition",
    parsedInput.input,
  );

  if (result.status !== "ok") {
    return {
      status: "error",
      message: result.message,
    };
  }

  const parsedOutput = integrationTelematicsGpsPositionOutputSchema.safeParse(result.envelope.json);

  if (!parsedOutput.success) {
    return {
      status: "error",
      message: "Contrato RPC de integracoes retornou resposta invalida para Telematics/GPS.",
    };
  }

  revalidatePath("/app/integrations");
  revalidatePath("/app/tracking");

  return {
    status: "success",
    message:
      "Posicao Telematics/GPS processada em tracking com idempotencia, audit trail e outbox.",
    integrationEventId: parsedOutput.data.integrationEvent.id,
    trackingEventId: parsedOutput.data.trackingEvent.id,
    idempotencyKey: parsedOutput.data.idempotency.key,
    replayed: parsedOutput.data.idempotency.replayed,
  };
}

export async function processCustomsErpStatusAction(
  _previousState: IntegrationCustomsErpStatusFormState,
  formData: FormData,
): Promise<IntegrationCustomsErpStatusFormState> {
  const platformSession = await requirePlatformSession("/app/integrations");

  if (
    !platformSession.viewer.permissions.includes(ingestEventPermission) ||
    !platformSession.viewer.permissions.includes("tracking.event.record")
  ) {
    return {
      status: "error",
      message:
        "A sessao precisa de integration.event.ingest e tracking.event.record para processar Customs/ERP.",
    };
  }

  const parsedInput = parseCustomsErpStatusFormData(formData);

  if (!("input" in parsedInput)) {
    return parsedInput;
  }

  const result = await callIntegrationMutation(
    "/rpc/integrations/processCustomsErpStatus",
    parsedInput.input,
  );

  if (result.status !== "ok") {
    return {
      status: "error",
      message: result.message,
    };
  }

  const parsedOutput = integrationCustomsErpStatusOutputSchema.safeParse(result.envelope.json);

  if (!parsedOutput.success) {
    return {
      status: "error",
      message: "Contrato RPC de integracoes retornou resposta invalida para Customs/ERP.",
    };
  }

  revalidatePath("/app/integrations");
  revalidatePath("/app/tracking");

  return {
    status: "success",
    message: "Status Customs/ERP processado em tracking com idempotencia, audit trail e outbox.",
    integrationEventId: parsedOutput.data.integrationEvent.id,
    trackingEventId: parsedOutput.data.trackingEvent.id,
    idempotencyKey: parsedOutput.data.idempotency.key,
    replayed: parsedOutput.data.idempotency.replayed,
  };
}

export async function processWarehouseWmsActivityAction(
  _previousState: IntegrationWarehouseWmsActivityFormState,
  formData: FormData,
): Promise<IntegrationWarehouseWmsActivityFormState> {
  const platformSession = await requirePlatformSession("/app/integrations");

  if (
    !platformSession.viewer.permissions.includes(ingestEventPermission) ||
    !platformSession.viewer.permissions.includes("tracking.event.record")
  ) {
    return {
      status: "error",
      message:
        "A sessao precisa de integration.event.ingest e tracking.event.record para processar Warehouse/WMS.",
    };
  }

  const parsedInput = parseWarehouseWmsActivityFormData(formData);

  if (!("input" in parsedInput)) {
    return parsedInput;
  }

  const result = await callIntegrationMutation(
    "/rpc/integrations/processWarehouseWmsActivity",
    parsedInput.input,
  );

  if (result.status !== "ok") {
    return {
      status: "error",
      message: result.message,
    };
  }

  const parsedOutput = integrationWarehouseWmsActivityOutputSchema.safeParse(result.envelope.json);

  if (!parsedOutput.success) {
    return {
      status: "error",
      message: "Contrato RPC de integracoes retornou resposta invalida para Warehouse/WMS.",
    };
  }

  revalidatePath("/app/integrations");
  revalidatePath("/app/tracking");

  return {
    status: "success",
    message:
      "Atividade Warehouse/WMS processada em tracking com idempotencia, audit trail e outbox.",
    integrationEventId: parsedOutput.data.integrationEvent.id,
    trackingEventId: parsedOutput.data.trackingEvent.id,
    idempotencyKey: parsedOutput.data.idempotency.key,
    replayed: parsedOutput.data.idempotency.replayed,
  };
}

type IntegrationMutationResult =
  | {
      status: "ok";
      envelope: RpcJsonEnvelope;
    }
  | {
      status: "error";
      message: string;
    };

async function callIntegrationMutation(
  path: string,
  input: unknown,
): Promise<IntegrationMutationResult> {
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
      message: "API recusou a operacao por sessao, organizacao ou permissao insuficiente.",
    };
  }

  if (!response.ok) {
    return {
      status: "error",
      message: `API de integracoes recusou a operacao: HTTP ${response.status}.`,
    };
  }

  return {
    status: "ok",
    envelope: (await response.json()) as RpcJsonEnvelope,
  };
}

function parseServiceAccountFormData(formData: FormData):
  | {
      input: ReturnType<typeof integrationServiceAccountCreateInputSchema.parse>;
    }
  | IntegrationServiceAccountCreateFormState {
  const optionalScope = readOptionalFormString(formData, "extraScope");
  const scopes = Array.from(
    new Set(["integration.event.ingest", ...(optionalScope === undefined ? [] : [optionalScope])]),
  );
  const expiresAt = readOptionalFormString(formData, "expiresAt");
  const parsedInput = integrationServiceAccountCreateInputSchema.safeParse({
    name: readRequiredFormString(formData, "name"),
    scopes,
    ...(expiresAt === undefined ? {} : { expiresAt: new Date(expiresAt).toISOString() }),
    idempotencyKey: readRequiredFormString(formData, "idempotencyKey"),
  });

  if (!parsedInput.success) {
    return {
      status: "error",
      message: parsedInput.error.issues.map((issue) => issue.message).join(" "),
    };
  }

  return {
    input: parsedInput.data,
  };
}

function parseIntegrationEventFormData(formData: FormData):
  | {
      input: ReturnType<typeof integrationEventRecordInputSchema.parse>;
    }
  | IntegrationEventRecordFormState {
  const parsedPayload = parsePayload(readRequiredFormString(formData, "payload"));

  if (!("payload" in parsedPayload)) {
    return parsedPayload;
  }

  const parsedInput = integrationEventRecordInputSchema.safeParse({
    serviceAccountId: readRequiredFormString(formData, "serviceAccountId"),
    sourceSystem: readRequiredFormString(formData, "sourceSystem"),
    externalId: readRequiredFormString(formData, "externalId"),
    eventType: readRequiredFormString(formData, "eventType"),
    payload: parsedPayload.payload,
  });

  if (!parsedInput.success) {
    return {
      status: "error",
      message: parsedInput.error.issues.map((issue) => issue.message).join(" "),
    };
  }

  return {
    input: parsedInput.data,
  };
}

function parsePortTosMovementFormData(formData: FormData):
  | {
      input: ReturnType<typeof integrationPortTosMovementInputSchema.parse>;
    }
  | IntegrationPortTosMovementFormState {
  const payloadSource = readOptionalFormString(formData, "payload");
  const parsedPayload = payloadSource === undefined ? undefined : parsePayload(payloadSource);

  if (parsedPayload !== undefined && !("payload" in parsedPayload)) {
    return {
      status: "error",
      message: parsedPayload.message,
    };
  }

  const occurredAt = readRequiredFormString(formData, "occurredAt");
  const parsedInput = integrationPortTosMovementInputSchema.safeParse({
    serviceAccountId: readRequiredFormString(formData, "serviceAccountId"),
    sourceSystem: readRequiredFormString(formData, "sourceSystem"),
    externalId: readRequiredFormString(formData, "externalId"),
    shipmentReference: readRequiredFormString(formData, "shipmentReference"),
    movementType: readRequiredFormString(formData, "movementType"),
    occurredAt: occurredAt.length === 0 ? "" : new Date(occurredAt).toISOString(),
    locationName: readOptionalFormString(formData, "locationName"),
    notes: readOptionalFormString(formData, "notes"),
    ...(parsedPayload === undefined ? {} : { payload: parsedPayload.payload }),
  });

  if (!parsedInput.success) {
    return {
      status: "error",
      message: parsedInput.error.issues.map((issue) => issue.message).join(" "),
    };
  }

  return {
    input: parsedInput.data,
  };
}

function parseRailTmsMovementFormData(formData: FormData):
  | {
      input: ReturnType<typeof integrationRailTmsMovementInputSchema.parse>;
    }
  | IntegrationRailTmsMovementFormState {
  const payloadSource = readOptionalFormString(formData, "payload");
  const parsedPayload = payloadSource === undefined ? undefined : parsePayload(payloadSource);
  const wagonCountSource = readOptionalFormString(formData, "wagonCount");

  if (parsedPayload !== undefined && !("payload" in parsedPayload)) {
    return {
      status: "error",
      message: parsedPayload.message,
    };
  }

  const occurredAt = readRequiredFormString(formData, "occurredAt");
  const parsedInput = integrationRailTmsMovementInputSchema.safeParse({
    serviceAccountId: readRequiredFormString(formData, "serviceAccountId"),
    sourceSystem: readRequiredFormString(formData, "sourceSystem"),
    externalId: readRequiredFormString(formData, "externalId"),
    shipmentReference: readRequiredFormString(formData, "shipmentReference"),
    movementType: readRequiredFormString(formData, "movementType"),
    occurredAt: occurredAt.length === 0 ? "" : new Date(occurredAt).toISOString(),
    locationName: readOptionalFormString(formData, "locationName"),
    trainNumber: readOptionalFormString(formData, "trainNumber"),
    railCorridor: readOptionalFormString(formData, "railCorridor"),
    ...(wagonCountSource === undefined ? {} : { wagonCount: Number(wagonCountSource) }),
    notes: readOptionalFormString(formData, "notes"),
    ...(parsedPayload === undefined ? {} : { payload: parsedPayload.payload }),
  });

  if (!parsedInput.success) {
    return {
      status: "error",
      message: parsedInput.error.issues.map((issue) => issue.message).join(" "),
    };
  }

  return {
    input: parsedInput.data,
  };
}

function parseCarrierTmsMovementFormData(formData: FormData):
  | {
      input: ReturnType<typeof integrationCarrierTmsMovementInputSchema.parse>;
    }
  | IntegrationCarrierTmsMovementFormState {
  const payloadSource = readOptionalFormString(formData, "payload");
  const parsedPayload = payloadSource === undefined ? undefined : parsePayload(payloadSource);

  if (parsedPayload !== undefined && !("payload" in parsedPayload)) {
    return {
      status: "error",
      message: parsedPayload.message,
    };
  }

  const occurredAt = readRequiredFormString(formData, "occurredAt");
  const parsedInput = integrationCarrierTmsMovementInputSchema.safeParse({
    serviceAccountId: readRequiredFormString(formData, "serviceAccountId"),
    sourceSystem: readRequiredFormString(formData, "sourceSystem"),
    externalId: readRequiredFormString(formData, "externalId"),
    shipmentReference: readRequiredFormString(formData, "shipmentReference"),
    movementType: readRequiredFormString(formData, "movementType"),
    occurredAt: occurredAt.length === 0 ? "" : new Date(occurredAt).toISOString(),
    locationName: readOptionalFormString(formData, "locationName"),
    carrierCode: readOptionalFormString(formData, "carrierCode"),
    vehiclePlate: readOptionalFormString(formData, "vehiclePlate"),
    driverReference: readOptionalFormString(formData, "driverReference"),
    routeCode: readOptionalFormString(formData, "routeCode"),
    notes: readOptionalFormString(formData, "notes"),
    ...(parsedPayload === undefined ? {} : { payload: parsedPayload.payload }),
  });

  if (!parsedInput.success) {
    return {
      status: "error",
      message: parsedInput.error.issues.map((issue) => issue.message).join(" "),
    };
  }

  return {
    input: parsedInput.data,
  };
}

function parseTelematicsGpsPositionFormData(formData: FormData):
  | {
      input: ReturnType<typeof integrationTelematicsGpsPositionInputSchema.parse>;
    }
  | IntegrationTelematicsGpsPositionFormState {
  const payloadSource = readOptionalFormString(formData, "payload");
  const parsedPayload = payloadSource === undefined ? undefined : parsePayload(payloadSource);
  const speedKphSource = readOptionalFormString(formData, "speedKph");
  const headingDegreesSource = readOptionalFormString(formData, "headingDegrees");

  if (parsedPayload !== undefined && !("payload" in parsedPayload)) {
    return {
      status: "error",
      message: parsedPayload.message,
    };
  }

  const occurredAt = readRequiredFormString(formData, "occurredAt");
  const parsedInput = integrationTelematicsGpsPositionInputSchema.safeParse({
    serviceAccountId: readRequiredFormString(formData, "serviceAccountId"),
    sourceSystem: readRequiredFormString(formData, "sourceSystem"),
    externalId: readRequiredFormString(formData, "externalId"),
    shipmentReference: readRequiredFormString(formData, "shipmentReference"),
    positionType: readRequiredFormString(formData, "positionType"),
    occurredAt: occurredAt.length === 0 ? "" : new Date(occurredAt).toISOString(),
    latitude: Number(readRequiredFormString(formData, "latitude")),
    longitude: Number(readRequiredFormString(formData, "longitude")),
    deviceId: readOptionalFormString(formData, "deviceId"),
    assetReference: readOptionalFormString(formData, "assetReference"),
    geofenceName: readOptionalFormString(formData, "geofenceName"),
    ...(speedKphSource === undefined ? {} : { speedKph: Number(speedKphSource) }),
    ...(headingDegreesSource === undefined ? {} : { headingDegrees: Number(headingDegreesSource) }),
    routeCode: readOptionalFormString(formData, "routeCode"),
    notes: readOptionalFormString(formData, "notes"),
    ...(parsedPayload === undefined ? {} : { payload: parsedPayload.payload }),
  });

  if (!parsedInput.success) {
    return {
      status: "error",
      message: parsedInput.error.issues.map((issue) => issue.message).join(" "),
    };
  }

  return {
    input: parsedInput.data,
  };
}

function parseCustomsErpStatusFormData(formData: FormData):
  | {
      input: ReturnType<typeof integrationCustomsErpStatusInputSchema.parse>;
    }
  | IntegrationCustomsErpStatusFormState {
  const payloadSource = readOptionalFormString(formData, "payload");
  const parsedPayload = payloadSource === undefined ? undefined : parsePayload(payloadSource);

  if (parsedPayload !== undefined && !("payload" in parsedPayload)) {
    return {
      status: "error",
      message: parsedPayload.message,
    };
  }

  const occurredAt = readRequiredFormString(formData, "occurredAt");
  const parsedInput = integrationCustomsErpStatusInputSchema.safeParse({
    serviceAccountId: readRequiredFormString(formData, "serviceAccountId"),
    sourceSystem: readRequiredFormString(formData, "sourceSystem"),
    externalId: readRequiredFormString(formData, "externalId"),
    shipmentReference: readRequiredFormString(formData, "shipmentReference"),
    statusType: readRequiredFormString(formData, "statusType"),
    occurredAt: occurredAt.length === 0 ? "" : new Date(occurredAt).toISOString(),
    customsReference: readOptionalFormString(formData, "customsReference"),
    documentReference: readOptionalFormString(formData, "documentReference"),
    declarationNumber: readOptionalFormString(formData, "declarationNumber"),
    brokerReference: readOptionalFormString(formData, "brokerReference"),
    authorityCode: readOptionalFormString(formData, "authorityCode"),
    notes: readOptionalFormString(formData, "notes"),
    ...(parsedPayload === undefined ? {} : { payload: parsedPayload.payload }),
  });

  if (!parsedInput.success) {
    return {
      status: "error",
      message: parsedInput.error.issues.map((issue) => issue.message).join(" "),
    };
  }

  return {
    input: parsedInput.data,
  };
}

function parseWarehouseWmsActivityFormData(formData: FormData):
  | {
      input: ReturnType<typeof integrationWarehouseWmsActivityInputSchema.parse>;
    }
  | IntegrationWarehouseWmsActivityFormState {
  const payloadSource = readOptionalFormString(formData, "payload");
  const parsedPayload = payloadSource === undefined ? undefined : parsePayload(payloadSource);
  const palletCountSource = readOptionalFormString(formData, "palletCount");

  if (parsedPayload !== undefined && !("payload" in parsedPayload)) {
    return {
      status: "error",
      message: parsedPayload.message,
    };
  }

  const occurredAt = readRequiredFormString(formData, "occurredAt");
  const parsedInput = integrationWarehouseWmsActivityInputSchema.safeParse({
    serviceAccountId: readRequiredFormString(formData, "serviceAccountId"),
    sourceSystem: readRequiredFormString(formData, "sourceSystem"),
    externalId: readRequiredFormString(formData, "externalId"),
    shipmentReference: readRequiredFormString(formData, "shipmentReference"),
    activityType: readRequiredFormString(formData, "activityType"),
    occurredAt: occurredAt.length === 0 ? "" : new Date(occurredAt).toISOString(),
    locationName: readOptionalFormString(formData, "locationName"),
    warehouseCode: readOptionalFormString(formData, "warehouseCode"),
    zoneCode: readOptionalFormString(formData, "zoneCode"),
    dockDoor: readOptionalFormString(formData, "dockDoor"),
    containerReference: readOptionalFormString(formData, "containerReference"),
    handlingUnitReference: readOptionalFormString(formData, "handlingUnitReference"),
    operatorReference: readOptionalFormString(formData, "operatorReference"),
    ...(palletCountSource === undefined ? {} : { palletCount: Number(palletCountSource) }),
    notes: readOptionalFormString(formData, "notes"),
    ...(parsedPayload === undefined ? {} : { payload: parsedPayload.payload }),
  });

  if (!parsedInput.success) {
    return {
      status: "error",
      message: parsedInput.error.issues.map((issue) => issue.message).join(" "),
    };
  }

  return {
    input: parsedInput.data,
  };
}

function parsePayload(source: string):
  | {
      payload: Record<string, string | number | boolean | null>;
    }
  | IntegrationEventRecordFormState {
  const parsed = parseJsonPayloadSource(source);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Payload JSON invalido.",
    };
  }

  if (typeof parsed.value !== "object" || parsed.value === null || Array.isArray(parsed.value)) {
    return {
      status: "error",
      message: "Payload deve ser um objeto JSON simples.",
    };
  }

  for (const value of Object.values(parsed.value)) {
    const valueType = typeof value;

    if (
      value !== null &&
      valueType !== "string" &&
      valueType !== "number" &&
      valueType !== "boolean"
    ) {
      return {
        status: "error",
        message: "Payload aceita apenas string, number, boolean ou null no primeiro nivel.",
      };
    }
  }

  return {
    payload: parsed.value as Record<string, string | number | boolean | null>,
  };
}

function parseJsonPayloadSource(source: string):
  | {
      success: true;
      value: unknown;
    }
  | {
      success: false;
    } {
  try {
    return {
      success: true,
      value: JSON.parse(source) as unknown,
    };
  } catch {
    const unescapedSource = source.replaceAll('\\"', '"');

    if (unescapedSource === source) {
      return {
        success: false,
      };
    }

    try {
      return {
        success: true,
        value: JSON.parse(unescapedSource) as unknown,
      };
    } catch {
      return {
        success: false,
      };
    }
  }
}

function readRequiredFormString(formData: FormData, name: string): string {
  const value = formData.get(name);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function readOptionalFormString(formData: FormData, name: string): string | undefined {
  const value = readRequiredFormString(formData, name);

  return value.length === 0 ? undefined : value;
}
