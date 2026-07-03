"use server";

import type { PlatformPermission } from "@saptm/auth";
import { getClientEnv } from "@saptm/config";
import {
  type TariffQuoteApproveInput,
  type TariffQuoteCalculateInput,
  type TariffRateCardRegisterInput,
  type TariffRateRuleAddInput,
  tariffQuoteApproveInputSchema,
  tariffQuoteApproveOutputSchema,
  tariffQuoteCalculateInputSchema,
  tariffQuoteCalculateOutputSchema,
  tariffRateCardRegisterInputSchema,
  tariffRateCardRegisterOutputSchema,
  tariffRateRuleAddInputSchema,
  tariffRateRuleAddOutputSchema,
} from "@saptm/rpc/tariff";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { requirePlatformSession } from "../../../../lib/auth-session";
import type {
  TariffQuoteApproveFormState,
  TariffQuoteCalculateFormState,
  TariffRateCardRegisterFormState,
  TariffRateRuleAddFormState,
} from "./form-state";

const manageTariffPermission: PlatformPermission = "tariff.manage";
const calculateTariffPermission: PlatformPermission = "tariff.quote.calculate";
const approveTariffPermission: PlatformPermission = "tariff.quote.approve";

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

export async function registerTariffRateCardAction(
  _previousState: TariffRateCardRegisterFormState,
  formData: FormData,
): Promise<TariffRateCardRegisterFormState> {
  const platformSession = await requirePlatformSession("/app/tariffs");

  if (!platformSession.viewer.permissions.includes(manageTariffPermission)) {
    return {
      status: "error",
      message: "A sessão não possui tariff.manage para registar rate cards.",
    };
  }

  const parsedInput = parseTariffRateCardRegisterFormData(formData);

  if (!("input" in parsedInput)) {
    return parsedInput;
  }

  const result = await postTariffRpc(
    "/rpc/tariff/registerRateCard",
    parsedInput.input,
    tariffRateCardRegisterOutputSchema,
  );

  if (result.status !== "ok") {
    return {
      status: "error",
      message: result.message,
    };
  }

  revalidatePath("/app/tariffs");

  return {
    status: "success",
    message: result.output.idempotency.replayed
      ? "Rate card já existia; resposta idempotente reaproveitada."
      : "Rate card registado com validade, moeda normalizada, audit trail e outbox.",
    rateCardId: result.output.rateCardId,
    rateCardCode: result.output.rateCard.rateCardCode,
    idempotencyKey: result.output.idempotency.key,
    rateCardAccepted: result.output.businessRules.rateCardAccepted,
  };
}

export async function addTariffRateRuleAction(
  _previousState: TariffRateRuleAddFormState,
  formData: FormData,
): Promise<TariffRateRuleAddFormState> {
  const platformSession = await requirePlatformSession("/app/tariffs");

  if (!platformSession.viewer.permissions.includes(manageTariffPermission)) {
    return {
      status: "error",
      message: "A sessão não possui tariff.manage para adicionar regras.",
    };
  }

  const parsedInput = parseTariffRateRuleAddFormData(formData);

  if (!("input" in parsedInput)) {
    return parsedInput;
  }

  const result = await postTariffRpc(
    "/rpc/tariff/addRateRule",
    parsedInput.input,
    tariffRateRuleAddOutputSchema,
  );

  if (result.status !== "ok") {
    return {
      status: "error",
      message: result.message,
    };
  }

  revalidatePath("/app/tariffs");

  return {
    status: "success",
    message: result.output.idempotency.replayed
      ? "Regra já existia; resposta idempotente reaproveitada."
      : "Regra tarifaria adicionada com base válida, audit trail e outbox.",
    rateCardId: result.output.rateCardId,
    ruleId: result.output.ruleId,
    ruleCode: result.output.rule.ruleCode,
    idempotencyKey: result.output.idempotency.key,
    ruleAccepted: result.output.businessRules.ruleAccepted,
  };
}

export async function calculateTariffQuoteAction(
  _previousState: TariffQuoteCalculateFormState,
  formData: FormData,
): Promise<TariffQuoteCalculateFormState> {
  const platformSession = await requirePlatformSession("/app/tariffs");

  if (!platformSession.viewer.permissions.includes(calculateTariffPermission)) {
    return {
      status: "error",
      message: "A sessão não possui tariff.quote.calculate para calcular cotações.",
    };
  }

  const parsedInput = parseTariffQuoteCalculateFormData(formData);

  if (!("input" in parsedInput)) {
    return parsedInput;
  }

  const result = await postTariffRpc(
    "/rpc/tariff/calculateQuote",
    parsedInput.input,
    tariffQuoteCalculateOutputSchema,
  );

  if (result.status !== "ok") {
    return {
      status: "error",
      message: result.message,
    };
  }

  revalidatePath("/app/tariffs");

  return {
    status: "success",
    message: result.output.idempotency.replayed
      ? "Cotação já tinha sido calculada; resposta idempotente reaproveitada."
      : "Cotação calculada com rate card ativo, regras aplicáveis, audit trail e outbox.",
    cargoId: result.output.cargoId,
    rateCardId: result.output.rateCardId,
    quoteId: result.output.quoteId,
    quoteReference: result.output.quote.quoteReference,
    taxableAmount: result.output.quote.taxableAmount,
    taxRatePercentage: result.output.quote.taxRatePercentage,
    taxAmount: result.output.quote.taxAmount,
    quotedAmount: result.output.quote.quotedAmount,
    idempotencyKey: result.output.idempotency.key,
    quoteCalculated: result.output.businessRules.quoteCalculated,
  };
}

export async function approveTariffQuoteAction(
  _previousState: TariffQuoteApproveFormState,
  formData: FormData,
): Promise<TariffQuoteApproveFormState> {
  const platformSession = await requirePlatformSession("/app/tariffs");

  if (!platformSession.viewer.permissions.includes(approveTariffPermission)) {
    return {
      status: "error",
      message: "A sessão não possui tariff.quote.approve para aprovar cotações.",
    };
  }

  const parsedInput = parseTariffQuoteApproveFormData(formData);

  if (!("input" in parsedInput)) {
    return parsedInput;
  }

  const result = await postTariffRpc(
    "/rpc/tariff/approveQuote",
    parsedInput.input,
    tariffQuoteApproveOutputSchema,
  );

  if (result.status !== "ok") {
    return {
      status: "error",
      message: result.message,
    };
  }

  revalidatePath("/app/tariffs");

  return {
    status: "success",
    message: result.output.idempotency.replayed
      ? "Aprovação já tinha sido processada; resposta idempotente reaproveitada."
      : "Cotação aprovada com evidencia financeira, audit trail e outbox.",
    cargoId: result.output.cargoId,
    quoteId: result.output.quoteId,
    ...(result.output.quote.approvalReference === null
      ? {}
      : { approvalReference: result.output.quote.approvalReference }),
    idempotencyKey: result.output.idempotency.key,
    approvalAllowed: result.output.businessRules.approvalAllowed,
  };
}

async function postTariffRpc<TOutput>(
  path: string,
  input:
    | TariffRateCardRegisterInput
    | TariffRateRuleAddInput
    | TariffQuoteCalculateInput
    | TariffQuoteApproveInput,
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
  const response = await fetch(new URL(path, getClientEnv().NEXT_PUBLIC_API_URL), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader === null ? {} : { cookie: cookieHeader }),
    },
    body: JSON.stringify({
      json: input,
    }),
  });

  if (!response.ok) {
    return {
      status: "error",
      message: `API de tarifas recusou a operação: HTTP ${response.status}.`,
    };
  }

  const envelope = (await response.json()) as RpcJsonEnvelope;
  const parsedOutput = outputSchema.safeParse(envelope.json);

  if (!parsedOutput.success) {
    return {
      status: "error",
      message: "Contrato RPC de tarifas retornou payload invalido.",
    };
  }

  return {
    status: "ok",
    output: parsedOutput.data,
  };
}

function parseTariffRateCardRegisterFormData(formData: FormData):
  | {
      input: TariffRateCardRegisterInput;
    }
  | TariffRateCardRegisterFormState {
  const parsedInput = tariffRateCardRegisterInputSchema.safeParse({
    rateCardCode: readRequiredFormString(formData, "rateCardCode"),
    rateCardName: readRequiredFormString(formData, "rateCardName"),
    status: readRequiredFormString(formData, "status"),
    currencyCode: readRequiredFormString(formData, "currencyCode"),
    validFrom: readRequiredDateTimeFormString(formData, "validFrom"),
    ...readOptionalDateTimeFormString(formData, "validUntil"),
    idempotencyKey: readRequiredFormString(formData, "idempotencyKey"),
    sourceSystem: readOptionalFormString(formData, "sourceSystem").sourceSystem ?? "saptm",
  });

  if (!parsedInput.success) {
    return {
      status: "error",
      message: "Dados inválidos para rate card: confirme codigo, moeda e janela de validade.",
    };
  }

  return {
    input: parsedInput.data,
  };
}

function parseTariffRateRuleAddFormData(formData: FormData):
  | {
      input: TariffRateRuleAddInput;
    }
  | TariffRateRuleAddFormState {
  const parsedInput = tariffRateRuleAddInputSchema.safeParse({
    rateCardId: readRequiredFormString(formData, "rateCardId"),
    ruleCode: readRequiredFormString(formData, "ruleCode"),
    chargeName: readRequiredFormString(formData, "chargeName"),
    chargeType: readRequiredFormString(formData, "chargeType"),
    calculationBasis: readRequiredFormString(formData, "calculationBasis"),
    ...readOptionalFormNumber(formData, "unitRate"),
    ...readOptionalFormNumber(formData, "flatAmount"),
    ...readOptionalFormNumber(formData, "percentageRate"),
    ...readOptionalFormNumber(formData, "minimumCharge"),
    ...readOptionalFormString(formData, "originName"),
    ...readOptionalFormString(formData, "destinationName"),
    ...readOptionalFormString(formData, "cargoType"),
    effectiveFrom: readRequiredDateTimeFormString(formData, "effectiveFrom"),
    ...readOptionalDateTimeFormString(formData, "effectiveUntil"),
    idempotencyKey: readRequiredFormString(formData, "idempotencyKey"),
    sourceSystem: readOptionalFormString(formData, "sourceSystem").sourceSystem ?? "saptm",
  });

  if (!parsedInput.success) {
    return {
      status: "error",
      message: "Dados inválidos para regra: confirme base, taxa, datas e rate card.",
    };
  }

  return {
    input: parsedInput.data,
  };
}

function parseTariffQuoteCalculateFormData(formData: FormData):
  | {
      input: TariffQuoteCalculateInput;
    }
  | TariffQuoteCalculateFormState {
  const parsedInput = tariffQuoteCalculateInputSchema.safeParse({
    cargoId: readRequiredFormString(formData, "cargoId"),
    rateCardId: readRequiredFormString(formData, "rateCardId"),
    quoteReference: readRequiredFormString(formData, "quoteReference"),
    ...readOptionalFormNumber(formData, "distanceKm"),
    ...readOptionalFormNumber(formData, "taxRatePercentage"),
    calculatedByName: readRequiredFormString(formData, "calculatedByName"),
    calculatedAt: readRequiredDateTimeFormString(formData, "calculatedAt"),
    idempotencyKey: readRequiredFormString(formData, "idempotencyKey"),
    sourceSystem: readOptionalFormString(formData, "sourceSystem").sourceSystem ?? "saptm",
  });

  if (!parsedInput.success) {
    return {
      status: "error",
      message: "Dados inválidos para cotação: confirme carga, rate card, distancia e data.",
    };
  }

  return {
    input: parsedInput.data,
  };
}

function parseTariffQuoteApproveFormData(formData: FormData):
  | {
      input: TariffQuoteApproveInput;
    }
  | TariffQuoteApproveFormState {
  const parsedInput = tariffQuoteApproveInputSchema.safeParse({
    quoteId: readRequiredFormString(formData, "quoteId"),
    approvalReference: readRequiredFormString(formData, "approvalReference"),
    approvedByName: readRequiredFormString(formData, "approvedByName"),
    approvalNotes: readRequiredFormString(formData, "approvalNotes"),
    approvedAt: readRequiredDateTimeFormString(formData, "approvedAt"),
    idempotencyKey: readRequiredFormString(formData, "idempotencyKey"),
    sourceSystem: readOptionalFormString(formData, "sourceSystem").sourceSystem ?? "saptm",
  });

  if (!parsedInput.success) {
    return {
      status: "error",
      message: "Dados inválidos para aprovação: confirme cotação, referencia e data.",
    };
  }

  return {
    input: parsedInput.data,
  };
}

function readRequiredFormString(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function readOptionalFormString(formData: FormData, key: string): Record<string, string> {
  const value = String(formData.get(key) ?? "").trim();

  return value.length === 0 ? {} : { [key]: value };
}

function readRequiredDateTimeFormString(formData: FormData, key: string): string {
  const value = readRequiredFormString(formData, key);
  const date = new Date(value);

  return value.length === 0 || Number.isNaN(date.getTime()) ? value : date.toISOString();
}

function readOptionalDateTimeFormString(formData: FormData, key: string): Record<string, string> {
  const value = String(formData.get(key) ?? "").trim();
  const date = new Date(value);

  return value.length === 0 || Number.isNaN(date.getTime()) ? {} : { [key]: date.toISOString() };
}

function readOptionalFormNumber(formData: FormData, key: string): Record<string, number> {
  const value = String(formData.get(key) ?? "").trim();

  return value.length === 0 ? {} : { [key]: Number(value) };
}
