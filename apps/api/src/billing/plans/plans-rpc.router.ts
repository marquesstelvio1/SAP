import type { IncomingMessage } from "node:http";
import { ForbiddenException } from "@nestjs/common";
import { os } from "@orpc/server";
import {
  getPlanInputSchema,
  getPlanMetadata,
  getPlanOutputSchema,
  listPlansInputSchema,
  listPlansMetadata,
  listPlansOutputSchema,
} from "@saptm/rpc";

import type { RpcRequestWithAuthContext } from "../../rpc/rpc-context.js";
import type { RpcContextService } from "../../rpc/rpc-context.service.js";
import type { PlansService } from "./plans.service.js";

export type PlansRpcContext = {
  request: IncomingMessage & RpcRequestWithAuthContext;
};

export type CreatePlansRpcRouterInput = {
  plansService: Pick<PlansService, "listPlans" | "getPlanBySlug">;
  rpcContextService: Pick<RpcContextService, "authorizeRequest">;
};

const plansRpc = os.$context<PlansRpcContext>();

export function createPlansRpcRouter(deps: CreatePlansRpcRouterInput) {
  return plansRpc.router({
    plans: {
      list: plansRpc
        .meta(listPlansMetadata)
        .route({ method: "GET", path: "/plans/list" })
        .input(listPlansInputSchema)
        .output(listPlansOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            listPlansMetadata,
          );
          const organizationId = authorizedContext.authContext?.organizationId;

          if (organizationId === undefined) {
            throw new ForbiddenException("plans.organization_required");
          }

          const plans = await deps.plansService.listPlans({
            includeInternal: input.includeInternal,
          });

          return { plans };
        }),
      get: plansRpc
        .meta(getPlanMetadata)
        .route({ method: "GET", path: "/plans/get" })
        .input(getPlanInputSchema)
        .output(getPlanOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            getPlanMetadata,
          );
          const organizationId = authorizedContext.authContext?.organizationId;

          if (organizationId === undefined) {
            throw new ForbiddenException("plans.organization_required");
          }

          const plan = await deps.plansService.getPlanBySlug(input.slug);

          return { plan };
        }),
    },
  });
}

export type PlansRpcRouter = ReturnType<typeof createPlansRpcRouter>;
