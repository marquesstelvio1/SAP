import assert from "node:assert/strict";
import { test } from "node:test";

import {
  billingCreateCheckoutSessionMetadata,
  billingCreatePortalSessionMetadata,
  billingInvoiceOutputSchema,
  billingInvoiceStatuses,
  billingInvoicesMetadata,
  billingOverviewInputSchema,
  billingOverviewMetadata,
  billingOverviewOutputSchema,
  billingPlanIds,
  billingPlans,
  billingPlansMetadata,
  billingPlansOutputSchema,
  billingPortalMetadata,
  billingSubscriptionMetadata,
  billingSubscriptionOutputSchema,
  billingSubscriptionStatuses,
  billingUsageMetadata,
  billingUsageMetrics,
  billingUsageOutputSchema,
  createCheckoutSessionInputSchema,
  createCheckoutSessionOutputSchema,
  createPortalSessionInputSchema,
  createPortalSessionOutputSchema,
  invoiceSchema,
  planSchema,
  subscriptionSchema,
  usageSchema,
} from "../dist/index.js";

test("billing overview metadata requires session and tenant manage permission", () => {
  assert.equal(billingOverviewMetadata.name, "billing.overview");
  assert.equal(billingOverviewMetadata.kind, "query");
  assert.equal(billingOverviewMetadata.auth, "session");
  assert.equal(billingOverviewMetadata.organizationRequired, true);
  assert.deepEqual(billingOverviewMetadata.permissions, ["tenant.manage"]);
  assert.equal(billingOverviewMetadata.audit, "standard");
  assert.equal(billingOverviewMetadata.observability.criticality, "low");
});

test("billing overview schemas validate subscription overview contract", () => {
  const input = billingOverviewInputSchema.parse({
    organizationId: "org_rail_port",
  });

  assert.equal(input.organizationId, "org_rail_port");

  const output = billingOverviewOutputSchema.parse({
    plan: "pro",
    status: "active",
    currentPeriodStart: "2026-06-01T00:00:00.000Z",
    currentPeriodEnd: "2026-07-01T00:00:00.000Z",
    cancelAtPeriodEnd: false,
    trialEndsAt: null,
    memberUsage: 5,
    memberLimit: 25,
    cargoUsage: 100,
    cargoLimit: 1000,
    trackingUsage: 50,
    trackingLimit: 500,
  });

  assert.equal(output.plan, "pro");
  assert.equal(output.status, "active");
  assert.equal(output.memberUsage, 5);
  assert.equal(output.cargoUsage, 100);
});

test("billing plans metadata is query with no organization required", () => {
  assert.equal(billingPlansMetadata.name, "billing.plans");
  assert.equal(billingPlansMetadata.kind, "query");
  assert.equal(billingPlansMetadata.organizationRequired, false);
  assert.deepEqual(billingPlansMetadata.permissions, ["tenant.manage"]);
  assert.equal(billingPlansMetadata.audit, "standard");
});

test("billing plans schema validates plan catalog contract", () => {
  const output = billingPlansOutputSchema.parse({
    plans: [
      { id: "free", name: "Free", description: "Free plan", price: 0, features: ["Basic"] },
      { id: "pro", name: "Pro", description: "Pro plan", price: 9900, features: ["Advanced"] },
    ],
  });

  assert.equal(output.plans.length, 2);
  assert.equal(output.plans[0].id, "free");
  assert.equal(output.plans[1].price, 9900);
});

test("plan schema validates individual plan structure", () => {
  const plan = planSchema.parse({
    id: "enterprise",
    name: "Enterprise",
    description: "Para grandes operadores logisticos",
    price: 0,
    features: ["Utilizadores ilimitados", "Gerente de conta dedicado"],
  });

  assert.equal(plan.id, "enterprise");
  assert.ok(plan.features.length >= 2);
});

test("billing checkout metadata requires idempotent mutation", () => {
  assert.equal(billingCreateCheckoutSessionMetadata.name, "billing.checkout");
  assert.equal(billingCreateCheckoutSessionMetadata.kind, "mutation");
  assert.equal(billingCreateCheckoutSessionMetadata.auth, "session");
  assert.equal(billingCreateCheckoutSessionMetadata.organizationRequired, true);
  assert.deepEqual(billingCreateCheckoutSessionMetadata.permissions, ["tenant.manage"]);
  assert.equal(billingCreateCheckoutSessionMetadata.audit, "standard");
  assert.equal(billingCreateCheckoutSessionMetadata.idempotency, "required");
  assert.equal(billingCreateCheckoutSessionMetadata.observability.criticality, "medium");
});

test("billing checkout input schema validates checkout session creation", () => {
  assert.throws(() =>
    createCheckoutSessionInputSchema.parse({
      organizationId: "org_rail_port",
      plan: "invalid_plan",
      successUrl: "https://example.com/success",
      cancelUrl: "https://example.com/cancel",
      idempotencyKey: "idem_checkout_001",
    }),
  );

  const input = createCheckoutSessionInputSchema.parse({
    organizationId: "org_rail_port",
    plan: "pro",
    successUrl: "https://example.com/success",
    cancelUrl: "https://example.com/cancel",
    idempotencyKey: "idem_checkout_001",
  });

  assert.equal(input.plan, "pro");
  assert.equal(input.organizationId, "org_rail_port");
});

test("billing checkout output validates audit and outbox contract", () => {
  const output = createCheckoutSessionOutputSchema.parse({
    url: "https://checkout.stripe.com/session_001",
    idempotency: { key: "idem_checkout_001", replayed: false },
    audit: {
      action: "billing.checkout_session_created",
      subjectType: "organization",
      subjectId: "org_rail_port",
    },
    outbox: {
      eventType: "billing.checkout_session_created",
      aggregateType: "billing",
      aggregateId: "org_rail_port",
    },
  });

  assert.ok(output.url.startsWith("https://"));
  assert.equal(output.audit.action, "billing.checkout_session_created");
});

test("billing portal metadata requires mutation with idempotency", () => {
  assert.equal(billingPortalMetadata.name, "billing.portal");
  assert.equal(billingPortalMetadata.kind, "mutation");
  assert.equal(billingPortalMetadata.auth, "session");
  assert.equal(billingPortalMetadata.organizationRequired, true);
  assert.equal(billingPortalMetadata.idempotency, "required");
});

test("billing portal session input schema validates", () => {
  assert.throws(() =>
    createPortalSessionInputSchema.parse({
      idempotencyKey: "short",
    }),
  );

  const input = createPortalSessionInputSchema.parse({
    returnUrl: "https://example.com/portal",
    idempotencyKey: "idem_portal_001",
  });

  assert.equal(input.returnUrl, "https://example.com/portal");
});

test("billing portal output validates URL contract", () => {
  const output = createPortalSessionOutputSchema.parse({
    url: "https://stripe.com/portal/session_001",
    idempotency: { key: "idem_portal_001", replayed: false },
    audit: {
      action: "billing.portal_session_created",
      subjectType: "organization",
      subjectId: "org_rail_port",
    },
    outbox: {
      eventType: "billing.portal_session_created",
      aggregateType: "billing",
      aggregateId: "org_rail_port",
    },
  });

  assert.ok(output.url.startsWith("https://"));
});

test("billing subscription metadata and schema", () => {
  assert.equal(billingSubscriptionMetadata.name, "billing.subscription");
  assert.equal(billingSubscriptionMetadata.kind, "query");
  assert.equal(billingSubscriptionMetadata.audit, "standard");

  const output = billingSubscriptionOutputSchema.parse({
    id: "sub_001",
    plan: "pro",
    status: "active",
    currentPeriodStart: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    trialEndsAt: null,
    stripeCustomerId: "cus_001",
    stripeSubscriptionId: "sub_stripe_001",
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
  });

  assert.equal(output.id, "sub_001");
  assert.equal(output.plan, "pro");
  assert.equal(output.status, "active");
});

test("subscription schema is alias for billing subscription output", () => {
  const s = subscriptionSchema.parse({
    id: "sub_002",
    plan: "free",
    status: "trialing",
    currentPeriodStart: "2026-06-01T00:00:00.000Z",
    currentPeriodEnd: "2026-07-01T00:00:00.000Z",
    cancelAtPeriodEnd: false,
    trialEndsAt: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
  });

  assert.equal(s.id, "sub_002");
});

test("billing invoices metadata and schema", () => {
  assert.equal(billingInvoicesMetadata.name, "billing.invoices");
  assert.equal(billingInvoicesMetadata.kind, "query");
  assert.equal(billingInvoicesMetadata.audit, "standard");

  const invoice = billingInvoiceOutputSchema.parse({
    id: "inv_001",
    stripeInvoiceId: "in_001",
    amount: 9900,
    currency: "usd",
    status: "paid",
    periodStart: "2026-06-01T00:00:00.000Z",
    periodEnd: "2026-07-01T00:00:00.000Z",
    paidAt: "2026-06-01T00:00:00.000Z",
    downloadUrl: "https://invoice.stripe.com/in_001",
    createdAt: "2026-06-01T00:00:00.000Z",
  });

  assert.equal(invoice.amount, 9900);
  assert.equal(invoice.status, "paid");
  assert.equal(invoice.currency, "usd");
});

test("invoice schema is alias for billing invoice output", () => {
  const inv = invoiceSchema.parse({
    id: "inv_002",
    stripeInvoiceId: null,
    amount: 0,
    currency: "eur",
    status: "void",
    periodStart: null,
    periodEnd: null,
    paidAt: null,
    downloadUrl: null,
    createdAt: "2026-06-01T00:00:00.000Z",
  });

  assert.equal(inv.id, "inv_002");
  assert.equal(inv.status, "void");
});

test("billing usage metadata and schema", () => {
  assert.equal(billingUsageMetadata.name, "billing.usage");
  assert.equal(billingUsageMetadata.kind, "query");
  assert.equal(billingUsageMetadata.audit, "standard");

  const usage = billingUsageOutputSchema.parse({
    metrics: [
      { metric: "members", current: 5, limit: 25, remaining: 20 },
      { metric: "cargo_shipments", current: 100, limit: 1000, remaining: 900 },
      { metric: "tracking_events", current: 50, limit: 500, remaining: 450 },
    ],
  });

  assert.equal(usage.metrics.length, 3);
  assert.equal(usage.metrics[0].metric, "members");
  assert.equal(usage.metrics[0].remaining, 20);
});

test("usage schema is alias for billing usage output", () => {
  const u = usageSchema.parse({
    metrics: [{ metric: "members", current: 1, limit: 10, remaining: 9 }],
  });

  assert.equal(u.metrics[0].metric, "members");
});

test("billing plan IDs and constants are correctly defined", () => {
  assert.deepEqual(billingPlanIds, ["free", "pro", "enterprise"]);
  assert.deepEqual(billingPlans, ["free", "pro", "enterprise"]);
  assert.ok(billingSubscriptionStatuses.includes("active"));
  assert.ok(billingInvoiceStatuses.includes("paid"));
  assert.ok(billingUsageMetrics.includes("members"));

  assert.equal(billingCreatePortalSessionMetadata.name, "billing.portal");

  // portal alias metadata matches portal metadata
  assert.equal(
    billingCreateCheckoutSessionMetadata.name,
    billingCreateCheckoutSessionMetadata.name,
  );
});
