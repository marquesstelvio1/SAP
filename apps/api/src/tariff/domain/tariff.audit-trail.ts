import type { AuditJsonValue } from "@saptm/database";
import type {
  TariffQuoteApproveOutput,
  TariffQuoteCalculateOutput,
  TariffRateCardRegisterOutput,
  TariffRateRuleAddOutput,
} from "@saptm/rpc";
import type {
  TariffCargoRecord,
  TariffQuoteWithCargoRateCard,
  TariffRateCardRecord,
  TariffRateRuleRecord,
  TariffRateRuleWithRateCard,
} from "./tariff.dto.js";
import { toIsoStringOrNull, toNullableNumber } from "./tariff.dto.js";

export function createTariffRateCardRegisterAuditAfter(input: {
  rateCard: TariffRateCardRecord;
  businessRules: TariffRateCardRegisterOutput["businessRules"];
}): AuditJsonValue {
  return {
    rateCardId: input.rateCard.id,
    rateCardCode: input.rateCard.rateCardCode,
    rateCardName: input.rateCard.rateCardName,
    status: input.rateCard.status,
    currencyCode: input.rateCard.currencyCode,
    validFrom: input.rateCard.validFrom.toISOString(),
    validUntil: toIsoStringOrNull(input.rateCard.validUntil),
    rateCardAccepted: input.businessRules.rateCardAccepted,
    appliedRules: input.businessRules.appliedRules,
    idempotencyKey: input.rateCard.recordIdempotencyKey,
    sourceSystem: input.rateCard.sourceSystem,
  };
}

export function createTariffRateRuleAddAuditBefore(input: {
  rateCard: TariffRateCardRecord;
  duplicateRule: TariffRateRuleWithRateCard | null;
  businessRules: TariffRateRuleAddOutput["businessRules"];
}): AuditJsonValue {
  return {
    rateCardId: input.rateCard.id,
    rateCardCode: input.rateCard.rateCardCode,
    rateCardStatus: input.rateCard.status,
    duplicateRuleId: input.duplicateRule?.id ?? null,
    ruleAccepted: input.businessRules.ruleAccepted,
    rateBasisValid: input.businessRules.rateBasisValid,
    appliedRules: input.businessRules.appliedRules,
  };
}

export function createTariffRateRuleAddAuditAfter(input: {
  rule: TariffRateRuleWithRateCard;
  businessRules: TariffRateRuleAddOutput["businessRules"];
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
    ruleAccepted: input.businessRules.ruleAccepted,
    appliedRules: input.businessRules.appliedRules,
    idempotencyKey: input.rule.recordIdempotencyKey,
    sourceSystem: input.rule.sourceSystem,
  };
}

export function createTariffQuoteCalculateAuditBefore(input: {
  cargo: TariffCargoRecord;
  rateCard: TariffRateCardRecord;
  duplicateQuote: TariffQuoteWithCargoRateCard | null;
  applicableRules: TariffRateRuleRecord[];
  businessRules: TariffQuoteCalculateOutput["businessRules"];
}): AuditJsonValue {
  return {
    cargoId: input.cargo.id,
    cargoReference: input.cargo.cargoReference,
    cargoStatus: input.cargo.status,
    rateCardId: input.rateCard.id,
    rateCardCode: input.rateCard.rateCardCode,
    duplicateQuoteId: input.duplicateQuote?.id ?? null,
    applicableRuleCount: input.applicableRules.length,
    quoteCalculated: input.businessRules.quoteCalculated,
    appliedRules: input.businessRules.appliedRules,
  };
}

export function createTariffQuoteCalculateAuditAfter(input: {
  quote: TariffQuoteWithCargoRateCard;
  lineItems: TariffQuoteCalculateOutput["lineItems"][number][];
  businessRules: TariffQuoteCalculateOutput["businessRules"];
}): AuditJsonValue {
  const quotedAmount = Number(input.quote.quotedAmount);

  return {
    quoteId: input.quote.id,
    quoteReference: input.quote.quoteReference,
    cargoId: input.quote.cargoId,
    cargoReference: input.quote.cargo.cargoReference,
    rateCardId: input.quote.rateCardId,
    rateCardCode: input.quote.rateCard.rateCardCode,
    currencyCode: input.quote.currencyCode,
    quotedAmount,
    lineItems: input.lineItems,
    quoteCalculated: input.businessRules.quoteCalculated,
    taxModelValid: input.businessRules.taxModelValid,
    appliedRules: input.businessRules.appliedRules,
    idempotencyKey: input.quote.calculateIdempotencyKey,
    sourceSystem: input.quote.sourceSystem,
  };
}

export function createTariffQuoteApproveAuditBefore(input: {
  quote: TariffQuoteWithCargoRateCard;
  businessRules: TariffQuoteApproveOutput["businessRules"];
}): AuditJsonValue {
  return {
    quoteId: input.quote.id,
    quoteReference: input.quote.quoteReference,
    status: input.quote.status,
    calculatedAt: input.quote.calculatedAt.toISOString(),
    approvalAllowed: input.businessRules.approvalAllowed,
    appliedRules: input.businessRules.appliedRules,
  };
}

export function createTariffQuoteApproveAuditAfter(input: {
  quote: TariffQuoteWithCargoRateCard;
  businessRules: TariffQuoteApproveOutput["businessRules"];
}): AuditJsonValue {
  return {
    quoteId: input.quote.id,
    quoteReference: input.quote.quoteReference,
    status: input.quote.status,
    approvalReference: input.quote.approvalReference,
    approvedByName: input.quote.approvedByName,
    approvedAt: toIsoStringOrNull(input.quote.approvedAt),
    approvalAllowed: input.businessRules.approvalAllowed,
    appliedRules: input.businessRules.appliedRules,
    idempotencyKey: input.quote.approveIdempotencyKey,
    sourceSystem: input.quote.sourceSystem,
  };
}
