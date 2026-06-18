import type { IncomingMessage } from "node:http";
import { ForbiddenException } from "@nestjs/common";
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

import type { RpcRequestWithAuthContext } from "../rpc/rpc-context.js";
import type { RpcContextService } from "../rpc/rpc-context.service.js";
import type { TariffService } from "./tariff.service.js";

export type TariffRpcContext = {
  request: IncomingMessage & RpcRequestWithAuthContext;
};

export type CreateTariffRpcRouterInput = {
  tariffService: Pick<
    TariffService,
    "addRateRule" | "approveQuote" | "calculateQuote" | "getOverview" | "registerRateCard"
  >;
  rpcContextService: Pick<RpcContextService, "authorizeRequest">;
};

const tariffRpc = os.$context<TariffRpcContext>();

export function createTariffRpcRouter(deps: CreateTariffRpcRouterInput) {
  return tariffRpc.router({
    tariff: {
      overview: tariffRpc
        .meta(tariffOverviewMetadata)
        .route({ method: "GET", path: "/tariff/overview" })
        .input(tariffOverviewInputSchema)
        .output(tariffOverviewOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            tariffOverviewMetadata,
          );
          const organizationId = authorizedContext.authContext?.organizationId;

          if (organizationId === undefined) {
            throw new ForbiddenException("tariff.organization_required");
          }

          return deps.tariffService.getOverview({
            organizationId,
            limit: input.limit,
          });
        }),
      registerRateCard: tariffRpc
        .meta(tariffRateCardRegisterMetadata)
        .route({ method: "POST", path: "/tariff/registerRateCard" })
        .input(tariffRateCardRegisterInputSchema)
        .output(tariffRateCardRegisterOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            tariffRateCardRegisterMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("tariff.organization_required");
          }

          return deps.tariffService.registerRateCard({
            ...input,
            organizationId,
            actorId: authContext.actorId,
            actorType: authContext.actorType,
            correlationId: authContext.correlationId,
            ...readRequestTelemetry(context.request),
          });
        }),
      addRateRule: tariffRpc
        .meta(tariffRateRuleAddMetadata)
        .route({ method: "POST", path: "/tariff/addRateRule" })
        .input(tariffRateRuleAddInputSchema)
        .output(tariffRateRuleAddOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            tariffRateRuleAddMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("tariff.organization_required");
          }

          return deps.tariffService.addRateRule({
            ...input,
            organizationId,
            actorId: authContext.actorId,
            actorType: authContext.actorType,
            correlationId: authContext.correlationId,
            ...readRequestTelemetry(context.request),
          });
        }),
      calculateQuote: tariffRpc
        .meta(tariffQuoteCalculateMetadata)
        .route({ method: "POST", path: "/tariff/calculateQuote" })
        .input(tariffQuoteCalculateInputSchema)
        .output(tariffQuoteCalculateOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            tariffQuoteCalculateMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("tariff.organization_required");
          }

          return deps.tariffService.calculateQuote({
            ...input,
            organizationId,
            actorId: authContext.actorId,
            actorType: authContext.actorType,
            correlationId: authContext.correlationId,
            ...readRequestTelemetry(context.request),
          });
        }),
      approveQuote: tariffRpc
        .meta(tariffQuoteApproveMetadata)
        .route({ method: "POST", path: "/tariff/approveQuote" })
        .input(tariffQuoteApproveInputSchema)
        .output(tariffQuoteApproveOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            tariffQuoteApproveMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("tariff.organization_required");
          }

          return deps.tariffService.approveQuote({
            ...input,
            organizationId,
            actorId: authContext.actorId,
            actorType: authContext.actorType,
            correlationId: authContext.correlationId,
            ...readRequestTelemetry(context.request),
          });
        }),
    },
  });
}

export type TariffRpcRouter = ReturnType<typeof createTariffRpcRouter>;

function readRequestTelemetry(request: IncomingMessage & RpcRequestWithAuthContext): {
  ipAddress?: string;
  userAgent?: string;
} {
  const userAgent = readRequestHeader(request, "user-agent");
  const ipAddress = readRequestHeader(request, "x-forwarded-for")?.split(",").at(0)?.trim();

  return {
    ...(userAgent === undefined ? {} : { userAgent }),
    ...(ipAddress === undefined ? {} : { ipAddress }),
  };
}

function readRequestHeader(
  request: IncomingMessage & RpcRequestWithAuthContext,
  name: string,
): string | undefined {
  const value = request.headers[name] ?? request.headers[name.toLowerCase()];

  if (Array.isArray(value)) {
    return value.at(0);
  }

  return value;
}
