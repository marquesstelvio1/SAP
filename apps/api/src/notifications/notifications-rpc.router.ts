import type { IncomingMessage } from "node:http";
import { ForbiddenException } from "@nestjs/common";
import { os } from "@orpc/server";
import {
  notificationInboxInputSchema,
  notificationInboxMetadata,
  notificationInboxOutputSchema,
  notificationMarkReadInputSchema,
  notificationMarkReadMetadata,
  notificationMarkReadOutputSchema,
} from "@saptm/rpc";

import type { RpcRequestWithAuthContext } from "../rpc/rpc-context.js";
import type { RpcContextService } from "../rpc/rpc-context.service.js";
import type { NotificationsService } from "./notifications.service.js";

export type NotificationsRpcContext = {
  request: IncomingMessage & RpcRequestWithAuthContext;
};

export type CreateNotificationsRpcRouterInput = {
  notificationsService: Pick<NotificationsService, "markRead" | "readInbox">;
  rpcContextService: Pick<RpcContextService, "authorizeRequest">;
};

const notificationsRpc = os.$context<NotificationsRpcContext>();

export function createNotificationsRpcRouter(deps: CreateNotificationsRpcRouterInput) {
  return notificationsRpc.router({
    notifications: {
      inbox: notificationsRpc
        .meta(notificationInboxMetadata)
        .route({ method: "POST", path: "/notifications/inbox" })
        .input(notificationInboxInputSchema)
        .output(notificationInboxOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            notificationInboxMetadata,
          );
          const organizationId = authorizedContext.authContext?.organizationId;

          if (organizationId === undefined) {
            throw new ForbiddenException("notification.organization_required");
          }

          return deps.notificationsService.readInbox({
            ...input,
            organizationId,
          });
        }),
      markRead: notificationsRpc
        .meta(notificationMarkReadMetadata)
        .route({ method: "POST", path: "/notifications/markRead" })
        .input(notificationMarkReadInputSchema)
        .output(notificationMarkReadOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            notificationMarkReadMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("notification.organization_required");
          }

          const userAgent = readRequestHeader(context.request, "user-agent");
          const ipAddress = readRequestIp(context.request);

          return deps.notificationsService.markRead({
            ...input,
            organizationId,
            actorId: authContext.actorId,
            actorType: authContext.actorType,
            correlationId: authContext.correlationId,
            ...(userAgent === undefined ? {} : { userAgent }),
            ...(ipAddress === undefined ? {} : { ipAddress }),
          });
        }),
    },
  });
}

function readRequestHeader(request: IncomingMessage, name: string): string | undefined {
  const value = request.headers[name] ?? request.headers[name.toLowerCase()];

  if (Array.isArray(value)) {
    return value.at(0);
  }

  return value;
}

function readRequestIp(request: IncomingMessage): string | undefined {
  const forwardedFor = readRequestHeader(request, "x-forwarded-for");

  if (forwardedFor !== undefined) {
    return forwardedFor.split(",").at(0)?.trim();
  }

  return request.socket?.remoteAddress;
}
