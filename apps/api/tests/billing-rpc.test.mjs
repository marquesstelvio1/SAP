import assert from "node:assert/strict";
import { test } from "node:test";

import { ForbiddenException } from "@nestjs/common";
import { createRouterClient } from "@orpc/server";

import { createBillingRpcRouter } from "../dist/billing/billing-rpc.router.js";

test("billing overview RPC authorizes request and returns subscription overview", async () => {
  const calls = [];
  const router = createBillingRpcRouter({
    rpcContextService: {
      async authorizeRequest(request, metadata) {
        calls.push({ request, metadata });

        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_admin",
            userId: "user_admin",
            organizationId: "org_port_rail",
            permissions: ["tenant.manage"],
            correlationId: "corr_billing_overview",
            traceContext: {
              correlationId: "corr_billing_overview",
              requestId: "req_billing_overview",
              operationName: "billing.overview",
              sourceSystem: "tests",
            },
          },
        };
      },
    },
    billingService: {
      async getOverview(organizationId) {
        return {
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
        };
      },
      async createCheckoutSession() {
        throw new Error("createCheckoutSession should not be called by overview test");
      },
      async createPortalSession() {
        throw new Error("createPortalSession should not be called by overview test");
      },
    },
  });
  const client = createRouterClient(router, {
    context: {
      request: {
        headers: {
          "x-correlation-id": "corr_billing_overview",
        },
      },
    },
  });

  const overview = await client.billing.overview(undefined);

  assert.equal(overview.plan, "pro");
  assert.equal(overview.status, "active");
  assert.equal(overview.memberUsage, 5);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].metadata.name, "billing.overview");
});

test("billing plans RPC returns plan catalog without org requirement", async () => {
  const router = createBillingRpcRouter({
    rpcContextService: {
      async authorizeRequest(_request, metadata) {
        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_admin",
            userId: "user_admin",
            organizationId: "org_port_rail",
            permissions: ["tenant.manage"],
            correlationId: "corr_billing_plans",
          },
        };
      },
    },
    billingService: {
      async getOverview() {
        throw new Error("getOverview should not be called by plans test");
      },
      async createCheckoutSession() {
        throw new Error("createCheckoutSession should not be called by plans test");
      },
      async createPortalSession() {
        throw new Error("createPortalSession should not be called by plans test");
      },
    },
  });
  const client = createRouterClient(router);

  const plans = await client.billing.plans(undefined);

  assert.ok(plans.plans.length >= 3);
  assert.equal(plans.plans[0].id, "free");
  assert.equal(plans.plans[1].id, "pro");
  assert.equal(plans.plans[2].id, "enterprise");
});

test("billing create checkout session RPC authorizes mutation and returns Stripe URL", async () => {
  const calls = [];
  const router = createBillingRpcRouter({
    rpcContextService: {
      async authorizeRequest(_request, metadata) {
        calls.push({ metadata });

        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_admin",
            userId: "user_admin",
            organizationId: "org_port_rail",
            permissions: ["tenant.manage"],
            correlationId: "corr_billing_checkout",
            traceContext: {
              correlationId: "corr_billing_checkout",
              requestId: "req_billing_checkout",
              operationName: "billing.checkout",
              sourceSystem: "tests",
            },
          },
        };
      },
    },
    billingService: {
      async getOverview() {
        throw new Error("getOverview should not be called by checkout test");
      },
      async createCheckoutSession(organizationId, plan, successUrl, cancelUrl) {
        return {
          url: "https://checkout.stripe.com/cs_test_001",
        };
      },
      async createPortalSession() {
        throw new Error("createPortalSession should not be called by checkout test");
      },
    },
  });
  const client = createRouterClient(router, {
    context: {
      request: {
        headers: {
          "x-forwarded-for": "127.0.0.1",
        },
      },
    },
  });

  const result = await client.billing.createCheckoutSession({
    organizationId: "org_port_rail",
    plan: "enterprise",
    successUrl: "https://app.saptm.local/billing/success",
    cancelUrl: "https://app.saptm.local/billing/cancel",
    idempotencyKey: "billing_checkout_001",
  });

  assert.ok(result.url.startsWith("https://"));
  assert.equal(result.audit.action, "billing.checkout_session_created");
  assert.equal(calls.length, 1);
});

test("billing portal session RPC authorizes mutation and returns portal URL", async () => {
  const router = createBillingRpcRouter({
    rpcContextService: {
      async authorizeRequest(_request, metadata) {
        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_admin",
            userId: "user_admin",
            organizationId: "org_port_rail",
            permissions: ["tenant.manage"],
            correlationId: "corr_billing_portal",
          },
        };
      },
    },
    billingService: {
      async getOverview() {
        throw new Error("getOverview should not be called by portal test");
      },
      async createCheckoutSession() {
        throw new Error("createCheckoutSession should not be called by portal test");
      },
      async createPortalSession(organizationId) {
        return {
          url: "https://stripe.com/billing/portal_001",
        };
      },
    },
  });
  const client = createRouterClient(router, {
    context: {
      request: {
        headers: {},
      },
    },
  });

  const result = await client.billing.createPortalSession({
    returnUrl: "https://app.saptm.local/settings/billing",
    idempotencyKey: "billing_portal_001",
  });

  assert.ok(result.url.startsWith("https://"));
  assert.equal(result.audit.action, "billing.portal_session_created");
});

test("billing RPC denies request without organization", async () => {
  const router = createBillingRpcRouter({
    rpcContextService: {
      async authorizeRequest(_request, metadata) {
        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_no_org",
            userId: "user_no_org",
            permissions: [],
            correlationId: "corr_no_org",
          },
        };
      },
    },
    billingService: {
      async getOverview() {
        throw new Error("getOverview should not be called by no-org test");
      },
      async createCheckoutSession() {
        throw new Error("createCheckoutSession should not be called by no-org test");
      },
      async createPortalSession() {
        throw new Error("createPortalSession should not be called by no-org test");
      },
    },
  });
  const client = createRouterClient(router, {
    context: {
      request: {
        headers: {},
      },
    },
  });

  await assert.rejects(() => client.billing.overview(undefined), ForbiddenException);
});
