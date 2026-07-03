import type { IncomingMessage } from "node:http";
import { os } from "@orpc/server";
import {
  getPlanInputSchema,
  getPlanMetadata,
  getPlanOutputSchema,
  listPlansInputSchema,
  listPlansMetadata,
  listPlansOutputSchema,
} from "@saptm/rpc";

import type { AuthEnrichedContext, RpcAuthMiddleware } from "../../rpc/rpc-auth.middleware.js";
import type { PlansService } from "./plans.service.js";

export type PlansRpcContext = {
  request: IncomingMessage;
} & AuthEnrichedContext;

export type CreatePlansRpcRouterInput = {
  plansService: Pick<PlansService, "listPlans" | "getPlanBySlug">;
  authMiddleware: RpcAuthMiddleware;
};

export function createPlansRpcRouter(deps: CreatePlansRpcRouterInput) {
  const plansRpc = os.$context<PlansRpcContext>().use(deps.authMiddleware);

  return plansRpc.router({
    plans: {
      list: plansRpc
        .meta(listPlansMetadata)
        .route({ method: "GET", path: "/plans/list" })
        .input(listPlansInputSchema)
        .output(listPlansOutputSchema)
        .handler(async ({ input }) => {
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
        .handler(async ({ input }) => {
          const plan = await deps.plansService.getPlanBySlug(input.slug);

          return { plan };
        }),
    },
  });
}

export type PlansRpcRouter = ReturnType<typeof createPlansRpcRouter>;
