import type { IncomingMessage } from "node:http";
import { os } from "@orpc/server";
import {
  settingsMutationOutputSchema,
  settingsOrganizationUpdateInputSchema,
  settingsOrganizationUpdateMetadata,
  settingsOverviewMetadata,
  settingsOverviewOutputSchema,
} from "@saptm/rpc";

import type { AuthEnrichedContext, RpcAuthMiddleware } from "../rpc/rpc-auth.middleware.js";
import type { SettingsService } from "./settings.service.js";

export type SettingsRpcContext = {
  request: IncomingMessage;
} & AuthEnrichedContext;

export type CreateSettingsRpcRouterInput = {
  settingsService: Pick<SettingsService, "getSettings" | "updateSettings">;
  authMiddleware: RpcAuthMiddleware;
};

export function createSettingsRpcRouter(deps: CreateSettingsRpcRouterInput) {
  const settingsRpc = os.$context<SettingsRpcContext>().use(deps.authMiddleware);

  return settingsRpc.router({
    settings: {
      overview: settingsRpc
        .meta(settingsOverviewMetadata)
        .route({ method: "GET", path: "/settings/overview" })
        .output(settingsOverviewOutputSchema)
        .handler(async ({ context }) => {
          return deps.settingsService.getSettings({
            organizationId: context.organizationId,
          });
        }),
      update: settingsRpc
        .meta(settingsOrganizationUpdateMetadata)
        .route({ method: "POST", path: "/settings/update" })
        .input(settingsOrganizationUpdateInputSchema)
        .output(settingsMutationOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.settingsService.updateSettings({
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

export type SettingsRpcRouter = ReturnType<typeof createSettingsRpcRouter>;
