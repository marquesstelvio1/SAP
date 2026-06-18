import assert from "node:assert/strict";
import { test } from "node:test";

import { createRouterClient } from "@orpc/server";

import { createTariffRpcRouter } from "../dist/tariff/tariff-rpc.router.js";

const now = "2026-06-05T10:00:00.000Z";
const later = "2026-06-05T11:00:00.000Z";

const rateCard = {
  id: "rate_card_001",
  rateCardCode: "TAR-PORT-001",
  rateCardName: "Port and rail tariff",
  status: "active",
  currencyCode: "USD",
  validFrom: "2026-06-01T00:00:00.000Z",
  validUntil: null,
  sourceSystem: "saptm",
  createdAt: now,
  updatedAt: now,
};

const rule = {
  id: "rule_001",
  rateCardId: "rate_card_001",
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
  createdAt: now,
  updatedAt: now,
};

const cargo = {
  id: "cargo_001",
  cargoReference: "CGO-2026-0001",
  cargoDescription: "Rail containers",
  cargoType: "container",
  status: "ready_for_transport",
  grossWeightKg: 1000,
  packageCount: 1,
  volumeM3: 20,
  originName: "Luanda",
  destinationName: "Lobito",
};

const quote = {
  id: "quote_001",
  cargoId: "cargo_001",
  cargoReference: "CGO-2026-0001",
  rateCardId: "rate_card_001",
  rateCardCode: "TAR-PORT-001",
  quoteReference: "QUOTE-001",
  status: "calculated",
  currencyCode: "USD",
  taxableAmount: 250,
  taxRatePercentage: 0,
  taxAmount: 0,
  quotedAmount: 250,
  calculatedByName: "Pricing Operator",
  calculatedAt: now,
  approvedByName: null,
  approvalReference: null,
  approvalNotes: null,
  approvedAt: null,
  sourceSystem: "saptm",
  createdAt: now,
  updatedAt: now,
};

const lineItem = {
  ruleId: "rule_001",
  ruleCode: "FREIGHT-KG",
  chargeName: "Freight by weight",
  chargeType: "freight",
  calculationBasis: "per_weight_kg",
  quantity: 1000,
  rate: 0.25,
  amount: 250,
  minimumApplied: false,
};

test("tariff overview RPC authorizes request and delegates by organization", async () => {
  const calls = [];
  const requested = [];
  const client = createTariffClient({
    calls,
    permissions: ["tariff.read"],
    tariffService: createTariffService({
      async getOverview(input) {
        requested.push(input);

        return {
          generatedAt: now,
          organizationId: input.organizationId,
          totals: {
            rateCards: 1,
            activeRateCards: 1,
            rules: 1,
            calculatedQuotes: 1,
            approvedQuotes: 0,
          },
          activeRateCards: [rateCard],
          recentQuotes: [quote],
        };
      },
    }),
  });

  const overview = await client.tariff.overview({ limit: 5 });

  assert.equal(overview.organizationId, "org_port_rail");
  assert.equal(calls[0].metadata.name, "tariff.overview.read");
  assert.equal(requested[0].limit, 5);
});

test("tariff rate card register RPC delegates auditable mutation input", async () => {
  const calls = [];
  const registered = [];
  const client = createTariffClient({
    calls,
    permissions: ["tariff.manage"],
    tariffService: createTariffService({
      async registerRateCard(input) {
        registered.push(input);

        return {
          organizationId: input.organizationId,
          rateCardId: "rate_card_001",
          rateCard: {
            ...rateCard,
            rateCardCode: input.rateCardCode,
            rateCardName: input.rateCardName,
            status: input.status,
            currencyCode: input.currencyCode.toUpperCase(),
            validFrom: input.validFrom,
            validUntil: input.validUntil ?? null,
          },
          businessRules: {
            rateCardAccepted: true,
            uniqueRateCardCode: true,
            validityWindowValid: true,
            currencyNormalized: true,
            appliedRules: ["TARIFF_RATE_CARD_UNIQUE_CODE"],
          },
          idempotency: {
            key: input.idempotencyKey,
            replayed: false,
          },
          audit: {
            action: "tariff.rate_card.registered",
            subjectType: "tariff_rate_card",
            subjectId: "rate_card_001",
          },
          outbox: {
            eventType: "tariff.rate_card.registered",
            aggregateType: "tariff",
            aggregateId: "rate_card_001",
          },
        };
      },
    }),
  });

  const result = await client.tariff.registerRateCard({
    rateCardCode: "TAR-PORT-001",
    rateCardName: "Port and rail tariff",
    status: "active",
    currencyCode: "usd",
    validFrom: "2026-06-01T00:00:00.000Z",
    idempotencyKey: "idem_tariff_rate_card_001",
  });

  assert.equal(result.audit.action, "tariff.rate_card.registered");
  assert.equal(calls[0].metadata.name, "tariff.rate_card.register");
  assert.equal(registered[0].actorId, "user_ops");
  assert.equal(registered[0].ipAddress, "127.0.0.1");
});

test("tariff rate rule add RPC delegates pricing rule input", async () => {
  const calls = [];
  const added = [];
  const client = createTariffClient({
    calls,
    permissions: ["tariff.manage"],
    tariffService: createTariffService({
      async addRateRule(input) {
        added.push(input);

        return {
          organizationId: input.organizationId,
          rateCardId: input.rateCardId,
          ruleId: "rule_001",
          rateCard,
          rule: {
            ...rule,
            rateCardId: input.rateCardId,
            ruleCode: input.ruleCode,
            chargeName: input.chargeName,
            chargeType: input.chargeType,
            calculationBasis: input.calculationBasis,
            unitRate: input.unitRate ?? null,
            effectiveFrom: input.effectiveFrom,
          },
          businessRules: {
            ruleAccepted: true,
            rateCardUsable: true,
            effectiveWindowValid: true,
            rateBasisValid: true,
            duplicateRuleBlocked: true,
            appliedRules: ["TARIFF_RATE_RULE_BASIS_VALID"],
          },
          idempotency: {
            key: input.idempotencyKey,
            replayed: false,
          },
          audit: {
            action: "tariff.rate_rule.added",
            subjectType: "tariff_rate_rule",
            subjectId: "rule_001",
          },
          outbox: {
            eventType: "tariff.rate_rule.added",
            aggregateType: "tariff",
            aggregateId: "rule_001",
          },
        };
      },
    }),
  });

  const result = await client.tariff.addRateRule({
    rateCardId: "rate_card_001",
    ruleCode: "FREIGHT-KG",
    chargeName: "Freight by weight",
    chargeType: "freight",
    calculationBasis: "per_weight_kg",
    unitRate: 0.25,
    minimumCharge: 50,
    effectiveFrom: "2026-06-01T00:00:00.000Z",
    idempotencyKey: "idem_tariff_rule_001",
  });

  assert.equal(result.businessRules.rateBasisValid, true);
  assert.equal(calls[0].metadata.name, "tariff.rate_rule.add");
  assert.equal(added[0].organizationId, "org_port_rail");
});

test("tariff quote calculate RPC delegates governed quote input", async () => {
  const calls = [];
  const calculated = [];
  const client = createTariffClient({
    calls,
    permissions: ["tariff.quote.calculate"],
    tariffService: createTariffService({
      async calculateQuote(input) {
        calculated.push(input);

        return {
          organizationId: input.organizationId,
          cargoId: input.cargoId,
          rateCardId: input.rateCardId,
          quoteId: "quote_001",
          cargo,
          rateCard,
          quote: {
            ...quote,
            cargoId: input.cargoId,
            rateCardId: input.rateCardId,
            quoteReference: input.quoteReference,
            taxRatePercentage: input.taxRatePercentage,
            taxAmount: 20,
            quotedAmount: 270,
            calculatedByName: input.calculatedByName,
            calculatedAt: input.calculatedAt,
          },
          lineItems: [lineItem],
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
            key: input.idempotencyKey,
            replayed: false,
          },
          audit: {
            action: "tariff.quote.calculated",
            subjectType: "tariff_quote",
            subjectId: "quote_001",
          },
          outbox: {
            eventType: "tariff.quote.calculated",
            aggregateType: "tariff",
            aggregateId: "quote_001",
          },
        };
      },
    }),
  });

  const result = await client.tariff.calculateQuote({
    cargoId: "cargo_001",
    rateCardId: "rate_card_001",
    quoteReference: "QUOTE-001",
    distanceKm: 450,
    taxRatePercentage: 8,
    calculatedByName: "Pricing Operator",
    calculatedAt: now,
    idempotencyKey: "idem_tariff_quote_001",
  });

  assert.equal(result.quote.taxAmount, 20);
  assert.equal(result.quote.quotedAmount, 270);
  assert.equal(calls[0].metadata.name, "tariff.quote.calculate");
  assert.equal(calculated[0].actorId, "user_ops");
  assert.equal(calculated[0].taxRatePercentage, 8);
});

test("tariff quote approve RPC delegates approval evidence input", async () => {
  const calls = [];
  const approved = [];
  const client = createTariffClient({
    calls,
    permissions: ["tariff.quote.approve"],
    tariffService: createTariffService({
      async approveQuote(input) {
        approved.push(input);

        return {
          organizationId: input.organizationId,
          cargoId: "cargo_001",
          quoteId: input.quoteId,
          cargo,
          rateCard,
          quote: {
            ...quote,
            id: input.quoteId,
            status: "approved",
            approvedByName: input.approvedByName,
            approvalReference: input.approvalReference,
            approvalNotes: input.approvalNotes,
            approvedAt: input.approvedAt,
          },
          businessRules: {
            approvalAllowed: true,
            quoteCalculated: true,
            approvalAfterCalculation: true,
            approvalReferencePresent: true,
            appliedRules: ["TARIFF_QUOTE_APPROVAL_REQUIRES_CALCULATED_STATE"],
          },
          idempotency: {
            key: input.idempotencyKey,
            replayed: false,
          },
          audit: {
            action: "tariff.quote.approved",
            subjectType: "tariff_quote",
            subjectId: input.quoteId,
          },
          outbox: {
            eventType: "tariff.quote.approved",
            aggregateType: "tariff",
            aggregateId: input.quoteId,
          },
        };
      },
    }),
  });

  const result = await client.tariff.approveQuote({
    quoteId: "quote_001",
    approvalReference: "APPROVAL-001",
    approvedByName: "Finance Controller",
    approvalNotes: "Approved for contracted customer rate.",
    approvedAt: later,
    idempotencyKey: "idem_tariff_approve_001",
  });

  assert.equal(result.quote.status, "approved");
  assert.equal(calls[0].metadata.name, "tariff.quote.approve");
  assert.equal(approved[0].ipAddress, "127.0.0.1");
});

function createTariffClient({ calls, permissions, tariffService }) {
  const router = createTariffRpcRouter({
    rpcContextService: {
      async authorizeRequest(request, metadata) {
        calls.push({ request, metadata });

        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_ops",
            userId: "user_ops",
            organizationId: "org_port_rail",
            permissions,
            correlationId: `corr_${metadata.name}`,
            traceContext: {
              correlationId: `corr_${metadata.name}`,
              requestId: `req_${metadata.name}`,
              operationName: metadata.name,
              sourceSystem: "tests",
            },
          },
        };
      },
    },
    tariffService,
  });

  return createRouterClient(router, {
    context: {
      request: {
        headers: {
          "user-agent": "node-test",
          "x-forwarded-for": "127.0.0.1",
        },
      },
    },
  });
}

function createTariffService(overrides) {
  return {
    async getOverview() {
      throw new Error("getOverview should not be called by this test");
    },
    async registerRateCard() {
      throw new Error("registerRateCard should not be called by this test");
    },
    async addRateRule() {
      throw new Error("addRateRule should not be called by this test");
    },
    async calculateQuote() {
      throw new Error("calculateQuote should not be called by this test");
    },
    async approveQuote() {
      throw new Error("approveQuote should not be called by this test");
    },
    ...overrides,
  };
}
