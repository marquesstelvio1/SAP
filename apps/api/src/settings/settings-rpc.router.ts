import type { IncomingMessage } from "node:http";
import { ForbiddenException } from "@nestjs/common";
import { os } from "@orpc/server";
import {
  settingsMutationOutputSchema,
  settingsOrganizationUpdateInputSchema,
  settingsOrganizationUpdateMetadata,
  settingsOverviewMetadata,
  settingsOverviewOutputSchema,
} from "@saptm/rpc";

import type { RpcRequestWithAuthContext } from "../rpc/rpc-context.js";
import type { RpcContextService } from "../rpc/rpc-context.service.js";
import type { SettingsService } from "./settings.service.js";

export type SettingsRpcContext = {
  request: IncomingMessage & RpcRequestWithAuthContext;
};

export type CreateSettingsRpcRouterInput = {
  settingsService: Pick<SettingsService, "getSettings" | "updateSettings">;
  rpcContextService: Pick<RpcContextService, "authorizeRequest">;
};

const settingsRpc = os.$context<SettingsRpcContext>();

export function createSettingsRpcRouter(deps: CreateSettingsRpcRouterInput) {
  return settingsRpc.router({
    settings: {
      overview: settingsRpc
        .meta(settingsOverviewMetadata)
        .route({ method: "GET", path: "/settings/overview" })
        .output(settingsOverviewOutputSchema)
        .handler(async ({ context }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            settingsOverviewMetadata,
          );
          const organizationId = authorizedContext.authContext?.organizationId;

          if (organizationId === undefined) {
            throw new ForbiddenException("settings.organization_required");
          }

          return deps.settingsService.getSettings({
            organizationId,
          });
        }),
      update: settingsRpc
        .meta(settingsOrganizationUpdateMetadata)
        .route({ method: "POST", path: "/settings/update" })
        .input(settingsOrganizationUpdateInputSchema)
        .output(settingsMutationOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            settingsOrganizationUpdateMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("settings.organization_required");
          }

          return deps.settingsService.updateSettings({
            ...input,
            organizationId,
            actorId: authContext.actorId,
            actorType: authContext.actorType,
            correlationId: authContext.correlationId,
          });
        }),
    },
  });
}

export type SettingsRpcRouter = ReturnType<typeof createSettingsRpcRouter>;
