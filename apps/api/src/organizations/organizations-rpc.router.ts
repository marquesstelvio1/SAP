import type { IncomingMessage } from "node:http";
import { os } from "@orpc/server";
import {
  organizationProfileMetadata,
  organizationProfileOutputSchema,
  organizationStatusUpdateInputSchema,
  organizationStatusUpdateMetadata,
  organizationStatusUpdateOutputSchema,
} from "@saptm/rpc";

import type { AuthEnrichedContext, RpcAuthMiddleware } from "../rpc/rpc-auth.middleware.js";
import type { OrganizationsService } from "./organizations.service.js";

export type OrganizationsRpcContext = {
  request: IncomingMessage;
} & AuthEnrichedContext;

export type CreateOrganizationsRpcRouterInput = {
  organizationsService: Pick<OrganizationsService, "getProfile" | "updateStatus">;
  authMiddleware: RpcAuthMiddleware;
};

export function createOrganizationsRpcRouter(deps: CreateOrganizationsRpcRouterInput) {
  const organizationsRpc = os.$context<OrganizationsRpcContext>().use(deps.authMiddleware);

  return organizationsRpc.router({
    organizations: {
      profile: organizationsRpc
        .meta(organizationProfileMetadata)
        .route({ method: "GET", path: "/organizations/profile" })
        .output(organizationProfileOutputSchema)
        .handler(async ({ context }) => {
          return deps.organizationsService.getProfile({
            organizationId: context.organizationId,
          });
        }),
      updateStatus: organizationsRpc
        .meta(organizationStatusUpdateMetadata)
        .route({ method: "POST", path: "/organizations/updateStatus" })
        .input(organizationStatusUpdateInputSchema)
        .output(organizationStatusUpdateOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.organizationsService.updateStatus({
            ...input,
            organizationId: context.organizationId,
            actorId: context.actorId,
            actorType: context.actorType,
            correlationId: context.correlationId,
          });
        }),
    },
  });
}

export type OrganizationsRpcRouter = ReturnType<typeof createOrganizationsRpcRouter>;
