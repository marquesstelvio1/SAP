import type {
  cargoStatuses,
  cargoTypes,
  TariffQuoteApproveInput,
  TariffQuoteApproveOutput,
  TariffQuoteCalculateOutput,
  TariffRateCardRegisterInput,
  TariffRateCardRegisterOutput,
  TariffRateRuleAddInput,
  TariffRateRuleAddOutput,
  tariffCalculationBases,
  tariffChargeTypes,
  tariffQuoteStatuses,
  tariffRateCardStatuses,
} from "@saptm/rpc";

import type {
  TariffCalculationResult,
  TariffCargoRecord,
  TariffQuoteLineItem,
  TariffQuoteWithCargoRateCard,
  TariffRateCardRecord,
  TariffRateRuleRecord,
  TariffRateRuleWithRateCard,
} from "./tariff.dto.js";

export type CargoStatus = (typeof cargoStatuses)[number];
export type CargoType = (typeof cargoTypes)[number];
export type TariffRateCardStatus = (typeof tariffRateCardStatuses)[number];
export type TariffChargeType = (typeof tariffChargeTypes)[number];
export type TariffCalculationBasis = (typeof tariffCalculationBases)[number];
export type TariffQuoteStatus = (typeof tariffQuoteStatuses)[number];

export function resolveTariffRateCardRegisterBusinessRules(input: {
  input: TariffRateCardRegisterInput;
  duplicateRateCard: TariffRateCardRecord | null;
  currencyCode: string;
}): TariffRateCardRegisterOutput["businessRules"] {
  const validityWindowValid =
    input.input.validUntil === undefined ||
    Date.parse(input.input.validUntil) > Date.parse(input.input.validFrom);
  const uniqueRateCardCode = input.duplicateRateCard === null;
  const currencyNormalized = /^[A-Z]{3}$/.test(input.currencyCode);
  const rateCardAccepted = validityWindowValid && uniqueRateCardCode && currencyNormalized;

  return {
    rateCardAccepted,
    uniqueRateCardCode,
    validityWindowValid,
    currencyNormalized,
    appliedRules: [
      "TARIFF_RATE_CARD_UNIQUE_CODE",
      "TARIFF_RATE_CARD_VALIDITY_WINDOW",
      "TARIFF_RATE_CARD_CURRENCY_NORMALIZED",
    ],
  };
}

export function resolveTariffRateRuleAddBusinessRules(input: {
  input: TariffRateRuleAddInput;
  rateCard: TariffRateCardRecord;
  duplicateRule: TariffRateRuleWithRateCard | null;
}): TariffRateRuleAddOutput["businessRules"] {
  const effectiveFrom = new Date(input.input.effectiveFrom);
  const effectiveUntil =
    input.input.effectiveUntil === undefined ? null : new Date(input.input.effectiveUntil);
  const rateCardUsable = input.rateCard.status !== "retired";
  const effectiveWindowValid =
    effectiveFrom >= input.rateCard.validFrom &&
    (input.rateCard.validUntil === null || effectiveFrom <= input.rateCard.validUntil) &&
    (effectiveUntil === null || effectiveUntil > effectiveFrom) &&
    (effectiveUntil === null ||
      input.rateCard.validUntil === null ||
      effectiveUntil <= input.rateCard.validUntil);
  const rateBasisValid = isRateBasisValid(input.input);
  const duplicateRuleBlocked = input.duplicateRule === null;
  const ruleAccepted =
    rateCardUsable && effectiveWindowValid && rateBasisValid && duplicateRuleBlocked;

  return {
    ruleAccepted,
    rateCardUsable,
    effectiveWindowValid,
    rateBasisValid,
    duplicateRuleBlocked,
    appliedRules: [
      "TARIFF_RATE_RULE_RATE_CARD_USABLE",
      "TARIFF_RATE_RULE_EFFECTIVE_WINDOW_WITHIN_RATE_CARD",
      "TARIFF_RATE_RULE_BASIS_VALID",
      "TARIFF_RATE_RULE_DUPLICATE_BLOCKED",
    ],
  };
}

export function resolveTariffQuoteCalculateBusinessRules(input: {
  cargo: TariffCargoRecord;
  rateCard: TariffRateCardRecord;
  calculatedAt: Date;
  applicableRules: TariffRateRuleRecord[];
  calculation: TariffCalculationResult;
  duplicateQuote: TariffQuoteWithCargoRateCard | null;
}): TariffQuoteCalculateOutput["businessRules"] {
  const cargoEligible = !["cancelled", "delivered"].includes(input.cargo.status);
  const rateCardActive = input.rateCard.status === "active";
  const rateCardValidAtCalculation =
    input.calculatedAt >= input.rateCard.validFrom &&
    (input.rateCard.validUntil === null || input.calculatedAt <= input.rateCard.validUntil);
  const applicableRulesFound = input.applicableRules.length > 0;
  const requiredMetricsAvailable = input.calculation.requiredMetricsAvailable;
  const amountPositive = input.calculation.quotedAmount > 0;
  const taxModelValid =
    input.calculation.tax.taxRatePercentage >= 0 &&
    input.calculation.tax.taxRatePercentage <= 100 &&
    input.calculation.tax.taxAmount >= 0 &&
    input.calculation.quotedAmount ===
      roundMoney(input.calculation.tax.taxableAmount + input.calculation.tax.taxAmount);
  const quoteCalculated =
    cargoEligible &&
    rateCardActive &&
    rateCardValidAtCalculation &&
    applicableRulesFound &&
    requiredMetricsAvailable &&
    amountPositive &&
    taxModelValid &&
    input.duplicateQuote === null;

  return {
    quoteCalculated,
    cargoEligible,
    rateCardActive,
    rateCardValidAtCalculation,
    applicableRulesFound,
    requiredMetricsAvailable,
    amountPositive,
    taxModelValid,
    appliedRules: [
      "TARIFF_QUOTE_REQUIRES_ELIGIBLE_CARGO",
      "TARIFF_QUOTE_REQUIRES_ACTIVE_RATE_CARD",
      "TARIFF_QUOTE_REQUIRES_APPLICABLE_RULES",
      "TARIFF_QUOTE_REQUIRES_REQUIRED_METRICS",
      "TARIFF_QUOTE_AMOUNT_POSITIVE",
      "TARIFF_QUOTE_TAX_MODEL_VALID",
      "TARIFF_QUOTE_DUPLICATE_REFERENCE_BLOCKED",
    ],
  };
}

export function resolveTariffQuoteApproveBusinessRules(input: {
  quote: TariffQuoteWithCargoRateCard;
  input: TariffQuoteApproveInput;
  approvedAt: Date;
}): TariffQuoteApproveOutput["businessRules"] {
  const quoteCalculated = input.quote.status === "calculated";
  const approvalAfterCalculation = input.approvedAt >= input.quote.calculatedAt;
  const approvalReferencePresent = input.input.approvalReference.trim().length >= 3;
  const approvalAllowed = quoteCalculated && approvalAfterCalculation && approvalReferencePresent;

  return {
    approvalAllowed,
    quoteCalculated,
    approvalAfterCalculation,
    approvalReferencePresent,
    appliedRules: [
      "TARIFF_QUOTE_APPROVAL_REQUIRES_CALCULATED_STATE",
      "TARIFF_QUOTE_APPROVAL_AFTER_CALCULATION",
      "TARIFF_QUOTE_APPROVAL_REFERENCE_REQUIRED",
    ],
  };
}

export function calculateTariffQuoteAmount(input: {
  cargo: TariffCargoRecord;
  rules: TariffRateRuleRecord[];
  distanceKm?: number;
  taxRatePercentage: number;
}): TariffCalculationResult {
  const lineItems: TariffQuoteLineItem[] = [];
  let subtotal = 0;
  let requiredMetricsAvailable = true;
  const nonPercentageRules = input.rules.filter((rule) => rule.calculationBasis !== "percentage");
  const percentageRules = input.rules.filter((rule) => rule.calculationBasis === "percentage");

  for (const rule of nonPercentageRules) {
    const lineItem = calculateTariffLineItem({
      cargo: input.cargo,
      rule,
      subtotal,
      ...createOptionalDistance(input.distanceKm),
    });

    if (lineItem === null) {
      requiredMetricsAvailable = false;
      continue;
    }

    lineItems.push(lineItem);
    subtotal += lineItem.amount;
  }

  for (const rule of percentageRules) {
    const lineItem = calculateTariffLineItem({
      cargo: input.cargo,
      rule,
      subtotal,
      ...createOptionalDistance(input.distanceKm),
    });

    if (lineItem === null) {
      requiredMetricsAvailable = false;
      continue;
    }

    lineItems.push(lineItem);
    subtotal += lineItem.amount;
  }

  const taxableAmount = roundMoney(subtotal);
  const taxRatePercentage = input.taxRatePercentage;
  const taxAmount = roundMoney((taxableAmount * taxRatePercentage) / 100);

  return {
    lineItems,
    tax: {
      taxableAmount,
      taxRatePercentage,
      taxAmount,
    },
    quotedAmount: roundMoney(taxableAmount + taxAmount),
    requiredMetricsAvailable,
  };
}

function calculateTariffLineItem(input: {
  cargo: TariffCargoRecord;
  rule: TariffRateRuleRecord;
  distanceKm?: number;
  subtotal: number;
}): TariffQuoteLineItem | null {
  const rate = resolveTariffRate(input.rule);
  const quantity = resolveTariffQuantity({
    cargo: input.cargo,
    rule: input.rule,
    subtotal: input.subtotal,
    ...createOptionalDistance(input.distanceKm),
  });

  if (rate === null || quantity === null) {
    return null;
  }

  const rawAmount = input.rule.calculationBasis === "flat" ? rate : roundMoney(quantity * rate);
  const signedAmount = input.rule.chargeType === "discount" ? -Math.abs(rawAmount) : rawAmount;
  const minimumCharge = toNullableNumber(input.rule.minimumCharge);
  const minimumApplied =
    input.rule.chargeType !== "discount" && minimumCharge !== null && signedAmount < minimumCharge;
  const amount = minimumApplied ? minimumCharge : signedAmount;

  return {
    ruleId: input.rule.id,
    ruleCode: input.rule.ruleCode,
    chargeName: input.rule.chargeName,
    chargeType: input.rule.chargeType,
    calculationBasis: input.rule.calculationBasis,
    quantity,
    rate,
    amount: roundMoney(amount),
    minimumApplied,
  };
}

function resolveTariffRate(rule: TariffRateRuleRecord): number | null {
  if (rule.calculationBasis === "flat") {
    return toNullableNumber(rule.flatAmount);
  }

  if (rule.calculationBasis === "percentage") {
    const percentageRate = toNullableNumber(rule.percentageRate);

    return percentageRate === null ? null : percentageRate / 100;
  }

  return toNullableNumber(rule.unitRate);
}

function resolveTariffQuantity(input: {
  cargo: TariffCargoRecord;
  rule: TariffRateRuleRecord;
  distanceKm?: number;
  subtotal: number;
}): number | null {
  if (input.rule.calculationBasis === "flat") {
    return 1;
  }

  if (input.rule.calculationBasis === "per_unit") {
    return input.cargo.packageCount;
  }

  if (input.rule.calculationBasis === "per_weight_kg") {
    return Number(input.cargo.grossWeightKg);
  }

  if (input.rule.calculationBasis === "per_volume_m3") {
    return input.cargo.volumeM3 === null ? null : Number(input.cargo.volumeM3);
  }

  if (input.rule.calculationBasis === "per_distance_km") {
    return input.distanceKm ?? null;
  }

  if (input.rule.calculationBasis === "percentage") {
    return input.subtotal > 0 ? input.subtotal : null;
  }

  return null;
}

export function isTariffRateRuleApplicable(input: {
  rule: TariffRateRuleRecord;
  cargo: TariffCargoRecord;
  calculatedAt: Date;
}): boolean {
  if (input.calculatedAt < input.rule.effectiveFrom) {
    return false;
  }

  if (input.rule.effectiveUntil !== null && input.calculatedAt > input.rule.effectiveUntil) {
    return false;
  }

  if (input.rule.cargoType !== null && input.rule.cargoType !== input.cargo.cargoType) {
    return false;
  }

  if (
    input.rule.originName !== null &&
    normalizeText(input.rule.originName) !== normalizeText(input.cargo.originName)
  ) {
    return false;
  }

  if (
    input.rule.destinationName !== null &&
    normalizeText(input.rule.destinationName) !== normalizeText(input.cargo.destinationName)
  ) {
    return false;
  }

  return true;
}

function isRateBasisValid(input: TariffRateRuleAddInput): boolean {
  if (input.calculationBasis === "flat") {
    return (input.flatAmount ?? 0) > 0;
  }

  if (input.calculationBasis === "percentage") {
    return (input.percentageRate ?? 0) > 0;
  }

  return (input.unitRate ?? 0) > 0;
}

function normalizeText(value: string): string {
  return value.trim().toUpperCase();
}

function createOptionalDistance(distanceKm: number | undefined): { distanceKm?: number } {
  return distanceKm === undefined ? {} : { distanceKm };
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function toNullableNumber(value: unknown | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  return Number(value);
}
