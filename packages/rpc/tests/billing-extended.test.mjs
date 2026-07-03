import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  billingInvoicesListInputSchema,
  billingInvoicesListMetadata,
  billingInvoicesListOutputSchema,
  billingPlanSchema,
  billingSubscriptionGetMetadata,
  billingSubscriptionGetOutputSchema,
  billingSubscriptionStatuses,
  billingSubscriptionUsageMetadata,
  billingUsageOutputSchema,
  getPlanInputSchema,
  getPlanMetadata,
  getPlanOutputSchema,
  listPlansInputSchema,
  listPlansMetadata,
  listPlansOutputSchema,
  planSchema,
  planSlugs,
} from "../dist/index.js";

// ──────────────────────────────────────────────
// Work Stream A: billing.plans.list
// ──────────────────────────────────────────────

describe("billing.plans.list RPC contract", () => {
  it("metadata defines query with session auth", () => {
    assert.equal(listPlansMetadata.name, "billing.plans.list");
    assert.equal(listPlansMetadata.kind, "query");
    assert.equal(listPlansMetadata.auth, "session");
    assert.equal(listPlansMetadata.organizationRequired, false);
    assert.deepEqual(listPlansMetadata.permissions, ["tenant.manage"]);
    assert.equal(listPlansMetadata.audit, "standard");
    assert.equal(listPlansMetadata.idempotency, "none");
    assert.equal(listPlansMetadata.observability.criticality, "low");
  });

  it("listPlansInputSchema accepts optional includeInternal", () => {
    const defaultInput = listPlansInputSchema.parse({});
    assert.equal(defaultInput.includeInternal, false);

    const explicitInput = listPlansInputSchema.parse({ includeInternal: true });
    assert.equal(explicitInput.includeInternal, true);
  });

  it("listPlansOutputSchema validates plans array with sortOrder", () => {
    const output = listPlansOutputSchema.parse({
      plans: [
        {
          id: "p1",
          slug: "free",
          name: "Free",
          description: "Free plan for small teams",
          price: 0,
          currency: "USD",
          interval: "month",
          features: [{ key: "max_members", label: "Membros", included: true, limit: "5" }],
          limits: {
            maxMembers: 5,
            maxCargos: 50,
            maxTrackingEvents: 1000,
            maxApiCalls: 1000,
            maxTeams: 0,
            hasSso: false,
            hasApi: false,
            hasWebhooks: false,
            hasReports: true,
            hasAuditLog: false,
          },
          isPublic: true,
          sortOrder: 1,
        },
        {
          id: "p2",
          slug: "pro",
          name: "Pro",
          description: "Pro plan for growing operations",
          price: 9900,
          currency: "USD",
          interval: "month",
          features: [{ key: "max_members", label: "Membros", included: true, limit: "25" }],
          limits: {
            maxMembers: 25,
            maxCargos: 1000,
            maxTrackingEvents: 50000,
            maxApiCalls: 10000,
            maxTeams: 5,
            hasSso: false,
            hasApi: true,
            hasWebhooks: true,
            hasReports: true,
            hasAuditLog: true,
          },
          isPublic: true,
          sortOrder: 2,
        },
      ],
    });

    assert.equal(output.plans.length, 2);
    assert.equal(output.plans[0].sortOrder, 1);
    assert.equal(output.plans[1].sortOrder, 2);
    assert.equal(output.plans[0].slug, "free");
    assert.equal(output.plans[1].slug, "pro");
  });

  it("rejects plan with invalid slug", () => {
    assert.throws(() => {
      planSchema.parse({
        id: "p_bad",
        slug: "ultra",
        name: "Ultra",
        description: null,
        price: 0,
        currency: "USD",
        interval: "month",
        features: [],
        limits: {
          maxMembers: 5,
          maxCargos: 50,
          maxTrackingEvents: 1000,
          maxApiCalls: 1000,
          maxTeams: 0,
          hasSso: false,
          hasApi: false,
          hasWebhooks: false,
          hasReports: true,
          hasAuditLog: false,
        },
        isPublic: true,
        sortOrder: 99,
      });
    }, /Invalid option/);
  });

  it("rejects plan with negative price", () => {
    assert.throws(() => {
      billingPlanSchema.parse({
        id: "free",
        name: "Free",
        description: "Free plan",
        price: -100,
        features: ["Basic"],
      });
    }, /too_small/);
  });
});

// ──────────────────────────────────────────────
// Work Stream A: billing.plans.get
// ──────────────────────────────────────────────

describe("billing.plans.get RPC contract", () => {
  it("metadata defines query with session auth and org required", () => {
    assert.equal(getPlanMetadata.name, "billing.plans.get");
    assert.equal(getPlanMetadata.kind, "query");
    assert.equal(getPlanMetadata.auth, "session");
    assert.equal(getPlanMetadata.organizationRequired, true);
    assert.deepEqual(getPlanMetadata.permissions, ["tenant.manage"]);
    assert.equal(getPlanMetadata.audit, "standard");
  });

  it("getPlanInputSchema validates slug enum", () => {
    const input = getPlanInputSchema.parse({ slug: "pro" });
    assert.equal(input.slug, "pro");

    assert.throws(() => {
      getPlanInputSchema.parse({ slug: "invalid_plan" });
    }, /Invalid option/);

    assert.throws(() => {
      getPlanInputSchema.parse({});
    });

    assert.throws(() => {
      getPlanInputSchema.parse({ slug: 123 });
    });
  });

  it("getPlanOutputSchema validates nested plan object", () => {
    const output = getPlanOutputSchema.parse({
      plan: {
        id: "p_pro",
        slug: "pro",
        name: "Pro",
        description: "Plan Pro",
        price: 9900,
        currency: "EUR",
        interval: "month",
        features: [
          { key: "api_access", label: "API", included: true },
          { key: "webhooks", label: "Webhooks", included: false },
        ],
        limits: {
          maxMembers: 25,
          maxCargos: 1000,
          maxTrackingEvents: 50000,
          maxApiCalls: 10000,
          maxTeams: 5,
          hasSso: false,
          hasApi: true,
          hasWebhooks: true,
          hasReports: true,
          hasAuditLog: true,
        },
        isPublic: true,
        sortOrder: 2,
      },
    });

    assert.equal(output.plan.slug, "pro");
    assert.equal(output.plan.price, 9900);
    assert.equal(output.plan.features.length, 2);
  });

  it("rejects getPlanOutput with missing required fields", () => {
    assert.throws(() => {
      getPlanOutputSchema.parse({ plan: { slug: "free" } });
    }, /Invalid input/);
  });
});

// ──────────────────────────────────────────────
// Work Stream A: billing.subscription.get
// ──────────────────────────────────────────────

describe("billing.subscription.get RPC contract", () => {
  it("metadata defines query with session auth", () => {
    assert.equal(billingSubscriptionGetMetadata.name, "billing.subscription.get");
    assert.equal(billingSubscriptionGetMetadata.kind, "query");
    assert.equal(billingSubscriptionGetMetadata.auth, "session");
    assert.equal(billingSubscriptionGetMetadata.organizationRequired, true);
    assert.deepEqual(billingSubscriptionGetMetadata.permissions, ["tenant.manage"]);
  });

  it("billingSubscriptionGetOutputSchema validates subscription with usage", () => {
    const output = billingSubscriptionGetOutputSchema.parse({
      subscription: {
        id: "sub_001",
        plan: "pro",
        status: "active",
        currentPeriodStart: "2026-06-01T00:00:00.000Z",
        currentPeriodEnd: "2026-07-01T00:00:00.000Z",
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
        stripeCustomerId: "cus_001",
        stripeSubscriptionId: "sub_stripe_001",
        createdAt: "2026-06-01T00:00:00.000Z",
        updatedAt: "2026-06-01T00:00:00.000Z",
        usage: [{ metric: "members", current: 5, limit: 25, remaining: 20 }],
      },
    });

    assert.equal(output.subscription.plan, "pro");
    assert.equal(output.subscription.status, "active");
    assert.equal(output.subscription.usage.length, 1);
    assert.equal(output.subscription.usage[0].metric, "members");
    assert.equal(output.subscription.usage[0].remaining, 20);
  });

  it("rejects subscription with invalid status", () => {
    assert.throws(() => {
      billingSubscriptionGetOutputSchema.parse({
        subscription: {
          id: "sub_bad",
          plan: "free",
          status: "nonexistent_status",
          currentPeriodStart: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          trialEndsAt: null,
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          createdAt: "2026-06-01T00:00:00.000Z",
          updatedAt: "2026-06-01T00:00:00.000Z",
          usage: [],
        },
      });
    }, /Invalid option/);
  });

  it("rejects subscription with invalid plan", () => {
    assert.throws(() => {
      billingSubscriptionGetOutputSchema.parse({
        subscription: {
          id: "sub_bad",
          plan: "nonexistent",
          status: "active",
          currentPeriodStart: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          trialEndsAt: null,
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          createdAt: "2026-06-01T00:00:00.000Z",
          updatedAt: "2026-06-01T00:00:00.000Z",
          usage: [],
        },
      });
    }, /Invalid option/);
  });
});

// ──────────────────────────────────────────────
// Work Stream A: billing.subscription.usage
// ──────────────────────────────────────────────

describe("billing.subscription.usage RPC contract", () => {
  it("metadata defines query with proper permission", () => {
    assert.equal(billingSubscriptionUsageMetadata.name, "billing.subscription.usage");
    assert.equal(billingSubscriptionUsageMetadata.kind, "query");
    assert.equal(billingSubscriptionUsageMetadata.auth, "session");
    assert.equal(billingSubscriptionUsageMetadata.organizationRequired, true);
    assert.deepEqual(billingSubscriptionUsageMetadata.permissions, ["tenant.manage"]);
  });

  it("billingUsageOutputSchema validates usage with displayLabel and unit", () => {
    const output = billingUsageOutputSchema.parse({
      metrics: [
        {
          metric: "members",
          current: 5,
          limit: 25,
          remaining: 20,
          displayLabel: "Membros",
          unit: "/mês",
        },
        {
          metric: "cargo_shipments",
          current: 100,
          limit: 1000,
          remaining: 900,
          displayLabel: "Cargas",
          unit: "/mês",
        },
        {
          metric: "tracking_events",
          current: 50,
          limit: 500,
          remaining: 450,
          displayLabel: "Eventos de tracking",
          unit: "/mês",
        },
      ],
    });

    assert.equal(output.metrics.length, 3);
    assert.equal(output.metrics[0].displayLabel, "Membros");
    assert.equal(output.metrics[0].unit, "/mês");
    assert.equal(output.metrics[1].displayLabel, "Cargas");
    assert.equal(output.metrics[2].displayLabel, "Eventos de tracking");
  });

  it("accepts usage without unit (optional)", () => {
    const output = billingUsageOutputSchema.parse({
      metrics: [{ metric: "members", current: 0, limit: 5, remaining: 5, displayLabel: "Membros" }],
    });

    assert.equal(output.metrics[0].displayLabel, "Membros");
    assert.equal(output.metrics[0].unit, undefined);
  });

  it("rejects usage with invalid metric", () => {
    assert.throws(() => {
      billingUsageOutputSchema.parse({
        metrics: [
          { metric: "invalid_metric", current: 0, limit: 5, remaining: 5, displayLabel: "Invalid" },
        ],
      });
    }, /Invalid option/);
  });

  it("rejects usage with negative current value", () => {
    assert.throws(() => {
      billingUsageOutputSchema.parse({
        metrics: [
          { metric: "members", current: -1, limit: 5, remaining: 6, displayLabel: "Membros" },
        ],
      });
    }, /too_small/);
  });
});

// ──────────────────────────────────────────────
// Work Stream A: billing.invoices.list
// ──────────────────────────────────────────────

describe("billing.invoices.list RPC contract", () => {
  it("metadata defines query with proper permission", () => {
    assert.equal(billingInvoicesListMetadata.name, "billing.invoices.list");
    assert.equal(billingInvoicesListMetadata.kind, "query");
    assert.equal(billingInvoicesListMetadata.auth, "session");
    assert.equal(billingInvoicesListMetadata.organizationRequired, true);
    assert.deepEqual(billingInvoicesListMetadata.permissions, ["tenant.manage"]);
    assert.equal(billingInvoicesListMetadata.audit, "standard");
    assert.equal(billingInvoicesListMetadata.idempotency, "none");
  });

  it("billingInvoicesListInputSchema validates limit and offset", () => {
    const defaultInput = billingInvoicesListInputSchema.parse({});
    assert.equal(defaultInput.limit, 10);
    assert.equal(defaultInput.offset, 0);

    const customInput = billingInvoicesListInputSchema.parse({ limit: 25, offset: 10 });
    assert.equal(customInput.limit, 25);
    assert.equal(customInput.offset, 10);

    assert.throws(() => {
      billingInvoicesListInputSchema.parse({ limit: 0 });
    }, /too_small/);

    assert.throws(() => {
      billingInvoicesListInputSchema.parse({ limit: 200 });
    }, /too_big/);

    assert.throws(() => {
      billingInvoicesListInputSchema.parse({ offset: -1 });
    }, /too_small/);
  });

  it("billingInvoicesListOutputSchema validates paginated invoice list", () => {
    const output = billingInvoicesListOutputSchema.parse({
      invoices: [
        {
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
        },
        {
          id: "inv_002",
          stripeInvoiceId: "in_002",
          amount: 9900,
          currency: "eur",
          status: "open",
          periodStart: null,
          periodEnd: null,
          paidAt: null,
          downloadUrl: null,
          createdAt: "2026-06-15T00:00:00.000Z",
        },
      ],
      pagination: {
        totalCount: 2,
        limit: 10,
        offset: 0,
      },
    });

    assert.equal(output.invoices.length, 2);
    assert.equal(output.pagination.totalCount, 2);
    assert.equal(output.pagination.limit, 10);
    assert.equal(output.pagination.offset, 0);
  });

  it("rejects invoices list with invalid invoice status", () => {
    assert.throws(() => {
      billingInvoicesListOutputSchema.parse({
        invoices: [
          {
            id: "inv_bad",
            stripeInvoiceId: null,
            amount: 100,
            currency: "usd",
            status: "invalid_status",
            periodStart: null,
            periodEnd: null,
            paidAt: null,
            downloadUrl: null,
            createdAt: "2026-06-01T00:00:00.000Z",
          },
        ],
        pagination: { totalCount: 1, limit: 10, offset: 0 },
      });
    }, /Invalid option/);
  });

  it("rejects invoices list with negative pagination values", () => {
    assert.throws(() => {
      billingInvoicesListOutputSchema.parse({
        invoices: [],
        pagination: { totalCount: -1, limit: 10, offset: 0 },
      });
    }, /too_small/);

    assert.throws(() => {
      billingInvoicesListOutputSchema.parse({
        invoices: [],
        pagination: { totalCount: 0, limit: 10, offset: -1 },
      });
    }, /too_small/);
  });
});

// ──────────────────────────────────────────────
// Constants and Enums
// ──────────────────────────────────────────────

describe("billing plan constants", () => {
  it("planSlugs contains all expected slugs", () => {
    assert.deepEqual([...planSlugs], ["free", "pro", "enterprise"]);
  });

  it("billingSubscriptionStatuses contains all expected statuses", () => {
    assert.ok(billingSubscriptionStatuses.includes("active"));
    assert.ok(billingSubscriptionStatuses.includes("past_due"));
    assert.ok(billingSubscriptionStatuses.includes("canceled"));
    assert.ok(billingSubscriptionStatuses.includes("unpaid"));
    assert.ok(billingSubscriptionStatuses.includes("trialing"));
  });
});
