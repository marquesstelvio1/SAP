import type { IncomingMessage } from "node:http";
import { os } from "@orpc/server";
import {
  dispatchOverviewInputSchema,
  dispatchOverviewMetadata,
  dispatchOverviewOutputSchema,
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

import type { OverviewService } from "../overview/overview.service.js";
import type { AuthEnrichedContext, RpcAuthMiddleware } from "../rpc/rpc-auth.middleware.js";
import type { PlanningService } from "./planning.service.js";

export type PlanningRpcContext = {
  request: IncomingMessage;
} & AuthEnrichedContext;

export type CreatePlanningRpcRouterInput = {
  planningService: Pick<
    PlanningService,
    | "cancelTransportOrder"
    | "confirmTransportOrder"
    | "dispatchTransportOrder"
    | "getOverview"
    | "rescheduleTransportOrder"
  >;
  overviewService: Pick<OverviewService, "getDispatchOverview">;
  authMiddleware: RpcAuthMiddleware;
};

export function createPlanningRpcRouter(deps: CreatePlanningRpcRouterInput) {
  const planningRpc = os.$context<PlanningRpcContext>().use(deps.authMiddleware);

  return planningRpc.router({
    planning: {
      overview: planningRpc
        .meta(planningOverviewMetadata)
        .route({ method: "GET", path: "/planning/overview" })
        .input(planningOverviewInputSchema)
        .output(planningOverviewOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.planningService.getOverview({
            organizationId: context.organizationId,
            limit: input.limit,
          });
        }),
      dispatchOverview: planningRpc
        .meta(dispatchOverviewMetadata)
        .route({ method: "GET", path: "/planning/dispatchOverview" })
        .input(dispatchOverviewInputSchema)
        .output(dispatchOverviewOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.overviewService.getDispatchOverview({
            organizationId: context.organizationId,
            limit: input.limit,
            offset: input.offset,
          });
        }),
      confirmTransportOrder: planningRpc
        .meta(transportOrderConfirmMetadata)
        .route({ method: "POST", path: "/planning/confirmTransportOrder" })
        .input(transportOrderConfirmInputSchema)
        .output(transportOrderConfirmOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.planningService.confirmTransportOrder({
            ...input,
            organizationId: context.organizationId,
            actorId: context.actorId,
            actorType: context.actorType,
            correlationId: context.correlationId,
            ...(context.userAgent === undefined ? {} : { userAgent: context.userAgent }),
            ...(context.ipAddress === undefined ? {} : { ipAddress: context.ipAddress }),
          });
        }),
      cancelTransportOrder: planningRpc
        .meta(transportOrderCancelMetadata)
        .route({ method: "POST", path: "/planning/cancelTransportOrder" })
        .input(transportOrderCancelInputSchema)
        .output(transportOrderCancelOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.planningService.cancelTransportOrder({
            ...input,
            organizationId: context.organizationId,
            actorId: context.actorId,
            actorType: context.actorType,
            correlationId: context.correlationId,
            ...(context.userAgent === undefined ? {} : { userAgent: context.userAgent }),
            ...(context.ipAddress === undefined ? {} : { ipAddress: context.ipAddress }),
          });
        }),
      rescheduleTransportOrder: planningRpc
        .meta(transportOrderRescheduleMetadata)
        .route({ method: "POST", path: "/planning/rescheduleTransportOrder" })
        .input(transportOrderRescheduleInputSchema)
        .output(transportOrderRescheduleOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.planningService.rescheduleTransportOrder({
            ...input,
            organizationId: context.organizationId,
            actorId: context.actorId,
            actorType: context.actorType,
            correlationId: context.correlationId,
            ...(context.userAgent === undefined ? {} : { userAgent: context.userAgent }),
            ...(context.ipAddress === undefined ? {} : { ipAddress: context.ipAddress }),
          });
        }),
      dispatchTransportOrder: planningRpc
        .meta(transportOrderDispatchMetadata)
        .route({ method: "POST", path: "/planning/dispatchTransportOrder" })
        .input(transportOrderDispatchInputSchema)
        .output(transportOrderDispatchOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.planningService.dispatchTransportOrder({
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

export type PlanningRpcRouter = ReturnType<typeof createPlanningRpcRouter>;
