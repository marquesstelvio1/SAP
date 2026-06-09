import type { IncomingMessage } from "node:http";
import { ForbiddenException } from "@nestjs/common";
import { os } from "@orpc/server";
import {
  planningOverviewInputSchema,
  planningOverviewMetadata,
  planningOverviewOutputSchema,
  transportOrderCancelInputSchema,
  transportOrderCancelMetadata,
  transportOrderCancelOutputSchema,
  transportOrderConfirmInputSchema,
  transportOrderConfirmMetadata,
  transportOrderConfirmOutputSchema,
  transportOrderDispatchInputSchema,
  transportOrderDispatchMetadata,
  transportOrderDispatchOutputSchema,
  transportOrderRescheduleInputSchema,
  transportOrderRescheduleMetadata,
  transportOrderRescheduleOutputSchema,
} from "@saptm/rpc";

import type { RpcRequestWithAuthContext } from "../rpc/rpc-context.js";
import type { RpcContextService } from "../rpc/rpc-context.service.js";
import type { PlanningService } from "./planning.service.js";

export type PlanningRpcContext = {
  request: IncomingMessage & RpcRequestWithAuthContext;
};

export type CreatePlanningRpcRouterInput = {
  planningService: Pick<
    PlanningService,
    | "cancelTransportOrder"
    | "confirmTransportOrder"
    | "dispatchTransportOrder"
    | "getOverview"
    | "rescheduleTransportOrder"
  >;
  rpcContextService: Pick<RpcContextService, "authorizeRequest">;
};

const planningRpc = os.$context<PlanningRpcContext>();

export function createPlanningRpcRouter(deps: CreatePlanningRpcRouterInput) {
  return planningRpc.router({
    planning: {
      overview: planningRpc
        .meta(planningOverviewMetadata)
        .route({ method: "GET", path: "/planning/overview" })
        .input(planningOverviewInputSchema)
        .output(planningOverviewOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            planningOverviewMetadata,
          );
          const organizationId = authorizedContext.authContext?.organizationId;

          if (organizationId === undefined) {
            throw new ForbiddenException("planning.organization_required");
          }

          return deps.planningService.getOverview({
            organizationId,
            limit: input.limit,
          });
        }),
      confirmTransportOrder: planningRpc
        .meta(transportOrderConfirmMetadata)
        .route({ method: "POST", path: "/planning/confirmTransportOrder" })
        .input(transportOrderConfirmInputSchema)
        .output(transportOrderConfirmOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            transportOrderConfirmMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("planning.organization_required");
          }

          const userAgent = readRequestHeader(context.request, "user-agent");
          const ipAddress = readRequestIp(context.request);

          return deps.planningService.confirmTransportOrder({
            ...input,
            organizationId,
            actorId: authContext.actorId,
            actorType: authContext.actorType,
            correlationId: authContext.correlationId,
            ...(userAgent === undefined ? {} : { userAgent }),
            ...(ipAddress === undefined ? {} : { ipAddress }),
          });
        }),
      cancelTransportOrder: planningRpc
        .meta(transportOrderCancelMetadata)
        .route({ method: "POST", path: "/planning/cancelTransportOrder" })
        .input(transportOrderCancelInputSchema)
        .output(transportOrderCancelOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            transportOrderCancelMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("planning.organization_required");
          }

          const userAgent = readRequestHeader(context.request, "user-agent");
          const ipAddress = readRequestIp(context.request);

          return deps.planningService.cancelTransportOrder({
            ...input,
            organizationId,
            actorId: authContext.actorId,
            actorType: authContext.actorType,
            correlationId: authContext.correlationId,
            ...(userAgent === undefined ? {} : { userAgent }),
            ...(ipAddress === undefined ? {} : { ipAddress }),
          });
        }),
      rescheduleTransportOrder: planningRpc
        .meta(transportOrderRescheduleMetadata)
        .route({ method: "POST", path: "/planning/rescheduleTransportOrder" })
        .input(transportOrderRescheduleInputSchema)
        .output(transportOrderRescheduleOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            transportOrderRescheduleMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("planning.organization_required");
          }

          const userAgent = readRequestHeader(context.request, "user-agent");
          const ipAddress = readRequestIp(context.request);

          return deps.planningService.rescheduleTransportOrder({
            ...input,
            organizationId,
            actorId: authContext.actorId,
            actorType: authContext.actorType,
            correlationId: authContext.correlationId,
            ...(userAgent === undefined ? {} : { userAgent }),
            ...(ipAddress === undefined ? {} : { ipAddress }),
          });
        }),
      dispatchTransportOrder: planningRpc
        .meta(transportOrderDispatchMetadata)
        .route({ method: "POST", path: "/planning/dispatchTransportOrder" })
        .input(transportOrderDispatchInputSchema)
        .output(transportOrderDispatchOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            transportOrderDispatchMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("planning.organization_required");
          }

          const userAgent = readRequestHeader(context.request, "user-agent");
          const ipAddress = readRequestIp(context.request);

          return deps.planningService.dispatchTransportOrder({
            ...input,
            organizationId,
            actorId: authContext.actorId,
            actorType: authContext.actorType,
            correlationId: authContext.correlationId,
            ...(userAgent === undefined ? {} : { userAgent }),
            ...(ipAddress === undefined ? {} : { ipAddress }),
          });
        }),
    },
  });
}

export type PlanningRpcRouter = ReturnType<typeof createPlanningRpcRouter>;

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

function readRequestIp(request: IncomingMessage & RpcRequestWithAuthContext): string | undefined {
  return readRequestHeader(request, "x-forwarded-for")?.split(",").at(0)?.trim();
}
