import type { IncomingMessage } from "node:http";
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

import type { AuthEnrichedContext, RpcAuthMiddleware } from "../rpc/rpc-auth.middleware.js";
import type { WebhooksService } from "./webhooks.service.js";

export type WebhooksRpcContext = {
  request: IncomingMessage;
} & AuthEnrichedContext;

export type CreateWebhooksRpcRouterInput = {
  webhooksService: Pick<
    WebhooksService,
    "create" | "update" | "delete" | "list" | "getDeliveryLog"
  >;
  authMiddleware: RpcAuthMiddleware;
};

export function createWebhooksRpcRouter(deps: CreateWebhooksRpcRouterInput) {
  const webhooksRpc = os.$context<WebhooksRpcContext>().use(deps.authMiddleware);

  return webhooksRpc.router({
    webhooks: {
      list: webhooksRpc
        .meta(listWebhooksMetadata)
        .route({ method: "GET", path: "/webhooks/list" })
        .input(listWebhooksInputSchema)
        .output(listWebhooksOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.webhooksService.list({
            organizationId: context.organizationId,
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
          return deps.webhooksService.create({
            ...input,
            organizationId: context.organizationId,
            actorType: context.actorType,
            actorId: context.actorId,
            correlationId: context.correlationId,
          });
        }),
      update: webhooksRpc
        .meta(updateWebhookMetadata)
        .route({ method: "POST", path: "/webhooks/update" })
        .input(updateWebhookInputSchema)
        .output(updateWebhookOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.webhooksService.update({
            ...input,
            organizationId: context.organizationId,
            actorType: context.actorType,
            actorId: context.actorId,
            correlationId: context.correlationId,
          });
        }),
      delete: webhooksRpc
        .meta(deleteWebhookMetadata)
        .route({ method: "POST", path: "/webhooks/delete" })
        .input(deleteWebhookInputSchema)
        .output(deleteWebhookOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.webhooksService.delete({
            ...input,
            organizationId: context.organizationId,
            actorType: context.actorType,
            actorId: context.actorId,
            correlationId: context.correlationId,
          });
        }),
      getDeliveryLog: webhooksRpc
        .meta(getWebhookDeliveryLogMetadata)
        .route({ method: "GET", path: "/webhooks/getDeliveryLog" })
        .input(getWebhookDeliveryLogInputSchema)
        .output(getWebhookDeliveryLogOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.webhooksService.getDeliveryLog({
            webhookId: input.webhookId,
            organizationId: context.organizationId,
            limit: input.limit,
            offset: input.offset,
          });
        }),
    },
  });
}

export type WebhooksRpcRouter = ReturnType<typeof createWebhooksRpcRouter>;
