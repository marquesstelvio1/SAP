import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredFiles = [
  "docs/features/tariff-pricing.md",
  "docs/governance/tariff-release-evidence.md",
  "packages/rpc/src/tariff.ts",
  "packages/rpc/tests/tariff.test.mjs",
  "packages/database/prisma/migrations/20260604220000_tariff_pricing_foundation/migration.sql",
  "apps/api/src/tariff/tariff.module.ts",
  "apps/api/src/tariff/tariff.service.ts",
  "apps/api/src/tariff/tariff-rpc.router.ts",
  "apps/api/tests/tariff-rpc.test.mjs",
  "apps/web/lib/tariff-overview.ts",
  "apps/web/app/(platform)/app/tariffs/actions.ts",
  "apps/web/app/(platform)/app/tariffs/form-state.ts",
  "apps/web/app/(platform)/app/tariffs/page.tsx",
  "apps/web/components/tariff-rate-card-register-form.tsx",
  "apps/web/components/tariff-rate-rule-add-form.tsx",
  "apps/web/components/tariff-quote-calculate-form.tsx",
  "apps/web/components/tariff-quote-approve-form.tsx",
];

const requiredSnippets = [
  {
    file: "packages/auth/src/permissions.ts",
    snippets: ["tariff.read", "tariff.manage", "tariff.quote.calculate", "tariff.quote.approve"],
  },
  {
    file: "packages/database/src/rbac-bootstrap.ts",
    snippets: [
      "tariff.read",
      "tariff.manage",
      "tariff.quote.calculate",
      "tariff.quote.approve",
      "tenant.operations_manager",
      "tenant.operations_viewer",
    ],
  },
  {
    file: "packages/database/prisma/schema.prisma",
    snippets: [
      "enum TariffRateCardStatus",
      "enum TariffChargeType",
      "enum TariffCalculationBasis",
      "enum TariffQuoteStatus",
      "model TariffRateCard",
      "model TariffRateRule",
      "model TariffQuote",
      "recordIdempotencyKey",
      "calculateIdempotencyKey",
      "approveIdempotencyKey",
      "@@unique([organizationId, rateCardCode])",
      "@@unique([organizationId, rateCardId, ruleCode])",
      "@@unique([organizationId, quoteReference])",
    ],
  },
  {
    file: "packages/rpc/src/tariff.ts",
    snippets: [
      "tariffOverviewMetadata",
      "tariffRateCardRegisterMetadata",
      "tariffRateRuleAddMetadata",
      "tariffQuoteCalculateMetadata",
      "tariffQuoteApproveMetadata",
      "tariffOverviewOutputSchema",
      "tariffRateCardRegisterInputSchema",
      "tariffRateRuleAddInputSchema",
      "tariffQuoteCalculateInputSchema",
      "tariffQuoteApproveInputSchema",
      "taxRatePercentage",
      "taxableAmount",
      "taxAmount",
      "taxModelValid",
      "tariff.read",
      "tariff.manage",
      "tariff.quote.calculate",
      "tariff.quote.approve",
      'idempotency: "required"',
      "Rate card valid-until must be after valid-from.",
      "Flat tariff rules require flatAmount.",
    ],
  },
  {
    file: "apps/api/src/tariff/tariff.service.ts",
    snippets: [
      "registerRateCard",
      "addRateRule",
      "calculateQuote",
      "approveQuote",
      "findRateCardByRecordIdempotencyKey",
      "findRateRuleByRecordIdempotencyKey",
      "findQuoteByCalculateIdempotencyKey",
      "findQuoteByApproveIdempotencyKey",
      "resolveTariffRateCardRegisterBusinessRules",
      "resolveTariffRateRuleAddBusinessRules",
      "resolveTariffQuoteCalculateBusinessRules",
      "resolveTariffQuoteApproveBusinessRules",
      "calculateTariffQuoteAmount",
      "auditRecord.create",
      "outboxEvent.create",
      "tariff.rate_card.registered",
      "tariff.rate_rule.added",
      "tariff.quote.calculated",
      "tariff.quote.approved",
      "TARIFF_QUOTE_REQUIRES_APPLICABLE_RULES",
      "TARIFF_QUOTE_TAX_MODEL_VALID",
      "TARIFF_QUOTE_APPROVAL_REQUIRES_CALCULATED_STATE",
      "readTaxFromPayload",
    ],
  },
  {
    file: "apps/api/src/tariff/tariff-rpc.router.ts",
    snippets: [
      "authorizeRequest",
      "tariffOverviewMetadata",
      "tariffRateCardRegisterMetadata",
      "tariffRateRuleAddMetadata",
      "tariffQuoteCalculateMetadata",
      "tariffQuoteApproveMetadata",
      "/tariff/overview",
      "/tariff/registerRateCard",
      "/tariff/addRateRule",
      "/tariff/calculateQuote",
      "/tariff/approveQuote",
    ],
  },
  {
    file: "apps/api/src/rpc/platform-rpc.router.ts",
    snippets: ["createTariffRpcRouter", "tariff: tariffRpcRouter.tariff"],
  },
  {
    file: "apps/api/src/rpc/rpc-http.middleware.ts",
    snippets: ["TariffService", "tariffService"],
  },
  {
    file: "apps/web/app/(platform)/app/tariffs/page.tsx",
    snippets: [
      "tariff.read",
      "tariff.manage",
      "tariff.quote.calculate",
      "tariff.quote.approve",
      "getTariffOverview",
      "TariffRateCardRegisterForm",
      "TariffRateRuleAddForm",
      "TariffQuoteCalculateForm",
      "TariffQuoteApproveForm",
      "Tariff / Pricing",
      "evidencia humana",
      "imposto valido",
    ],
  },
  {
    file: "apps/web/app/(platform)/app/tariffs/actions.ts",
    snippets: [
      "registerTariffRateCardAction",
      "addTariffRateRuleAction",
      "calculateTariffQuoteAction",
      "approveTariffQuoteAction",
      "/rpc/tariff/registerRateCard",
      "/rpc/tariff/addRateRule",
      "/rpc/tariff/calculateQuote",
      "/rpc/tariff/approveQuote",
      "tariffRateCardRegisterInputSchema",
      "tariffRateRuleAddInputSchema",
      "tariffQuoteCalculateInputSchema",
      "tariffQuoteApproveInputSchema",
      "taxRatePercentage",
      "taxAmount",
      "revalidatePath",
    ],
  },
  {
    file: "apps/web/app/(platform)/app/tariffs/form-state.ts",
    snippets: ["taxableAmount", "taxRatePercentage", "taxAmount"],
  },
  {
    file: "apps/web/components/tariff-quote-calculate-form.tsx",
    snippets: ["Imposto %", "taxRatePercentage", "formatOptionalAmount"],
  },
  {
    file: "packages/database/prisma/seed.ts",
    snippets: ["taxableAmount", "taxRatePercentage", "taxAmount", "quotedAmount"],
  },
  {
    file: "apps/web/lib/platform-navigation.ts",
    snippets: [
      "tariff.read",
      "tariff.manage",
      "tariff.quote.calculate",
      "tariff.quote.approve",
      "/app/tariffs",
      "Tariff / Pricing",
    ],
  },
  {
    file: "tests/e2e/runtime-health.spec.ts",
    snippets: ["protected tariff shell redirects anonymous users to sign-in", "/app/tariffs"],
  },
];

const forbiddenRoutes = [
  "apps/web/app/(platform)/app/tariffs/crud",
  "apps/web/app/(platform)/app/pricing/crud",
  "apps/web/app/(platform)/app/tariff/crud",
];

const missing = requiredFiles.filter((file) => !existsSync(join(root, file)));

if (missing.length > 0) {
  console.error("Missing tariff foundation files:");
  for (const file of missing) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

for (const route of forbiddenRoutes) {
  if (existsSync(join(root, route))) {
    console.error(`Unexpected tariff CRUD route before modular acceptance: ${route}`);
    process.exit(1);
  }
}

for (const assertion of requiredSnippets) {
  const source = readFileSync(join(root, assertion.file), "utf8");

  for (const snippet of assertion.snippets) {
    if (!source.includes(snippet)) {
      console.error(`Missing snippet "${snippet}" in ${assertion.file}`);
      process.exit(1);
    }
  }
}

console.log(`SAPTM tariff foundation validation passed: ${requiredFiles.length} files present.`);
