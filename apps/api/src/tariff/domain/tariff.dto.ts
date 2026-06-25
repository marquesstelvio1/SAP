import type { AuditJsonValue, DatabaseActorType } from "@saptm/database";
import type {
  TariffOverviewOutput,
  TariffQuoteApproveInput,
  TariffQuoteApproveOutput,
  TariffQuoteCalculateInput,
  TariffQuoteCalculateOutput,
  TariffRateCardRegisterInput,
  TariffRateCardRegisterOutput,
  TariffRateRuleAddInput,
  TariffRateRuleAddOutput,
} from "@saptm/rpc";

import type {
  CargoStatus,
  CargoType,
  TariffCalculationBasis,
  TariffChargeType,
  TariffQuoteStatus,
  TariffRateCardStatus,
} from "./tariff.business-rules.js";

// Input types

export type GetTariffOverviewInput = {
  organizationId: string;
  limit?: number;
  generatedAt?: Date;
};

export type RegisterTariffRateCardInput = TariffRateCardRegisterInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

export type AddTariffRateRuleInput = TariffRateRuleAddInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

export type CalculateTariffQuoteInput = TariffQuoteCalculateInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

export type ApproveTariffQuoteInput = TariffQuoteApproveInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

// Record types (shapes returned from Prisma)

export type TariffRateCardRecord = {
  id: string;
  organizationId: string;
  rateCardCode: string;
  rateCardName: string;
  status: TariffRateCardStatus;
  currencyCode: string;
  validFrom: Date;
  validUntil: Date | null;
  sourceSystem: string;
  recordIdempotencyKey: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TariffRateRuleRecord = {
  id: string;
  organizationId: string;
  rateCardId: string;
  ruleCode: string;
  chargeName: string;
  chargeType: TariffChargeType;
  calculationBasis: TariffCalculationBasis;
  unitRate: unknown | null;
  flatAmount: unknown | null;
  percentageRate: unknown | null;
  minimumCharge: unknown | null;
  originName: string | null;
  destinationName: string | null;
  cargoType: CargoType | null;
  effectiveFrom: Date;
  effectiveUntil: Date | null;
  sourceSystem: string;
  recordIdempotencyKey: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TariffRateRuleWithRateCard = TariffRateRuleRecord & {
  rateCard: TariffRateCardRecord;
};

export type TariffCargoRecord = {
  id: string;
  organizationId: string;
  cargoReference: string;
  cargoDescription: string;
  cargoType: CargoType;
  status: CargoStatus;
  grossWeightKg: unknown;
  packageCount: number;
  volumeM3: unknown | null;
  originName: string;
  destinationName: string;
};

export type TariffQuoteRecord = {
  id: string;
  organizationId: string;
  cargoId: string;
  rateCardId: string;
  quoteReference: string;
  status: TariffQuoteStatus;
  currencyCode: string;
  quotedAmount: unknown;
  calculationPayload: unknown;
  calculatedByName: string;
  calculatedAt: Date;
  approvedByName: string | null;
  approvalReference: string | null;
  approvalNotes: string | null;
  approvedAt: Date | null;
  sourceSystem: string;
  calculateIdempotencyKey: string | null;
  approveIdempotencyKey: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TariffQuoteWithCargoRateCard = TariffQuoteRecord & {
  cargo: TariffCargoRecord;
  rateCard: TariffRateCardRecord;
};

export type TariffQuoteStatusGroup = {
  status: TariffQuoteStatus;
  _count: {
    _all: number;
  };
};

export type TariffQuoteLineItem = TariffQuoteCalculateOutput["lineItems"][number];

export type TariffCalculationTax = {
  taxableAmount: number;
  taxRatePercentage: number;
  taxAmount: number;
};

export type TariffCalculationResult = {
  lineItems: TariffQuoteLineItem[];
  tax: TariffCalculationTax;
  quotedAmount: number;
  requiredMetricsAvailable: boolean;
};

// Constants

export const tariffCargoSelect = {
  id: true,
  organizationId: true,
  cargoReference: true,
  cargoDescription: true,
  cargoType: true,
  status: true,
  grossWeightKg: true,
  packageCount: true,
  volumeM3: true,
  originName: true,
  destinationName: true,
} as const;

// Utility functions

export function readLineItemsFromPayload(payload: unknown): TariffQuoteLineItem[] {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "lineItems" in payload &&
    Array.isArray(payload.lineItems)
  ) {
    return payload.lineItems.filter(isTariffQuoteLineItem);
  }

  return [];
}

export function readTaxFromPayload(payload: unknown, quotedAmount: number): TariffCalculationTax {
  const taxableAmount = readNumberFromPayload(payload, "taxableAmount");
  const taxRatePercentage = readNumberFromPayload(payload, "taxRatePercentage");
  const taxAmount = readNumberFromPayload(payload, "taxAmount");

  if (taxableAmount === null || taxRatePercentage === null || taxAmount === null) {
    return {
      taxableAmount: quotedAmount,
      taxRatePercentage: 0,
      taxAmount: 0,
    };
  }

  return {
    taxableAmount,
    taxRatePercentage,
    taxAmount,
  };
}

function readNumberFromPayload(payload: unknown, key: string): number | null {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  const value = (payload as Record<string, unknown>)[key];
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : null;
}

function isTariffQuoteLineItem(value: unknown): value is TariffQuoteLineItem {
  return (
    typeof value === "object" &&
    value !== null &&
    "ruleId" in value &&
    "ruleCode" in value &&
    "amount" in value
  );
}

export function createTariffQuoteStatusCounts(
  groups: { status: string; _count: { _all: number } }[],
): { calculated: number; approved: number; rejected: number; expired: number } {
  const counts = {
    calculated: 0,
    approved: 0,
    rejected: 0,
    expired: 0,
  };

  for (const group of groups) {
    counts[group.status as keyof typeof counts] = group._count._all;
  }

  return counts;
}

export function toIsoStringOrNull(value: Date | null | undefined): string | null {
  return value?.toISOString() ?? null;
}

export function createRequestMetadata(input: { ipAddress?: string; userAgent?: string }): {
  ipAddress?: string;
  userAgent?: string;
} {
  return {
    ...(input.ipAddress === undefined ? {} : { ipAddress: input.ipAddress }),
    ...(input.userAgent === undefined ? {} : { userAgent: input.userAgent }),
  };
}

export function normalizeLimit(limit: number | undefined): number {
  return Math.min(Math.max(limit ?? 10, 1), 50);
}

export function normalizeTariffCode(value: string): string {
  return value.trim().toUpperCase();
}

export function normalizeCurrencyCode(value: string): string {
  return value.trim().toUpperCase();
}

export function toRequiredString(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    throw new Error("required_string_missing");
  }

  return value;
}

export function toNullableNumber(value: unknown | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  return Number(value);
}

// Output builders

export function createTariffRateCardRegisterOutput(input: {
  organizationId: string;
  rateCard: TariffRateCardRecord;
  replayed: boolean;
  businessRules?: TariffRateCardRegisterOutput["businessRules"];
}): TariffRateCardRegisterOutput {
  const businessRules =
    input.businessRules ??
    ({
      rateCardAccepted: true,
      uniqueRateCardCode: true,
      validityWindowValid: true,
      currencyNormalized: true,
      appliedRules: [
        "TARIFF_RATE_CARD_UNIQUE_CODE",
        "TARIFF_RATE_CARD_VALIDITY_WINDOW",
        "TARIFF_RATE_CARD_CURRENCY_NORMALIZED",
      ],
    } satisfies TariffRateCardRegisterOutput["businessRules"]);

  return {
    organizationId: input.organizationId,
    rateCardId: input.rateCard.id,
    rateCard: createTariffRateCardSummary(input.rateCard),
    businessRules,
    idempotency: {
      key: toRequiredString(input.rateCard.recordIdempotencyKey),
      replayed: input.replayed,
    },
    audit: {
      action: "tariff.rate_card.registered",
      subjectType: "tariff_rate_card",
      subjectId: input.rateCard.id,
    },
    outbox: {
      eventType: "tariff.rate_card.registered",
      aggregateType: "tariff",
      aggregateId: input.rateCard.id,
    },
  };
}

export function createTariffRateRuleAddOutput(input: {
  organizationId: string;
  rule: TariffRateRuleWithRateCard;
  replayed: boolean;
  businessRules?: TariffRateRuleAddOutput["businessRules"];
}): TariffRateRuleAddOutput {
  const businessRules =
    input.businessRules ??
    ({
      ruleAccepted: true,
      rateCardUsable: input.rule.rateCard.status !== "retired",
      effectiveWindowValid: true,
      rateBasisValid: true,
      duplicateRuleBlocked: true,
      appliedRules: [
        "TARIFF_RATE_RULE_RATE_CARD_USABLE",
        "TARIFF_RATE_RULE_EFFECTIVE_WINDOW_WITHIN_RATE_CARD",
        "TARIFF_RATE_RULE_BASIS_VALID",
        "TARIFF_RATE_RULE_DUPLICATE_BLOCKED",
      ],
    } satisfies TariffRateRuleAddOutput["businessRules"]);

  return {
    organizationId: input.organizationId,
    rateCardId: input.rule.rateCardId,
    ruleId: input.rule.id,
    rateCard: createTariffRateCardSummary(input.rule.rateCard),
    rule: createTariffRateRuleSummary(input.rule),
    businessRules,
    idempotency: {
      key: toRequiredString(input.rule.recordIdempotencyKey),
      replayed: input.replayed,
    },
    audit: {
      action: "tariff.rate_rule.added",
      subjectType: "tariff_rate_rule",
      subjectId: input.rule.id,
    },
    outbox: {
      eventType: "tariff.rate_rule.added",
      aggregateType: "tariff",
      aggregateId: input.rule.id,
    },
  };
}

export function createTariffQuoteCalculateOutput(input: {
  organizationId: string;
  quote: TariffQuoteWithCargoRateCard;
  lineItems: TariffQuoteLineItem[];
  replayed: boolean;
  businessRules?: TariffQuoteCalculateOutput["businessRules"];
}): TariffQuoteCalculateOutput {
  const businessRules =
    input.businessRules ??
    ({
      quoteCalculated: true,
      cargoEligible: true,
      rateCardActive: input.quote.rateCard.status === "active",
      rateCardValidAtCalculation: true,
      applicableRulesFound: input.lineItems.length > 0,
      requiredMetricsAvailable: true,
      amountPositive: Number(input.quote.quotedAmount) > 0,
      taxModelValid: true,
      appliedRules: [
        "TARIFF_QUOTE_REQUIRES_ELIGIBLE_CARGO",
        "TARIFF_QUOTE_REQUIRES_ACTIVE_RATE_CARD",
        "TARIFF_QUOTE_REQUIRES_APPLICABLE_RULES",
        "TARIFF_QUOTE_REQUIRES_REQUIRED_METRICS",
        "TARIFF_QUOTE_AMOUNT_POSITIVE",
        "TARIFF_QUOTE_TAX_MODEL_VALID",
        "TARIFF_QUOTE_DUPLICATE_REFERENCE_BLOCKED",
      ],
    } satisfies TariffQuoteCalculateOutput["businessRules"]);

  return {
    organizationId: input.organizationId,
    cargoId: input.quote.cargoId,
    rateCardId: input.quote.rateCardId,
    quoteId: input.quote.id,
    cargo: createTariffCargoSummary(input.quote.cargo),
    rateCard: createTariffRateCardSummary(input.quote.rateCard),
    quote: createTariffQuoteSummary(input.quote),
    lineItems: input.lineItems,
    businessRules,
    idempotency: {
      key: toRequiredString(input.quote.calculateIdempotencyKey),
      replayed: input.replayed,
    },
    audit: {
      action: "tariff.quote.calculated",
      subjectType: "tariff_quote",
      subjectId: input.quote.id,
    },
    outbox: {
      eventType: "tariff.quote.calculated",
      aggregateType: "tariff",
      aggregateId: input.quote.id,
    },
  };
}

export function createTariffQuoteApproveOutput(input: {
  organizationId: string;
  quote: TariffQuoteWithCargoRateCard;
  replayed: boolean;
  businessRules?: TariffQuoteApproveOutput["businessRules"];
}): TariffQuoteApproveOutput {
  const businessRules =
    input.businessRules ??
    ({
      approvalAllowed: input.quote.status === "approved",
      quoteCalculated: true,
      approvalAfterCalculation: true,
      approvalReferencePresent: input.quote.approvalReference !== null,
      appliedRules: [
        "TARIFF_QUOTE_APPROVAL_REQUIRES_CALCULATED_STATE",
        "TARIFF_QUOTE_APPROVAL_AFTER_CALCULATION",
        "TARIFF_QUOTE_APPROVAL_REFERENCE_REQUIRED",
      ],
    } satisfies TariffQuoteApproveOutput["businessRules"]);

  return {
    organizationId: input.organizationId,
    cargoId: input.quote.cargoId,
    quoteId: input.quote.id,
    cargo: createTariffCargoSummary(input.quote.cargo),
    rateCard: createTariffRateCardSummary(input.quote.rateCard),
    quote: createTariffQuoteSummary(input.quote),
    businessRules,
    idempotency: {
      key: toRequiredString(input.quote.approveIdempotencyKey),
      replayed: input.replayed,
    },
    audit: {
      action: "tariff.quote.approved",
      subjectType: "tariff_quote",
      subjectId: input.quote.id,
    },
    outbox: {
      eventType: "tariff.quote.approved",
      aggregateType: "tariff",
      aggregateId: input.quote.id,
    },
  };
}

// Summary functions

export function createTariffRateCardSummary(
  rateCard: TariffRateCardRecord,
): TariffRateCardRegisterOutput["rateCard"] {
  return {
    id: rateCard.id,
    rateCardCode: rateCard.rateCardCode,
    rateCardName: rateCard.rateCardName,
    status: rateCard.status,
    currencyCode: rateCard.currencyCode,
    validFrom: rateCard.validFrom.toISOString(),
    validUntil: toIsoStringOrNull(rateCard.validUntil),
    sourceSystem: rateCard.sourceSystem,
    createdAt: rateCard.createdAt.toISOString(),
    updatedAt: rateCard.updatedAt.toISOString(),
  };
}

export function createTariffRateRuleSummary(
  rule: TariffRateRuleRecord,
): TariffRateRuleAddOutput["rule"] {
  return {
    id: rule.id,
    rateCardId: rule.rateCardId,
    ruleCode: rule.ruleCode,
    chargeName: rule.chargeName,
    chargeType: rule.chargeType,
    calculationBasis: rule.calculationBasis,
    unitRate: toNullableNumber(rule.unitRate),
    flatAmount: toNullableNumber(rule.flatAmount),
    percentageRate: toNullableNumber(rule.percentageRate),
    minimumCharge: toNullableNumber(rule.minimumCharge),
    originName: rule.originName,
    destinationName: rule.destinationName,
    cargoType: rule.cargoType,
    effectiveFrom: rule.effectiveFrom.toISOString(),
    effectiveUntil: toIsoStringOrNull(rule.effectiveUntil),
    sourceSystem: rule.sourceSystem,
    createdAt: rule.createdAt.toISOString(),
    updatedAt: rule.updatedAt.toISOString(),
  };
}

export function createTariffCargoSummary(
  cargo: TariffCargoRecord,
): TariffQuoteCalculateOutput["cargo"] {
  return {
    id: cargo.id,
    cargoReference: cargo.cargoReference,
    cargoDescription: cargo.cargoDescription,
    cargoType: cargo.cargoType,
    status: cargo.status,
    grossWeightKg: Number(cargo.grossWeightKg),
    packageCount: cargo.packageCount,
    volumeM3: cargo.volumeM3 === null ? null : Number(cargo.volumeM3),
    originName: cargo.originName,
    destinationName: cargo.destinationName,
  };
}

export function createTariffQuoteSummary(
  quote: TariffQuoteWithCargoRateCard,
): TariffOverviewOutput["recentQuotes"][number] {
  const quotedAmount = Number(quote.quotedAmount);
  const tax = readTaxFromPayload(quote.calculationPayload, quotedAmount);

  return {
    id: quote.id,
    cargoId: quote.cargoId,
    cargoReference: quote.cargo.cargoReference,
    rateCardId: quote.rateCardId,
    rateCardCode: quote.rateCard.rateCardCode,
    quoteReference: quote.quoteReference,
    status: quote.status,
    currencyCode: quote.currencyCode,
    taxableAmount: tax.taxableAmount,
    taxRatePercentage: tax.taxRatePercentage,
    taxAmount: tax.taxAmount,
    quotedAmount,
    calculatedByName: quote.calculatedByName,
    calculatedAt: quote.calculatedAt.toISOString(),
    approvedByName: quote.approvedByName,
    approvalReference: quote.approvalReference,
    approvalNotes: quote.approvalNotes,
    approvedAt: toIsoStringOrNull(quote.approvedAt),
    sourceSystem: quote.sourceSystem,
    createdAt: quote.createdAt.toISOString(),
    updatedAt: quote.updatedAt.toISOString(),
  };
}

// Audit after helpers (for outbox payloads)

export function createTariffRateCardAuditPayload(input: {
  rateCard: TariffRateCardRecord;
  rateCardAccepted: boolean;
  appliedRules: string[];
}): AuditJsonValue {
  return {
    rateCardId: input.rateCard.id,
    rateCardCode: input.rateCard.rateCardCode,
    rateCardName: input.rateCard.rateCardName,
    status: input.rateCard.status,
    currencyCode: input.rateCard.currencyCode,
    validFrom: input.rateCard.validFrom.toISOString(),
    validUntil: toIsoStringOrNull(input.rateCard.validUntil),
    rateCardAccepted: input.rateCardAccepted,
    appliedRules: input.appliedRules,
    idempotencyKey: input.rateCard.recordIdempotencyKey,
    sourceSystem: input.rateCard.sourceSystem,
  };
}

export function createTariffRateRuleAuditPayload(input: {
  rule: TariffRateRuleWithRateCard;
  ruleAccepted: boolean;
  appliedRules: string[];
}): AuditJsonValue {
  return {
    ruleId: input.rule.id,
    rateCardId: input.rule.rateCardId,
    ruleCode: input.rule.ruleCode,
    chargeName: input.rule.chargeName,
    chargeType: input.rule.chargeType,
    calculationBasis: input.rule.calculationBasis,
    unitRate: toNullableNumber(input.rule.unitRate),
    flatAmount: toNullableNumber(input.rule.flatAmount),
    percentageRate: toNullableNumber(input.rule.percentageRate),
    minimumCharge: toNullableNumber(input.rule.minimumCharge),
    ruleAccepted: input.ruleAccepted,
    appliedRules: input.appliedRules,
    idempotencyKey: input.rule.recordIdempotencyKey,
    sourceSystem: input.rule.sourceSystem,
  };
}

export function createTariffQuoteCalculateAuditPayload(input: {
  quote: TariffQuoteWithCargoRateCard;
  lineItems: TariffQuoteLineItem[];
  quoteCalculated: boolean;
  taxModelValid: boolean;
  appliedRules: string[];
}): AuditJsonValue {
  const quotedAmount = Number(input.quote.quotedAmount);
  const tax = readTaxFromPayload(input.quote.calculationPayload, quotedAmount);

  return {
    quoteId: input.quote.id,
    quoteReference: input.quote.quoteReference,
    cargoId: input.quote.cargoId,
    cargoReference: input.quote.cargo.cargoReference,
    rateCardId: input.quote.rateCardId,
    rateCardCode: input.quote.rateCard.rateCardCode,
    currencyCode: input.quote.currencyCode,
    taxableAmount: tax.taxableAmount,
    taxRatePercentage: tax.taxRatePercentage,
    taxAmount: tax.taxAmount,
    quotedAmount,
    lineItems: input.lineItems,
    quoteCalculated: input.quoteCalculated,
    taxModelValid: input.taxModelValid,
    appliedRules: input.appliedRules,
    idempotencyKey: input.quote.calculateIdempotencyKey,
    sourceSystem: input.quote.sourceSystem,
  };
}

export function createTariffQuoteApproveAuditPayload(input: {
  quote: TariffQuoteWithCargoRateCard;
  approvalAllowed: boolean;
  appliedRules: string[];
}): AuditJsonValue {
  return {
    quoteId: input.quote.id,
    quoteReference: input.quote.quoteReference,
    status: input.quote.status,
    approvalReference: input.quote.approvalReference,
    approvedByName: input.quote.approvedByName,
    approvedAt: toIsoStringOrNull(input.quote.approvedAt),
    approvalAllowed: input.approvalAllowed,
    appliedRules: input.appliedRules,
    idempotencyKey: input.quote.approveIdempotencyKey,
    sourceSystem: input.quote.sourceSystem,
  };
}
