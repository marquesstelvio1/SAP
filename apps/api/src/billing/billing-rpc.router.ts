import type { IncomingMessage } from "node:http";
import { ForbiddenException } from "@nestjs/common";
import { os } from "@orpc/server";
import {
  billingCreateCheckoutSessionMetadata,
  billingCreatePortalSessionMetadata,
  billingOverviewMetadata,
  billingOverviewOutputSchema,
  billingPlansMetadata,
  billingPlansOutputSchema,
  createCheckoutSessionInputSchema,
  createCheckoutSessionOutputSchema,
  createPortalSessionInputSchema,
  createPortalSessionOutputSchema,
} from "@saptm/rpc";

import type { RpcRequestWithAuthContext } from "../rpc/rpc-context.js";
import type { RpcContextService } from "../rpc/rpc-context.service.js";
import type { BillingService } from "./billing.service.js";

export type BillingRpcContext = {
  request: IncomingMessage & RpcRequestWithAuthContext;
};

export type CreateBillingRpcRouterInput = {
  billingService: Pick<
    BillingService,
    "getOverview" | "createCheckoutSession" | "createPortalSession"
  >;
  rpcContextService: Pick<RpcContextService, "authorizeRequest">;
};

const billingRpc = os.$context<BillingRpcContext>();

export function createBillingRpcRouter(deps: CreateBillingRpcRouterInput) {
  return billingRpc.router({
    billing: {
      overview: billingRpc
        .meta(billingOverviewMetadata)
        .route({ method: "GET", path: "/billing/overview" })
        .output(billingOverviewOutputSchema)
        .handler(async ({ context }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            billingOverviewMetadata,
          );
          const organizationId = authorizedContext.authContext?.organizationId;

          if (organizationId === undefined) {
            throw new ForbiddenException("billing.organization_required");
          }

          const overview = await deps.billingService.getOverview(organizationId);

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
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            billingCreateCheckoutSessionMetadata,
          );
          const organizationId = authorizedContext.authContext?.organizationId;

          if (organizationId === undefined) {
            throw new ForbiddenException("billing.organization_required");
          }

          return deps.billingService.createCheckoutSession(
            organizationId,
            input.plan,
            input.successUrl,
            input.cancelUrl,
          );
        }),
      createPortalSession: billingRpc
        .meta(billingCreatePortalSessionMetadata)
        .route({ method: "POST", path: "/billing/createPortalSession" })
        .input(createPortalSessionInputSchema)
        .output(createPortalSessionOutputSchema)
        .handler(async ({ context }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            billingCreatePortalSessionMetadata,
          );
          const organizationId = authorizedContext.authContext?.organizationId;

          if (organizationId === undefined) {
            throw new ForbiddenException("billing.organization_required");
          }

          const result = await deps.billingService.createPortalSession(organizationId);

          return { url: result.url };
        }),
    },
  });
}

export type BillingRpcRouter = ReturnType<typeof createBillingRpcRouter>;
