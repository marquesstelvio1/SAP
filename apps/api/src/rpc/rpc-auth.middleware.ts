import type { IncomingMessage } from "node:http";
import { ForbiddenException } from "@nestjs/common";
import { os } from "@orpc/server";
import type { RpcOperationMetadata } from "@saptm/rpc";

import type { AuthorizedRpcContext } from "./rpc-context.js";
import type { RpcContextService } from "./rpc-context.service.js";
import { readRequestHeader, readRequestIp } from "./rpc-utils.js";

/**
 * Extended context injected by the auth middleware.
 */
export type AuthEnrichedContext = {
  authContext: AuthorizedRpcContext["authContext"];
  organizationId: string | undefined;
  actorId: string | undefined;
  actorType: string | undefined;
  correlationId: string | undefined;
  userAgent: string | undefined;
  ipAddress: string | undefined;
};

export function createRpcAuthMiddleware(rpcContextService: RpcContextService) {
  const base = os.$context<{ request: IncomingMessage }>();

  return base.middleware(async ({ context, next, procedure }) => {
    const metadata = (procedure as { meta?: RpcOperationMetadata }).meta;

    if (metadata?.auth === "public") {
      return next({
        context: {
          authContext: undefined,
          organizationId: undefined,
          actorId: undefined,
          actorType: undefined,
          correlationId: undefined,
          userAgent: readRequestHeader(context.request, "user-agent"),
          ipAddress: readRequestIp(context.request),
        },
      });
    }

    const authorizedContext = await rpcContextService.authorizeRequest(
      context.request,
      metadata ?? {
        auth: "session",
        name: "unknown",
        version: 1,
        kind: "query",
        permissions: [],
        permissionMode: "all",
        organizationRequired: true,
        audit: "standard",
        idempotency: "none",
        observability: {
          operationName: "unknown",
          spanName: "unknown",
          metricName: "unknown",
          criticality: "medium",
          signals: [],
        },
      },
    );

    const authContext = authorizedContext.authContext;
    const organizationId = authContext?.organizationId;

    if (authContext === undefined || organizationId === undefined) {
      throw new ForbiddenException("Organization context is required for this operation.");
    }

    return next({
      context: {
        authContext,
        organizationId,
        actorId: authContext.actorId,
        actorType: authContext.actorType,
        correlationId: authContext.correlationId,
        userAgent: readRequestHeader(context.request, "user-agent"),
        ipAddress: readRequestIp(context.request),
      },
    });
  });
}

export type RpcAuthMiddleware = ReturnType<typeof createRpcAuthMiddleware>;
