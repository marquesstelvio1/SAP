import type { IncomingMessage } from "node:http";
import { os } from "@orpc/server";
import {
  notificationInboxInputSchema,
  notificationInboxMetadata,
  notificationInboxOutputSchema,
  notificationMarkReadInputSchema,
  notificationMarkReadMetadata,
  notificationMarkReadOutputSchema,
} from "@saptm/rpc";

import type { AuthEnrichedContext, RpcAuthMiddleware } from "../rpc/rpc-auth.middleware.js";
import type { NotificationsService } from "./notifications.service.js";

export type NotificationsRpcContext = {
  request: IncomingMessage;
} & AuthEnrichedContext;

export type CreateNotificationsRpcRouterInput = {
  notificationsService: Pick<NotificationsService, "markRead" | "readInbox">;
  authMiddleware: RpcAuthMiddleware;
};

export function createNotificationsRpcRouter(deps: CreateNotificationsRpcRouterInput) {
  const notificationsRpc = os.$context<NotificationsRpcContext>().use(deps.authMiddleware);

  return notificationsRpc.router({
    notifications: {
      inbox: notificationsRpc
        .meta(notificationInboxMetadata)
        .route({ method: "POST", path: "/notifications/inbox" })
        .input(notificationInboxInputSchema)
        .output(notificationInboxOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.notificationsService.readInbox({
            ...input,
            organizationId: context.organizationId,
          });
        }),
      markRead: notificationsRpc
        .meta(notificationMarkReadMetadata)
        .route({ method: "POST", path: "/notifications/markRead" })
        .input(notificationMarkReadInputSchema)
        .output(notificationMarkReadOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.notificationsService.markRead({
            ...input,
            organizationId: context.organizationId,
            actorId: context.actorId,
            actorType: context.actorType,
            correlationId: context.correlationId,
            ...(context.userAgent === undefined ? {} : { userAgent: context.userAgent }),
            ...(context.ipAddress === undefined ? {} : { ipAddress: context.ipAddress }),
          });
        }),
    },
  });
}
