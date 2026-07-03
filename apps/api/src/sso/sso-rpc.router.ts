import type { IncomingMessage } from "node:http";
import { os } from "@orpc/server";
import {
  getSsoConfigInputSchema,
  getSsoConfigMetadata,
  getSsoConfigOutputSchema,
  testSsoConfigInputSchema,
  testSsoConfigMetadata,
  testSsoConfigOutputSchema,
  updateSsoConfigInputSchema,
  updateSsoConfigMetadata,
  updateSsoConfigOutputSchema,
} from "@saptm/rpc";

import type { AuthEnrichedContext, RpcAuthMiddleware } from "../rpc/rpc-auth.middleware.js";
import type { SsoService } from "./sso.service.js";

export type SsoRpcContext = {
  request: IncomingMessage;
} & AuthEnrichedContext;

export type CreateSsoRpcRouterInput = {
  ssoService: Pick<SsoService, "getSsoConfig" | "updateSsoConfig" | "testSsoConfig">;
  authMiddleware: RpcAuthMiddleware;
};

export function createSsoRpcRouter(deps: CreateSsoRpcRouterInput) {
  const ssoRpc = os.$context<SsoRpcContext>().use(deps.authMiddleware);

  return ssoRpc.router({
    sso: {
      config: {
        get: ssoRpc
          .meta(getSsoConfigMetadata)
          .route({ method: "GET", path: "/sso/config" })
          .input(getSsoConfigInputSchema)
          .output(getSsoConfigOutputSchema)
          .handler(async ({ context, input: _input }) => {
            return deps.ssoService.getSsoConfig({
              organizationId: context.organizationId,
            });
          }),
        update: ssoRpc
          .meta(updateSsoConfigMetadata)
          .route({ method: "POST", path: "/sso/config/update" })
          .input(updateSsoConfigInputSchema)
          .output(updateSsoConfigOutputSchema)
          .handler(async ({ context, input }) => {
            return deps.ssoService.updateSsoConfig({
              ...input,
              organizationId: context.organizationId,
              actorId: context.actorId,
              actorType: context.actorType,
              correlationId: context.correlationId,
              idempotencyKey: input.idempotencyKey ?? crypto.randomUUID(),
            });
          }),
      },
      test: ssoRpc
        .meta(testSsoConfigMetadata)
        .route({ method: "POST", path: "/sso/test" })
        .input(testSsoConfigInputSchema)
        .output(testSsoConfigOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.ssoService.testSsoConfig({
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

export type SsoRpcRouter = ReturnType<typeof createSsoRpcRouter>;
