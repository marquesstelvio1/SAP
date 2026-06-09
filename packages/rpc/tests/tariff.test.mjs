import assert from "node:assert/strict";
import test from "node:test";
import {
  tariffOverviewMetadata,
  tariffOverviewOutputSchema,
  tariffQuoteApproveInputSchema,
  tariffQuoteApproveOutputSchema,
  tariffQuoteCalculateInputSchema,
  tariffQuoteCalculateOutputSchema,
  tariffRateCardRegisterInputSchema,
  tariffRateCardRegisterOutputSchema,
  tariffRateRuleAddInputSchema,
  tariffRateRuleAddOutputSchema,
} from "../dist/index.js";

test("tariff overview metadata requires governed read permission", () => {
  assert.equal(tariffOverviewMetadata.auth, "session");
  assert.deepEqual(tariffOverviewMetadata.permissions, ["tariff.read"]);
  assert.equal(tariffOverviewMetadata.organizationRequired, true);
});

test("tariff overview schema validates active rate cards and quotes", () => {
  const parsed = tariffOverviewOutputSchema.parse({
    generatedAt: "2026-06-05T10:00:00.000Z",
    organizationId: "org_1",
    totals: {
      rateCards: 1,
      activeRateCards: 1,
      rules: 2,
      calculatedQuotes: 1,
      approvedQuotes: 0,
    },
    activeRateCards: [createRateCard()],
    recentQuotes: [],
  });

  assert.equal(parsed.totals.activeRateCards, 1);
});

test("tariff rate card register contract enforces valid windows", () => {
  assert.throws(() =>
    tariffRateCardRegisterInputSchema.parse({
      rateCardCode: "TAR-PORT-001",
      rateCardName: "Port and rail tariff",
      status: "active",
      currencyCode: "usd",
      validFrom: "2026-06-10T00:00:00.000Z",
      validUntil: "2026-06-09T00:00:00.000Z",
      idempotencyKey: "tariff_rate_card_key",
      sourceSystem: "saptm",
    }),
  );

  const output = tariffRateCardRegisterOutputSchema.parse({
    organizationId: "org_1",
    rateCardId: "rc_1",
    rateCard: createRateCard(),
    businessRules: {
      rateCardAccepted: true,
      uniqueRateCardCode: true,
      validityWindowValid: true,
      currencyNormalized: true,
      appliedRules: ["TARIFF_RATE_CARD_UNIQUE_CODE"],
    },
    idempotency: {
      key: "tariff_rate_card_key",
      replayed: false,
    },
    audit: {
      action: "tariff.rate_card.registered",
      subjectType: "tariff_rate_card",
      subjectId: "rc_1",
    },
    outbox: {
      eventType: "tariff.rate_card.registered",
      aggregateType: "tariff",
      aggregateId: "rc_1",
    },
  });

  assert.equal(output.rateCard.currencyCode, "USD");
});

test("tariff rate rule contract requires basis-specific rates", () => {
  assert.throws(() =>
    tariffRateRuleAddInputSchema.parse({
      rateCardId: "rc_1",
      ruleCode: "FREIGHT-KG",
      chargeName: "Freight by weight",
      chargeType: "freight",
      calculationBasis: "per_weight_kg",
      effectiveFrom: "2026-06-01T00:00:00.000Z",
      idempotencyKey: "tariff_rule_add_key",
      sourceSystem: "saptm",
    }),
  );

  const output = tariffRateRuleAddOutputSchema.parse({
    organizationId: "org_1",
    rateCardId: "rc_1",
    ruleId: "rule_1",
    rateCard: createRateCard(),
    rule: createRule(),
    businessRules: {
      ruleAccepted: true,
      rateCardUsable: true,
      effectiveWindowValid: true,
      rateBasisValid: true,
      duplicateRuleBlocked: true,
      appliedRules: ["TARIFF_RATE_RULE_BASIS_VALID"],
    },
    idempotency: {
      key: "tariff_rule_add_key",
      replayed: false,
    },
    audit: {
      action: "tariff.rate_rule.added",
      subjectType: "tariff_rate_rule",
      subjectId: "rule_1",
    },
    outbox: {
      eventType: "tariff.rate_rule.added",
      aggregateType: "tariff",
      aggregateId: "rule_1",
    },
  });

  assert.equal(output.rule.calculationBasis, "per_weight_kg");
});

test("tariff quote calculate and approve contracts validate audit outputs", () => {
  const calculateInput = tariffQuoteCalculateInputSchema.parse({
    cargoId: "cargo_1",
    rateCardId: "rc_1",
    quoteReference: "QUOTE-001",
    distanceKm: 450,
    taxRatePercentage: 8,
    calculatedByName: "Pricing operator",
    calculatedAt: "2026-06-05T10:00:00.000Z",
    idempotencyKey: "tariff_quote_calculate_key",
    sourceSystem: "saptm",
  });
  assert.equal(calculateInput.distanceKm, 450);
  assert.equal(calculateInput.taxRatePercentage, 8);

  const calculateOutput = tariffQuoteCalculateOutputSchema.parse({
    organizationId: "org_1",
    cargoId: "cargo_1",
    rateCardId: "rc_1",
    quoteId: "quote_1",
    cargo: createCargo(),
    rateCard: createRateCard(),
    quote: createQuote(),
    lineItems: [createLineItem()],
    businessRules: {
      quoteCalculated: true,
      cargoEligible: true,
      rateCardActive: true,
      rateCardValidAtCalculation: true,
      applicableRulesFound: true,
      requiredMetricsAvailable: true,
      amountPositive: true,
      taxModelValid: true,
      appliedRules: ["TARIFF_QUOTE_AMOUNT_POSITIVE", "TARIFF_QUOTE_TAX_MODEL_VALID"],
    },
    idempotency: {
      key: "tariff_quote_calculate_key",
      replayed: false,
    },
    audit: {
      action: "tariff.quote.calculated",
      subjectType: "tariff_quote",
      subjectId: "quote_1",
    },
    outbox: {
      eventType: "tariff.quote.calculated",
      aggregateType: "tariff",
      aggregateId: "quote_1",
    },
  });
  assert.equal(calculateOutput.quote.taxAmount, 20);
  assert.equal(calculateOutput.quote.quotedAmount, 270);

  const approveInput = tariffQuoteApproveInputSchema.parse({
    quoteId: "quote_1",
    approvalReference: "APPROVAL-001",
    approvedByName: "Finance controller",
    approvalNotes: "Approved for contracted customer rate.",
    approvedAt: "2026-06-05T11:00:00.000Z",
    idempotencyKey: "tariff_quote_approve_key",
    sourceSystem: "saptm",
  });
  assert.equal(approveInput.approvalReference, "APPROVAL-001");

  const approveOutput = tariffQuoteApproveOutputSchema.parse({
    organizationId: "org_1",
    cargoId: "cargo_1",
    quoteId: "quote_1",
    cargo: createCargo(),
    rateCard: createRateCard(),
    quote: {
      ...createQuote(),
      status: "approved",
      approvedByName: "Finance controller",
      approvalReference: "APPROVAL-001",
      approvalNotes: "Approved for contracted customer rate.",
      approvedAt: "2026-06-05T11:00:00.000Z",
    },
    businessRules: {
      approvalAllowed: true,
      quoteCalculated: true,
      approvalAfterCalculation: true,
      approvalReferencePresent: true,
      appliedRules: ["TARIFF_QUOTE_APPROVAL_REQUIRES_CALCULATED_STATE"],
    },
    idempotency: {
      key: "tariff_quote_approve_key",
      replayed: false,
    },
    audit: {
      action: "tariff.quote.approved",
      subjectType: "tariff_quote",
      subjectId: "quote_1",
    },
    outbox: {
      eventType: "tariff.quote.approved",
      aggregateType: "tariff",
      aggregateId: "quote_1",
    },
  });
  assert.equal(approveOutput.quote.status, "approved");
});

function createRateCard() {
  return {
    id: "rc_1",
    rateCardCode: "TAR-PORT-001",
    rateCardName: "Port and rail tariff",
    status: "active",
    currencyCode: "USD",
    validFrom: "2026-06-01T00:00:00.000Z",
    validUntil: null,
    sourceSystem: "saptm",
    createdAt: "2026-06-05T10:00:00.000Z",
    updatedAt: "2026-06-05T10:00:00.000Z",
  };
}

function createRule() {
  return {
    id: "rule_1",
    rateCardId: "rc_1",
    ruleCode: "FREIGHT-KG",
    chargeName: "Freight by weight",
    chargeType: "freight",
    calculationBasis: "per_weight_kg",
    unitRate: 0.25,
    flatAmount: null,
    percentageRate: null,
    minimumCharge: 50,
    originName: null,
    destinationName: null,
    cargoType: null,
    effectiveFrom: "2026-06-01T00:00:00.000Z",
    effectiveUntil: null,
    sourceSystem: "saptm",
    createdAt: "2026-06-05T10:00:00.000Z",
    updatedAt: "2026-06-05T10:00:00.000Z",
  };
}

function createCargo() {
  return {
    id: "cargo_1",
    cargoReference: "CGO-001",
    cargoDescription: "Containerized rail cargo",
    cargoType: "container",
    status: "ready_for_transport",
    grossWeightKg: 1000,
    packageCount: 1,
    volumeM3: 20,
    originName: "Luanda",
    destinationName: "Lobito",
  };
}

function createQuote() {
  return {
    id: "quote_1",
    cargoId: "cargo_1",
    cargoReference: "CGO-001",
    rateCardId: "rc_1",
    rateCardCode: "TAR-PORT-001",
    quoteReference: "QUOTE-001",
    status: "calculated",
    currencyCode: "USD",
    taxableAmount: 250,
    taxRatePercentage: 8,
    taxAmount: 20,
    quotedAmount: 270,
    calculatedByName: "Pricing operator",
    calculatedAt: "2026-06-05T10:00:00.000Z",
    approvedByName: null,
    approvalReference: null,
    approvalNotes: null,
    approvedAt: null,
    sourceSystem: "saptm",
    createdAt: "2026-06-05T10:00:00.000Z",
    updatedAt: "2026-06-05T10:00:00.000Z",
  };
}

function createLineItem() {
  return {
    ruleId: "rule_1",
    ruleCode: "FREIGHT-KG",
    chargeName: "Freight by weight",
    chargeType: "freight",
    calculationBasis: "per_weight_kg",
    quantity: 1000,
    rate: 0.25,
    amount: 250,
    minimumApplied: false,
  };
}
