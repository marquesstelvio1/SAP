import type { IncomingMessage } from "node:http";
import { os } from "@orpc/server";
import {
  billingCreateCheckoutSessionMetadata,
  billingCreatePortalSessionMetadata,
  billingInvoicesListInputSchema,
  billingInvoicesListMetadata,
  billingInvoicesListOutputSchema,
  billingOverviewMetadata,
  billingOverviewOutputSchema,
  billingPlansMetadata,
  billingPlansOutputSchema,
  billingSubscriptionGetMetadata,
  billingSubscriptionGetOutputSchema,
  billingSubscriptionUsageMetadata,
  createCheckoutSessionInputSchema,
  createCheckoutSessionOutputSchema,
  createPortalSessionInputSchema,
  createPortalSessionOutputSchema,
  usageSchema,
} from "@saptm/rpc";

import type { AuthEnrichedContext, RpcAuthMiddleware } from "../rpc/rpc-auth.middleware.js";
import type { BillingService } from "./billing.service.js";

export type BillingRpcContext = {
  request: IncomingMessage;
} & AuthEnrichedContext;

export type CreateBillingRpcRouterInput = {
  billingService: Pick<
    BillingService,
    | "getOverview"
    | "createCheckoutSession"
    | "createPortalSession"
    | "getSubscriptionDetail"
    | "getUsageDetail"
    | "getInvoicesList"
  >;
  authMiddleware: RpcAuthMiddleware;
};

export function createBillingRpcRouter(deps: CreateBillingRpcRouterInput) {
  const billingRpc = os.$context<BillingRpcContext>().use(deps.authMiddleware);

  return billingRpc.router({
    billing: {
      overview: billingRpc
        .meta(billingOverviewMetadata)
        .route({ method: "GET", path: "/billing/overview" })
        .output(billingOverviewOutputSchema)
        .handler(async ({ context }) => {
          const overview = await deps.billingService.getOverview(context.organizationId);

          return {
            plan: overview.plan as "free" | "pro" | "enterprise",
            status: overview.status as "active" | "past_due" | "canceled" | "unpaid" | "trialing",
            currentPeriodStart: overview.currentPeriodStart ?? null,
            currentPeriodEnd: overview.currentPeriodEnd ?? null,
            cancelAtPeriodEnd: overview.cancelAtPeriodEnd,
            trialEndsAt: overview.trialEndsAt ?? null,
            memberUsage: overview.memberUsage,
            memberLimit: overview.memberLimit,
            cargoUsage: overview.cargoUsage,
            cargoLimit: overview.cargoLimit,
            trackingUsage: overview.trackingUsage,
            trackingLimit: overview.trackingLimit,
          };
        }),
      plans: billingRpc
        .meta(billingPlansMetadata)
        .route({ method: "GET", path: "/billing/plans" })
        .output(billingPlansOutputSchema)
        .handler(async () => {
          return {
            plans: [
              {
                id: "free" as const,
                name: "Free",
                description: "Para testar a plataforma",
                price: 0,
                features: ["10 cargas/mes", "1 utilizador", "Tracking basico", "Suporte por email"],
              },
              {
                id: "pro" as const,
                name: "Pro",
                description: "Para operacoes profissionais",
                price: 9900,
                features: [
                  "Cargas ilimitadas",
                  "Ate 25 utilizadores",
                  "Tracking avancado",
                  "API keys",
                  "Relatorios exportaveis",
                  "Suporte prioritario",
                ],
              },
              {
                id: "enterprise" as const,
                name: "Enterprise",
                description: "Para grandes operadores logisticos",
                price: 0,
                features: [
                  "Tudo do Pro",
                  "Utilizadores ilimitados",
                  "Gerente de conta dedicado",
                  "SLA garantido",
                  "On-premise",
                  "Integracoes personalizadas",
                ],
              },
            ],
          };
        }),
      createCheckoutSession: billingRpc
        .meta(billingCreateCheckoutSessionMetadata)
        .route({ method: "POST", path: "/billing/createCheckoutSession" })
        .input(createCheckoutSessionInputSchema)
        .output(createCheckoutSessionOutputSchema)
        .handler(async ({ context, input }) => {
          const result = await deps.billingService.createCheckoutSession(
            context.organizationId,
            input.plan,
            input.successUrl,
            input.cancelUrl,
          );

          return {
            url: result.url,
            idempotency: { key: input.idempotencyKey, replayed: false },
            audit: {
              action: "billing.checkout_session_created",
              subjectType: "organization",
              subjectId: context.organizationId,
            },
            outbox: {
              eventType: "billing.checkout_session_created",
              aggregateType: "billing",
              aggregateId: context.organizationId,
            },
          };
        }),
      createPortalSession: billingRpc
        .meta(billingCreatePortalSessionMetadata)
        .route({ method: "POST", path: "/billing/createPortalSession" })
        .input(createPortalSessionInputSchema)
        .output(createPortalSessionOutputSchema)
        .handler(async ({ context, input }) => {
          const result = await deps.billingService.createPortalSession(context.organizationId);

          return {
            url: result.url,
            idempotency: { key: input.idempotencyKey, replayed: false },
            audit: {
              action: "billing.portal_session_created",
              subjectType: "organization",
              subjectId: context.organizationId,
            },
            outbox: {
              eventType: "billing.portal_session_created",
              aggregateType: "billing",
              aggregateId: context.organizationId,
            },
          };
        }),
      subscription: {
        get: billingRpc
          .meta(billingSubscriptionGetMetadata)
          .route({ method: "GET", path: "/billing/subscription/get" })
          .output(billingSubscriptionGetOutputSchema)
          .handler(async ({ context }) => {
            return deps.billingService.getSubscriptionDetail(context.organizationId);
          }),
        usage: billingRpc
          .meta(billingSubscriptionUsageMetadata)
          .route({ method: "GET", path: "/billing/subscription/usage" })
          .output(usageSchema)
          .handler(async ({ context }) => {
            return deps.billingService.getUsageDetail(context.organizationId);
          }),
      },
      invoices: {
        list: billingRpc
          .meta(billingInvoicesListMetadata)
          .route({ method: "GET", path: "/billing/invoices/list" })
          .input(billingInvoicesListInputSchema)
          .output(billingInvoicesListOutputSchema)
          .handler(async ({ context, input }) => {
            return deps.billingService.getInvoicesList(
              context.organizationId,
              input.limit,
              input.offset,
            );
          }),
      },
    },
  });
}

export type BillingRpcRouter = ReturnType<typeof createBillingRpcRouter>;
