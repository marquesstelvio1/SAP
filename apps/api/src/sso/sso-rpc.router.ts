import type { IncomingMessage } from "node:http";
import { ForbiddenException } from "@nestjs/common";
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

import type { RpcRequestWithAuthContext } from "../rpc/rpc-context.js";
import type { RpcContextService } from "../rpc/rpc-context.service.js";
import type { SsoService } from "./sso.service.js";

export type SsoRpcContext = {
  request: IncomingMessage & RpcRequestWithAuthContext;
};

export type CreateSsoRpcRouterInput = {
  ssoService: Pick<SsoService, "getSsoConfig" | "updateSsoConfig" | "testSsoConfig">;
  rpcContextService: Pick<RpcContextService, "authorizeRequest">;
};

const ssoRpc = os.$context<SsoRpcContext>();

export function createSsoRpcRouter(deps: CreateSsoRpcRouterInput) {
  return ssoRpc.router({
    sso: {
      config: {
        get: ssoRpc
          .meta(getSsoConfigMetadata)
          .route({ method: "GET", path: "/sso/config" })
          .input(getSsoConfigInputSchema)
          .output(getSsoConfigOutputSchema)
          .handler(async ({ context, input: _input }) => {
            const authorizedContext = await deps.rpcContextService.authorizeRequest(
              context.request,
              getSsoConfigMetadata,
            );
            const authContext = authorizedContext.authContext;
            const organizationId = authContext?.organizationId;

            if (authContext === undefined || organizationId === undefined) {
              throw new ForbiddenException("sso.organization_required");
            }

            return deps.ssoService.getSsoConfig({
              organizationId,
            });
          }),
        update: ssoRpc
          .meta(updateSsoConfigMetadata)
          .route({ method: "POST", path: "/sso/config/update" })
          .input(updateSsoConfigInputSchema)
          .output(updateSsoConfigOutputSchema)
          .handler(async ({ context, input }) => {
            const authorizedContext = await deps.rpcContextService.authorizeRequest(
              context.request,
              updateSsoConfigMetadata,
            );
            const authContext = authorizedContext.authContext;
            const organizationId = authContext?.organizationId;

            if (authContext === undefined || organizationId === undefined) {
              throw new ForbiddenException("sso.organization_required");
            }

            return deps.ssoService.updateSsoConfig({
              ...input,
              organizationId,
              actorId: authContext.actorId,
              actorType: authContext.actorType,
              correlationId: authContext.correlationId,
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
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            testSsoConfigMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("sso.organization_required");
          }

          return deps.ssoService.testSsoConfig({
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

export type SsoRpcRouter = ReturnType<typeof createSsoRpcRouter>;
