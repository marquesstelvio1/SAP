import type { IncomingMessage } from "node:http";
import { os } from "@orpc/server";
import {
  tariffOverviewInputSchema,
  tariffOverviewMetadata,
  tariffOverviewOutputSchema,
  tariffQuoteApproveInputSchema,
  tariffQuoteApproveMetadata,
  tariffQuoteApproveOutputSchema,
  tariffQuoteCalculateInputSchema,
  tariffQuoteCalculateMetadata,
  tariffQuoteCalculateOutputSchema,
  tariffRateCardRegisterInputSchema,
  tariffRateCardRegisterMetadata,
  tariffRateCardRegisterOutputSchema,
  tariffRateRuleAddInputSchema,
  tariffRateRuleAddMetadata,
  tariffRateRuleAddOutputSchema,
} from "@saptm/rpc";

import type { AuthEnrichedContext, RpcAuthMiddleware } from "../rpc/rpc-auth.middleware.js";
import type { TariffService } from "./tariff.service.js";

export type TariffRpcContext = {
  request: IncomingMessage;
} & AuthEnrichedContext;

export type CreateTariffRpcRouterInput = {
  tariffService: Pick<
    TariffService,
    "addRateRule" | "approveQuote" | "calculateQuote" | "getOverview" | "registerRateCard"
  >;
  authMiddleware: RpcAuthMiddleware;
};

export function createTariffRpcRouter(deps: CreateTariffRpcRouterInput) {
  const tariffRpc = os.$context<TariffRpcContext>().use(deps.authMiddleware);

  return tariffRpc.router({
    tariff: {
      overview: tariffRpc
        .meta(tariffOverviewMetadata)
        .route({ method: "GET", path: "/tariff/overview" })
        .input(tariffOverviewInputSchema)
        .output(tariffOverviewOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.tariffService.getOverview({
            organizationId: context.organizationId,
            limit: input.limit,
          });
        }),
      registerRateCard: tariffRpc
        .meta(tariffRateCardRegisterMetadata)
        .route({ method: "POST", path: "/tariff/registerRateCard" })
        .input(tariffRateCardRegisterInputSchema)
        .output(tariffRateCardRegisterOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.tariffService.registerRateCard({
            ...input,
            organizationId: context.organizationId,
            actorId: context.actorId,
            actorType: context.actorType,
            correlationId: context.correlationId,
            ...(context.userAgent === undefined ? {} : { userAgent: context.userAgent }),
            ...(context.ipAddress === undefined ? {} : { ipAddress: context.ipAddress }),
          });
        }),
      addRateRule: tariffRpc
        .meta(tariffRateRuleAddMetadata)
        .route({ method: "POST", path: "/tariff/addRateRule" })
        .input(tariffRateRuleAddInputSchema)
        .output(tariffRateRuleAddOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.tariffService.addRateRule({
            ...input,
            organizationId: context.organizationId,
            actorId: context.actorId,
            actorType: context.actorType,
            correlationId: context.correlationId,
            ...(context.userAgent === undefined ? {} : { userAgent: context.userAgent }),
            ...(context.ipAddress === undefined ? {} : { ipAddress: context.ipAddress }),
          });
        }),
      calculateQuote: tariffRpc
        .meta(tariffQuoteCalculateMetadata)
        .route({ method: "POST", path: "/tariff/calculateQuote" })
        .input(tariffQuoteCalculateInputSchema)
        .output(tariffQuoteCalculateOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.tariffService.calculateQuote({
            ...input,
            organizationId: context.organizationId,
            actorId: context.actorId,
            actorType: context.actorType,
            correlationId: context.correlationId,
            ...(context.userAgent === undefined ? {} : { userAgent: context.userAgent }),
            ...(context.ipAddress === undefined ? {} : { ipAddress: context.ipAddress }),
          });
        }),
      approveQuote: tariffRpc
        .meta(tariffQuoteApproveMetadata)
        .route({ method: "POST", path: "/tariff/approveQuote" })
        .input(tariffQuoteApproveInputSchema)
        .output(tariffQuoteApproveOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.tariffService.approveQuote({
            ...input,
            organizationId: context.organizationId,
            actorId: context.actorId,
            actorType: context.actorType,
            correlationId: context.correlationId,
            ...(context.userAgent === undefined ? {} : { userAgent: context.userAgent }),
            ...(context.ipAddress === undefined ? {} : { ipAddress: context.ipAddress }),
          });
        }),
    },
  });
}

export type TariffRpcRouter = ReturnType<typeof createTariffRpcRouter>;
