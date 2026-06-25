import type { IncomingMessage } from "node:http";
import { ForbiddenException } from "@nestjs/common";
import { os } from "@orpc/server";
import {
  organizationProfileMetadata,
  organizationProfileOutputSchema,
  organizationStatusUpdateInputSchema,
  organizationStatusUpdateMetadata,
  organizationStatusUpdateOutputSchema,
} from "@saptm/rpc";

import type { RpcRequestWithAuthContext } from "../rpc/rpc-context.js";
import type { RpcContextService } from "../rpc/rpc-context.service.js";
import type { OrganizationsService } from "./organizations.service.js";

export type OrganizationsRpcContext = {
  request: IncomingMessage & RpcRequestWithAuthContext;
};

export type CreateOrganizationsRpcRouterInput = {
  organizationsService: Pick<OrganizationsService, "getProfile" | "updateStatus">;
  rpcContextService: Pick<RpcContextService, "authorizeRequest">;
};

const organizationsRpc = os.$context<OrganizationsRpcContext>();

export function createOrganizationsRpcRouter(deps: CreateOrganizationsRpcRouterInput) {
  return organizationsRpc.router({
    organizations: {
      profile: organizationsRpc
        .meta(organizationProfileMetadata)
        .route({ method: "GET", path: "/organizations/profile" })
        .output(organizationProfileOutputSchema)
        .handler(async ({ context }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            organizationProfileMetadata,
          );
          const organizationId = authorizedContext.authContext?.organizationId;

          if (organizationId === undefined) {
            throw new ForbiddenException("organizations.organization_required");
          }

          return deps.organizationsService.getProfile({
            organizationId,
          });
        }),
      updateStatus: organizationsRpc
        .meta(organizationStatusUpdateMetadata)
        .route({ method: "POST", path: "/organizations/updateStatus" })
        .input(organizationStatusUpdateInputSchema)
        .output(organizationStatusUpdateOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            organizationStatusUpdateMetadata,
          );
          const organizationId = authorizedContext.authContext?.organizationId;

          if (organizationId === undefined) {
            throw new ForbiddenException("organizations.organization_required");
          }

          return deps.organizationsService.updateStatus({
            ...input,
            organizationId,
          });
        }),
    },
  });
}

export type OrganizationsRpcRouter = ReturnType<typeof createOrganizationsRpcRouter>;
