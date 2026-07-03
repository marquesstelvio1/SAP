import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BillingService } from "../dist/billing/billing.service.js";
import { PlansService } from "../dist/billing/plans/plans.service.js";
import { assertRejectsWithMessage } from "./test-utils.mjs";

// ──────────────────────────────────────────────
// Work Stream B: PlansService Integration Test
// ──────────────────────────────────────────────

describe("PlansService", () => {
  describe("getPlanBySlug", () => {
    it("returns plan for valid slug", async () => {
      const { service } = createPlansService();

      const plan = await service.getPlanBySlug("pro");

      assert.equal(plan.slug, "pro");
      assert.equal(plan.name, "Pro");
      assert.equal(plan.price, 9900);
      assert.equal(plan.currency, "EUR");
      assert.equal(plan.interval, "month");
      assert.equal(plan.isPublic, true);
      assert.equal(plan.sortOrder, 2);
      assert.ok(plan.features.length > 0);
      assert.equal(plan.limits.maxMembers, 25);
      assert.equal(plan.limits.hasSso, false);
      assert.equal(plan.limits.hasApi, true);
    });

    it("throws NotFoundException for invalid slug", async () => {
      const { service } = createPlansService();

      await assertRejectsWithMessage(
        () => service.getPlanBySlug("nonexistent"),
        "plans.nao_encontrado",
      );
    });

    it("throws NotFoundException when repository returns null", async () => {
      const { service, repository } = createPlansService();
      repository.findBySlug = async () => null;

      await assertRejectsWithMessage(() => service.getPlanBySlug("free"), "plans.nao_encontrado");
    });
  });

  describe("listPlans", () => {
    it("returns only public plans by default", async () => {
      const { service } = createPlansService();

      const plans = await service.listPlans();

      assert.ok(plans.length >= 2);
      assert.equal(plans[0].slug, "free");
      assert.equal(plans[1].slug, "pro");
      // Internal plan should NOT be included
      const internalPlan = plans.find((p) => p.isPublic === false);
      assert.equal(internalPlan, undefined);
    });

    it("includes internal plans when requested", async () => {
      const { service } = createPlansService();

      const plans = await service.listPlans({ includeInternal: true });

      const internalPlan = plans.find((p) => p.isPublic === false);
      assert.ok(internalPlan !== undefined);
      assert.equal(internalPlan.slug, "enterprise");
    });

    it("returns plans sorted by sortOrder", async () => {
      const { service } = createPlansService();

      const plans = await service.listPlans({ includeInternal: true });

      for (let i = 1; i < plans.length; i++) {
        assert.ok(
          plans[i].sortOrder >= plans[i - 1].sortOrder,
          `Plan ${plans[i].slug} (order ${plans[i].sortOrder}) should be >= ${plans[i - 1].slug} (order ${plans[i - 1].sortOrder})`,
        );
      }
    });
  });

  describe("plan limits validation", () => {
    it("provides correct default limits for free plan", async () => {
      const { service } = createPlansService();

      const plan = await service.getPlanBySlug("free");

      assert.equal(plan.limits.maxMembers, 5);
      assert.equal(plan.limits.maxCargos, 50);
      assert.equal(plan.limits.maxTrackingEvents, 1000);
      assert.equal(plan.limits.maxApiCalls, 1000);
      assert.equal(plan.limits.maxTeams, 0);
      assert.equal(plan.limits.hasSso, false);
      assert.equal(plan.limits.hasApi, false);
      assert.equal(plan.limits.hasWebhooks, false);
      assert.equal(plan.limits.hasReports, true);
      assert.equal(plan.limits.hasAuditLog, false);
    });

    it("provides pro plan with higher limits", async () => {
      const { service } = createPlansService();

      const plan = await service.getPlanBySlug("pro");

      assert.equal(plan.limits.maxMembers, 25);
      assert.equal(plan.limits.maxCargos, 1000);
      assert.equal(plan.limits.maxTrackingEvents, 50000);
      assert.ok(plan.limits.maxTeams > 0);
    });

    it("enterprise plan has all features enabled", async () => {
      const { service } = createPlansService();

      const plan = await service.getPlanBySlug("enterprise");

      assert.equal(plan.limits.hasSso, true);
      assert.equal(plan.limits.hasApi, true);
      assert.equal(plan.limits.hasWebhooks, true);
      assert.equal(plan.limits.hasAuditLog, true);
    });
  });
});

// ──────────────────────────────────────────────
// Work Stream B: BillingService Integration Test
// ──────────────────────────────────────────────

describe("BillingService", () => {
  describe("getUsage", () => {
    it("returns usage with correct displayLabel and unit for all metrics", async () => {
      const { service } = createBillingService();

      const usage = await service.getUsage("org_port_rail");

      assert.equal(usage.metrics.length, 3);

      const membersMetric = usage.metrics.find((m) => m.metric === "members");
      assert.ok(membersMetric);
      assert.equal(membersMetric.displayLabel, "Membros");
      assert.equal(membersMetric.unit, "/mês");

      const cargoMetric = usage.metrics.find((m) => m.metric === "cargo_shipments");
      assert.ok(cargoMetric);
      assert.equal(cargoMetric.displayLabel, "Cargas");
      assert.equal(cargoMetric.unit, "/mês");

      const trackingMetric = usage.metrics.find((m) => m.metric === "tracking_events");
      assert.ok(trackingMetric);
      assert.equal(trackingMetric.displayLabel, "Eventos de tracking");
      assert.equal(trackingMetric.unit, "/mês");
    });

    it("returns zero values when no usage records exist", async () => {
      const { service, repository } = createBillingService();
      repository.findUsageRecords = async () => [];

      const usage = await service.getUsage("org_empty");

      assert.equal(usage.metrics.length, 3);
      for (const metric of usage.metrics) {
        assert.equal(metric.current, 0);
        assert.equal(metric.limit, 0);
        assert.equal(metric.remaining, 0);
      }
    });

    it("returns correct remaining calculation", async () => {
      const { service } = createBillingService();

      const usage = await service.getUsage("org_port_rail");

      const membersMetric = usage.metrics.find((m) => m.metric === "members");
      assert.ok(membersMetric);
      assert.equal(membersMetric.remaining, membersMetric.limit - membersMetric.current);
    });
  });

  describe("getSubscription", () => {
    it("returns subscription for existing organization", async () => {
      const { service } = createBillingService();

      const subscription = await service.getSubscription("org_port_rail");

      assert.equal(subscription.plan, "pro");
      assert.equal(subscription.status, "active");
      assert.ok(subscription.createdAt);
      assert.ok(subscription.updatedAt);
    });

    it("throws NotFoundException for non-existent organization", async () => {
      const { service, repository } = createBillingService();
      repository.findSubscription = async () => null;

      await assertRejectsWithMessage(
        () => service.getSubscription("org_nonexistent"),
        "assinatura.nao_encontrada",
      );
    });
  });

  describe("getInvoicesList", () => {
    it("returns paginated invoices", async () => {
      const { service } = createBillingService();

      const result = await service.getInvoicesList("org_port_rail", 10, 0);

      assert.ok(Array.isArray(result.invoices));
      assert.equal(result.pagination.limit, 10);
      assert.equal(result.pagination.offset, 0);
      assert.ok(result.pagination.totalCount >= 0);
    });

    it("returns empty list for organization with no invoices", async () => {
      const { service, repository } = createBillingService();
      repository.findInvoices = async () => [];
      repository.countInvoices = async () => 0;

      const result = await service.getInvoicesList("org_no_invoices", 10, 0);

      assert.equal(result.invoices.length, 0);
      assert.equal(result.pagination.totalCount, 0);
    });
  });
});

// ──────────────────────────────────────────────
// Factory helpers
// ──────────────────────────────────────────────

function createPlansService() {
  const repository = createMockPlansRepository();
  const service = Object.create(PlansService.prototype);
  service.plansRepo = repository;

  return { service, repository };
}

function createMockPlansRepository() {
  const plans = [
    {
      id: "plan_free",
      slug: "free",
      name: "Free",
      description: "Para pequenas equipas",
      price: 0,
      currency: "EUR",
      interval: "month",
      features: [
        { key: "max_members", label: "Membros", included: true, limit: "5" },
        { key: "reports", label: "Relatorios", included: true },
        { key: "api_access", label: "API", included: false },
        { key: "sso", label: "SSO", included: false },
      ],
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
      active: true,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-06-01"),
      deletedAt: null,
      deletedBy: null,
    },
    {
      id: "plan_pro",
      slug: "pro",
      name: "Pro",
      description: "Para operacoes em crescimento",
      price: 9900,
      currency: "EUR",
      interval: "month",
      features: [
        { key: "max_members", label: "Membros", included: true, limit: "25" },
        { key: "reports", label: "Relatorios", included: true },
        { key: "api_access", label: "API", included: true },
        { key: "webhooks", label: "Webhooks", included: true },
        { key: "audit_log", label: "Auditoria", included: true },
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
      active: true,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-06-01"),
      deletedAt: null,
      deletedBy: null,
    },
    {
      id: "plan_enterprise",
      slug: "enterprise",
      name: "Enterprise",
      description: "Para grandes operadores logisticos",
      price: 0,
      currency: "EUR",
      interval: "month",
      features: [
        { key: "max_members", label: "Membros", included: true, limit: "Ilimitado" },
        { key: "sso", label: "SSO", included: true },
      ],
      limits: {
        maxMembers: 999999,
        maxCargos: 999999,
        maxTrackingEvents: 999999,
        maxApiCalls: 999999,
        maxTeams: 999,
        hasSso: true,
        hasApi: true,
        hasWebhooks: true,
        hasReports: true,
        hasAuditLog: true,
      },
      isPublic: false,
      sortOrder: 3,
      active: true,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-06-01"),
      deletedAt: null,
      deletedBy: null,
    },
  ];

  return {
    async findAll() {
      return plans;
    },
    async findBySlug(slug) {
      return plans.find((p) => p.slug === slug) ?? null;
    },
    async findActivePublicPlans() {
      return plans.filter((p) => p.isPublic && p.active);
    },
  };
}

function createBillingService() {
  const repository = createMockBillingRepository();
  const service = Object.create(BillingService.prototype);
  service.billingRepo = repository;
  service.metricDisplayLabels = {
    members: { displayLabel: "Membros", unit: "/mês" },
    cargo_shipments: { displayLabel: "Cargas", unit: "/mês" },
    tracking_events: { displayLabel: "Eventos de tracking", unit: "/mês" },
  };
  // Prevent Stripe initialization in unit tests
  service.stripe = null;
  // Override getStripe to throw if called (we mock all methods that use it)
  service.getStripe = () => {
    throw new Error("Stripe should not be called in unit tests");
  };

  return { service, repository };
}

function createMockBillingRepository() {
  const fixedNow = new Date("2026-06-23T00:00:00.000Z");

  return {
    async findOrganizationWithDetails(organizationId) {
      if (organizationId === "org_port_rail") {
        return {
          id: organizationId,
          name: "Porto Rail Logistics",
          subscription: { stripeCustomerId: "cus_001" },
          memberships: [{ user: { email: "admin@portorail.pt" } }],
        };
      }
      return null;
    },

    async findSubscription(organizationId) {
      if (organizationId === "org_port_rail") {
        return {
          id: "sub_001",
          organizationId,
          stripeCustomerId: "cus_001",
          stripeSubscriptionId: "sub_stripe_001",
          plan: "pro",
          status: "active",
          currentPeriodStart: new Date("2026-06-01"),
          currentPeriodEnd: new Date("2026-07-01"),
          cancelAtPeriodEnd: false,
          trialEndsAt: null,
          createdAt: fixedNow,
          updatedAt: fixedNow,
        };
      }
      return null;
    },

    async findSubscriptionByStripeId() {
      return null;
    },

    async upsertSubscription() {},

    async updateSubscriptionStatus() {},

    async findInvoices() {
      return [];
    },

    async countInvoices() {
      return 0;
    },

    async createInvoice() {},

    async findUsageRecords(organizationId) {
      if (organizationId === "org_port_rail") {
        return [
          {
            id: "ur_001",
            organizationId,
            metric: "members",
            current: 5,
            limit: 25,
            periodStart: new Date("2026-06-01"),
            periodEnd: new Date("2026-07-01"),
            createdAt: fixedNow,
            updatedAt: fixedNow,
          },
          {
            id: "ur_002",
            organizationId,
            metric: "cargo_shipments",
            current: 100,
            limit: 1000,
            periodStart: new Date("2026-06-01"),
            periodEnd: new Date("2026-07-01"),
            createdAt: fixedNow,
            updatedAt: fixedNow,
          },
          {
            id: "ur_003",
            organizationId,
            metric: "tracking_events",
            current: 50,
            limit: 500,
            periodStart: new Date("2026-06-01"),
            periodEnd: new Date("2026-07-01"),
            createdAt: fixedNow,
            updatedAt: fixedNow,
          },
        ];
      }
      return [];
    },

    async findUsageRecord() {
      return null;
    },

    async createUsageRecord() {},

    async incrementUsageRecord() {},

    async resetExpiredUsageRecords() {},

    async upsertUsageRecord() {},
  };
}
