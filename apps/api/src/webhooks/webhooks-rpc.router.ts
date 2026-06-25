import type { IncomingMessage } from "node:http";
import { ForbiddenException } from "@nestjs/common";
import { os } from "@orpc/server";
import {
  createWebhookInputSchema,
  createWebhookMetadata,
  createWebhookOutputSchema,
  deleteWebhookInputSchema,
  deleteWebhookMetadata,
  deleteWebhookOutputSchema,
  getWebhookDeliveryLogInputSchema,
  getWebhookDeliveryLogMetadata,
  getWebhookDeliveryLogOutputSchema,
  listWebhooksInputSchema,
  listWebhooksMetadata,
  listWebhooksOutputSchema,
  updateWebhookInputSchema,
  updateWebhookMetadata,
  updateWebhookOutputSchema,
} from "@saptm/rpc";

import type { RpcRequestWithAuthContext } from "../rpc/rpc-context.js";
import type { RpcContextService } from "../rpc/rpc-context.service.js";
import type { WebhooksService } from "./webhooks.service.js";

export type WebhooksRpcContext = {
  request: IncomingMessage & RpcRequestWithAuthContext;
};

export type CreateWebhooksRpcRouterInput = {
  webhooksService: Pick<
    WebhooksService,
    "create" | "update" | "delete" | "list" | "getDeliveryLog"
  >;
  rpcContextService: Pick<RpcContextService, "authorizeRequest">;
};

const webhooksRpc = os.$context<WebhooksRpcContext>();

export function createWebhooksRpcRouter(deps: CreateWebhooksRpcRouterInput) {
  return webhooksRpc.router({
    webhooks: {
      list: webhooksRpc
        .meta(listWebhooksMetadata)
        .route({ method: "GET", path: "/webhooks/list" })
        .input(listWebhooksInputSchema)
        .output(listWebhooksOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            listWebhooksMetadata,
          );
          const organizationId = authorizedContext.authContext?.organizationId;

          if (organizationId === undefined) {
            throw new ForbiddenException("webhooks.organization_required");
          }

          return deps.webhooksService.list({
            organizationId,
            limit: input.limit,
            offset: input.offset,
          });
        }),
      create: webhooksRpc
        .meta(createWebhookMetadata)
        .route({ method: "POST", path: "/webhooks/create" })
        .input(createWebhookInputSchema)
        .output(createWebhookOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            createWebhookMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("webhooks.organization_required");
          }

          return deps.webhooksService.create({
            ...input,
            organizationId,
          });
        }),
      update: webhooksRpc
        .meta(updateWebhookMetadata)
        .route({ method: "POST", path: "/webhooks/update" })
        .input(updateWebhookInputSchema)
        .output(updateWebhookOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            updateWebhookMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("webhooks.organization_required");
          }

          return deps.webhooksService.update({
            ...input,
            organizationId,
          });
        }),
      delete: webhooksRpc
        .meta(deleteWebhookMetadata)
        .route({ method: "POST", path: "/webhooks/delete" })
        .input(deleteWebhookInputSchema)
        .output(deleteWebhookOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            deleteWebhookMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("webhooks.organization_required");
          }

          return deps.webhooksService.delete({
            ...input,
            organizationId,
          });
        }),
      getDeliveryLog: webhooksRpc
        .meta(getWebhookDeliveryLogMetadata)
        .route({ method: "GET", path: "/webhooks/getDeliveryLog" })
        .input(getWebhookDeliveryLogInputSchema)
        .output(getWebhookDeliveryLogOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            getWebhookDeliveryLogMetadata,
          );
          const organizationId = authorizedContext.authContext?.organizationId;

          if (organizationId === undefined) {
            throw new ForbiddenException("webhooks.organization_required");
          }

          return deps.webhooksService.getDeliveryLog({
            webhookId: input.webhookId,
            organizationId,
            limit: input.limit,
            offset: input.offset,
          });
        }),
    },
  });
}

export type WebhooksRpcRouter = ReturnType<typeof createWebhooksRpcRouter>;
