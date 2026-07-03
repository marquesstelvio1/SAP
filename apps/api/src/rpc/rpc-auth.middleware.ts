import type { IncomingMessage } from "node:http";
import { ForbiddenException } from "@nestjs/common";
import { os } from "@orpc/server";
import {
  type AuthorizedRpcContext,
  type RpcOperationMetadata,
} from "@saptm/rpc";

import type { RpcContextService } from "./rpc-context.service.js";
import { readRequestHeader, readRequestIp } from "./rpc-utils.js";

export type AuthEnrichedContext = {
  authContext: AuthorizedRpcContext["authContext"];
  organizationId: string;
  actorId: string;
  actorType: string;
  correlationId: string;
  userAgent: string | undefined;
  ipAddress: string | undefined;
};

type RpcAuthBuilder = ReturnType<typeof createRpcAuthBuilder>;

export function createRpcAuthBuilder(rpcContextService: RpcContextService) {
  const middleware = os
    .$context<{ request: IncomingMessage }>()
    .middleware(async ({ context, next, meta }) => {
      const metadata = meta as RpcOperationMetadata | undefined;

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

  return {
    middleware,
    base: os.$context<Record<string, never>>().use(middleware),
  };
}

export type RpcAuthBuilder = ReturnType<typeof createRpcAuthBuilder>;
