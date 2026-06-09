import { z } from "zod";

import { cargoStatuses, cargoTypes } from "./cargo.js";
import { createRpcOperationMetadata } from "./metadata.js";

export const tariffRateCardStatuses = ["draft", "active", "retired"] as const;

export const tariffChargeTypes = [
  "freight",
  "handling",
  "storage",
  "demurrage",
  "surcharge",
  "discount",
  "customs",
  "insurance",
  "other",
] as const;

export const tariffCalculationBases = [
  "flat",
  "per_unit",
  "per_weight_kg",
  "per_volume_m3",
  "per_distance_km",
  "percentage",
] as const;

export const tariffQuoteStatuses = ["calculated", "approved", "rejected", "expired"] as const;

const tariffReferenceSchema = z.string().trim().min(3).max(120);
const tariffIdempotencySchema = z.string().trim().min(12).max(128);
const tariffSourceSystemSchema = z.string().trim().min(1).max(80).default("saptm");
const tariffMoneySchema = z.number().min(0).max(999_999_999.99);
const tariffRateSchema = z.number().min(0).max(999_999.9999);
const tariffTaxRateSchema = z.number().min(0).max(100).default(0);

export const tariffOverviewInputSchema = z
  .object({
    limit: z.number().int().min(1).max(50).default(10),
  })
  .default({
    limit: 10,
  });

export const tariffRateCardRegisterInputSchema = z
  .object({
    rateCardCode: z.string().trim().min(3).max(80),
    rateCardName: z.string().trim().min(3).max(180),
    status: z.enum(tariffRateCardStatuses).default("active"),
    currencyCode: z.string().trim().length(3),
    validFrom: z.string().datetime(),
    validUntil: z.string().datetime().optional(),
    idempotencyKey: tariffIdempotencySchema,
    sourceSystem: tariffSourceSystemSchema,
  })
  .superRefine((rateCard, context) => {
    if (
      rateCard.validUntil !== undefined &&
      Date.parse(rateCard.validUntil) <= Date.parse(rateCard.validFrom)
    ) {
      context.addIssue({
        code: "custom",
        message: "Rate card valid-until must be after valid-from.",
        path: ["validUntil"],
      });
    }
  });

export const tariffRateRuleAddInputSchema = z
  .object({
    rateCardId: z.string().min(1),
    ruleCode: z.string().trim().min(3).max(80),
    chargeName: z.string().trim().min(3).max(180),
    chargeType: z.enum(tariffChargeTypes),
    calculationBasis: z.enum(tariffCalculationBases),
    unitRate: tariffRateSchema.optional(),
    flatAmount: tariffMoneySchema.optional(),
    percentageRate: z.number().min(0).max(100).optional(),
    minimumCharge: tariffMoneySchema.optional(),
    originName: z.string().trim().min(2).max(180).optional(),
    destinationName: z.string().trim().min(2).max(180).optional(),
    cargoType: z.enum(cargoTypes).optional(),
    effectiveFrom: z.string().datetime(),
    effectiveUntil: z.string().datetime().optional(),
    idempotencyKey: tariffIdempotencySchema,
    sourceSystem: tariffSourceSystemSchema,
  })
  .superRefine((rule, context) => {
    if (
      rule.effectiveUntil !== undefined &&
      Date.parse(rule.effectiveUntil) <= Date.parse(rule.effectiveFrom)
    ) {
      context.addIssue({
        code: "custom",
        message: "Tariff rule effective-until must be after effective-from.",
        path: ["effectiveUntil"],
      });
    }

    if (rule.calculationBasis === "flat" && rule.flatAmount === undefined) {
      context.addIssue({
        code: "custom",
        message: "Flat tariff rules require flatAmount.",
        path: ["flatAmount"],
      });
    }

    if (rule.calculationBasis === "percentage" && rule.percentageRate === undefined) {
      context.addIssue({
        code: "custom",
        message: "Percentage tariff rules require percentageRate.",
        path: ["percentageRate"],
      });
    }

    if (
      ["per_unit", "per_weight_kg", "per_volume_m3", "per_distance_km"].includes(
        rule.calculationBasis,
      ) &&
      rule.unitRate === undefined
    ) {
      context.addIssue({
        code: "custom",
        message: "Unit-based tariff rules require unitRate.",
        path: ["unitRate"],
      });
    }
  });

export const tariffQuoteCalculateInputSchema = z.object({
  cargoId: z.string().min(1),
  rateCardId: z.string().min(1),
  quoteReference: tariffReferenceSchema,
  distanceKm: z.number().positive().max(1_000_000).optional(),
  taxRatePercentage: tariffTaxRateSchema,
  calculatedByName: z.string().trim().min(2).max(120),
  calculatedAt: z.string().datetime(),
  idempotencyKey: tariffIdempotencySchema,
  sourceSystem: tariffSourceSystemSchema,
});

export const tariffQuoteApproveInputSchema = z.object({
  quoteId: z.string().min(1),
  approvalReference: tariffReferenceSchema,
  approvedByName: z.string().trim().min(2).max(120),
  approvalNotes: z.string().trim().min(3).max(500),
  approvedAt: z.string().datetime(),
  idempotencyKey: tariffIdempotencySchema,
  sourceSystem: tariffSourceSystemSchema,
});

export const tariffRateCardSummarySchema = z.object({
  id: z.string(),
  rateCardCode: z.string(),
  rateCardName: z.string(),
  status: z.enum(tariffRateCardStatuses),
  currencyCode: z.string(),
  validFrom: z.string(),
  validUntil: z.string().nullable(),
  sourceSystem: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const tariffRateRuleSummarySchema = z.object({
  id: z.string(),
  rateCardId: z.string(),
  ruleCode: z.string(),
  chargeName: z.string(),
  chargeType: z.enum(tariffChargeTypes),
  calculationBasis: z.enum(tariffCalculationBases),
  unitRate: z.number().nullable(),
  flatAmount: z.number().nullable(),
  percentageRate: z.number().nullable(),
  minimumCharge: z.number().nullable(),
  originName: z.string().nullable(),
  destinationName: z.string().nullable(),
  cargoType: z.enum(cargoTypes).nullable(),
  effectiveFrom: z.string(),
  effectiveUntil: z.string().nullable(),
  sourceSystem: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const tariffCargoSummarySchema = z.object({
  id: z.string(),
  cargoReference: z.string(),
  cargoDescription: z.string(),
  cargoType: z.enum(cargoTypes),
  status: z.enum(cargoStatuses),
  grossWeightKg: z.number(),
  packageCount: z.number().int().positive(),
  volumeM3: z.number().nullable(),
  originName: z.string(),
  destinationName: z.string(),
});

export const tariffQuoteLineItemSchema = z.object({
  ruleId: z.string(),
  ruleCode: z.string(),
  chargeName: z.string(),
  chargeType: z.enum(tariffChargeTypes),
  calculationBasis: z.enum(tariffCalculationBases),
  quantity: z.number(),
  rate: z.number(),
  amount: z.number(),
  minimumApplied: z.boolean(),
});

export const tariffQuoteSummarySchema = z.object({
  id: z.string(),
  cargoId: z.string(),
  cargoReference: z.string(),
  rateCardId: z.string(),
  rateCardCode: z.string(),
  quoteReference: z.string(),
  status: z.enum(tariffQuoteStatuses),
  currencyCode: z.string(),
  taxableAmount: z.number(),
  taxRatePercentage: z.number(),
  taxAmount: z.number(),
  quotedAmount: z.number(),
  calculatedByName: z.string(),
  calculatedAt: z.string(),
  approvedByName: z.string().nullable(),
  approvalReference: z.string().nullable(),
  approvalNotes: z.string().nullable(),
  approvedAt: z.string().nullable(),
  sourceSystem: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const tariffOverviewOutputSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string(),
  totals: z.object({
    rateCards: z.number().int().nonnegative(),
    activeRateCards: z.number().int().nonnegative(),
    rules: z.number().int().nonnegative(),
    calculatedQuotes: z.number().int().nonnegative(),
    approvedQuotes: z.number().int().nonnegative(),
  }),
  activeRateCards: z.array(tariffRateCardSummarySchema),
  recentQuotes: z.array(tariffQuoteSummarySchema),
});

export const tariffRateCardRegisterOutputSchema = z.object({
  organizationId: z.string(),
  rateCardId: z.string(),
  rateCard: tariffRateCardSummarySchema,
  businessRules: z.object({
    rateCardAccepted: z.boolean(),
    uniqueRateCardCode: z.boolean(),
    validityWindowValid: z.boolean(),
    currencyNormalized: z.boolean(),
    appliedRules: z.array(z.string()),
  }),
  idempotency: z.object({
    key: z.string(),
    replayed: z.boolean(),
  }),
  audit: z.object({
    action: z.literal("tariff.rate_card.registered"),
    subjectType: z.literal("tariff_rate_card"),
    subjectId: z.string(),
  }),
  outbox: z.object({
    eventType: z.literal("tariff.rate_card.registered"),
    aggregateType: z.literal("tariff"),
    aggregateId: z.string(),
  }),
});

export const tariffRateRuleAddOutputSchema = z.object({
  organizationId: z.string(),
  rateCardId: z.string(),
  ruleId: z.string(),
  rateCard: tariffRateCardSummarySchema,
  rule: tariffRateRuleSummarySchema,
  businessRules: z.object({
    ruleAccepted: z.boolean(),
    rateCardUsable: z.boolean(),
    effectiveWindowValid: z.boolean(),
    rateBasisValid: z.boolean(),
    duplicateRuleBlocked: z.boolean(),
    appliedRules: z.array(z.string()),
  }),
  idempotency: z.object({
    key: z.string(),
    replayed: z.boolean(),
  }),
  audit: z.object({
    action: z.literal("tariff.rate_rule.added"),
    subjectType: z.literal("tariff_rate_rule"),
    subjectId: z.string(),
  }),
  outbox: z.object({
    eventType: z.literal("tariff.rate_rule.added"),
    aggregateType: z.literal("tariff"),
    aggregateId: z.string(),
  }),
});

export const tariffQuoteCalculateOutputSchema = z.object({
  organizationId: z.string(),
  cargoId: z.string(),
  rateCardId: z.string(),
  quoteId: z.string(),
  cargo: tariffCargoSummarySchema,
  rateCard: tariffRateCardSummarySchema,
  quote: tariffQuoteSummarySchema,
  lineItems: z.array(tariffQuoteLineItemSchema),
  businessRules: z.object({
    quoteCalculated: z.boolean(),
    cargoEligible: z.boolean(),
    rateCardActive: z.boolean(),
    rateCardValidAtCalculation: z.boolean(),
    applicableRulesFound: z.boolean(),
    requiredMetricsAvailable: z.boolean(),
    amountPositive: z.boolean(),
    taxModelValid: z.boolean(),
    appliedRules: z.array(z.string()),
  }),
  idempotency: z.object({
    key: z.string(),
    replayed: z.boolean(),
  }),
  audit: z.object({
    action: z.literal("tariff.quote.calculated"),
    subjectType: z.literal("tariff_quote"),
    subjectId: z.string(),
  }),
  outbox: z.object({
    eventType: z.literal("tariff.quote.calculated"),
    aggregateType: z.literal("tariff"),
    aggregateId: z.string(),
  }),
});

export const tariffQuoteApproveOutputSchema = z.object({
  organizationId: z.string(),
  cargoId: z.string(),
  quoteId: z.string(),
  cargo: tariffCargoSummarySchema,
  rateCard: tariffRateCardSummarySchema,
  quote: tariffQuoteSummarySchema,
  businessRules: z.object({
    approvalAllowed: z.boolean(),
    quoteCalculated: z.boolean(),
    approvalAfterCalculation: z.boolean(),
    approvalReferencePresent: z.boolean(),
    appliedRules: z.array(z.string()),
  }),
  idempotency: z.object({
    key: z.string(),
    replayed: z.boolean(),
  }),
  audit: z.object({
    action: z.literal("tariff.quote.approved"),
    subjectType: z.literal("tariff_quote"),
    subjectId: z.string(),
  }),
  outbox: z.object({
    eventType: z.literal("tariff.quote.approved"),
    aggregateType: z.literal("tariff"),
    aggregateId: z.string(),
  }),
});

export type TariffOverviewInput = z.infer<typeof tariffOverviewInputSchema>;
export type TariffOverviewOutput = z.infer<typeof tariffOverviewOutputSchema>;
export type TariffRateCardRegisterInput = z.infer<typeof tariffRateCardRegisterInputSchema>;
export type TariffRateCardRegisterOutput = z.infer<typeof tariffRateCardRegisterOutputSchema>;
export type TariffRateRuleAddInput = z.infer<typeof tariffRateRuleAddInputSchema>;
export type TariffRateRuleAddOutput = z.infer<typeof tariffRateRuleAddOutputSchema>;
export type TariffQuoteCalculateInput = z.infer<typeof tariffQuoteCalculateInputSchema>;
export type TariffQuoteCalculateOutput = z.infer<typeof tariffQuoteCalculateOutputSchema>;
export type TariffQuoteApproveInput = z.infer<typeof tariffQuoteApproveInputSchema>;
export type TariffQuoteApproveOutput = z.infer<typeof tariffQuoteApproveOutputSchema>;

export const tariffOverviewMetadata = createRpcOperationMetadata({
  name: "tariff.overview.read",
  kind: "query",
  auth: "session",
  permissions: ["tariff.read"],
  organizationRequired: true,
  audit: "standard",
  criticality: "high",
  signals: ["log", "metric", "span"],
});

export const tariffRateCardRegisterMetadata = createRpcOperationMetadata({
  name: "tariff.rate_card.register",
  kind: "mutation",
  auth: "session",
  permissions: ["tariff.manage"],
  organizationRequired: true,
  audit: "critical",
  idempotency: "required",
  criticality: "critical",
  signals: ["log", "metric", "span"],
});

export const tariffRateRuleAddMetadata = createRpcOperationMetadata({
  name: "tariff.rate_rule.add",
  kind: "mutation",
  auth: "session",
  permissions: ["tariff.manage"],
  organizationRequired: true,
  audit: "critical",
  idempotency: "required",
  criticality: "critical",
  signals: ["log", "metric", "span"],
});

export const tariffQuoteCalculateMetadata = createRpcOperationMetadata({
  name: "tariff.quote.calculate",
  kind: "mutation",
  auth: "session",
  permissions: ["tariff.quote.calculate"],
  organizationRequired: true,
  audit: "critical",
  idempotency: "required",
  criticality: "critical",
  signals: ["log", "metric", "span"],
});

export const tariffQuoteApproveMetadata = createRpcOperationMetadata({
  name: "tariff.quote.approve",
  kind: "mutation",
  auth: "session",
  permissions: ["tariff.quote.approve"],
  organizationRequired: true,
  audit: "critical",
  idempotency: "required",
  criticality: "critical",
  signals: ["log", "metric", "span"],
});
