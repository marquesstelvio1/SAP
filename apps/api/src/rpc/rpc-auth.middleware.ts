import type { IncomingMessage } from "node:http";
import { ForbiddenException } from "@nestjs/common";
import type { Middleware, MiddlewareResult, ORPCErrorConstructorMap } from "@orpc/server";
import type { AuthContext } from "@saptm/auth";
import type { RpcOperationMetadata } from "@saptm/rpc";

import type { RequestWithAuthContext } from "../auth/auth-context.js";
import type { RpcContextService } from "./rpc-context.service.js";
import { readRequestHeader, readRequestIp } from "./rpc-utils.js";

export type AuthEnrichedContext = {
  authContext: AuthContext | undefined;
  organizationId: string;
  actorId: string;
  actorType: "user" | "anonymous" | "service_account" | "integration" | "platform" | "ai_agent";
  correlationId: string;
  userAgent: string | undefined;
  ipAddress: string | undefined;
};

export type RpcAuthMiddleware = Middleware<
  { request: IncomingMessage },
  AuthEnrichedContext,
  unknown,
  unknown,
  ORPCErrorConstructorMap<Record<never, never>>,
  Record<never, never>
>;

export function createRpcAuthMiddleware(rpcContextService: RpcContextService): RpcAuthMiddleware {
  return async (options, _input, _output) => {
    const { context } = options;
    const def = (options.procedure as { "~orpc"?: unknown })["~orpc"] as
      | { meta?: RpcOperationMetadata }
      | undefined;
    const metadata = def?.meta;

    if (metadata?.auth === "public") {
      return options.next({
        context: {
          authContext: undefined,
          organizationId: "",
          actorId: "",
          actorType: "anonymous",
          correlationId: "",
          userAgent: readRequestHeader(context.request, "user-agent"),
          ipAddress: readRequestIp(context.request),
        },
      }) as unknown as MiddlewareResult<AuthEnrichedContext, unknown>;
    }

    const authorizedContext = await rpcContextService.authorizeRequest(
      context.request as unknown as RequestWithAuthContext,
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

    return options.next({
      context: {
        authContext,
        organizationId,
        actorId: authContext.actorId,
        actorType: authContext.actorType,
        correlationId: authContext.correlationId,
        userAgent: readRequestHeader(context.request, "user-agent"),
        ipAddress: readRequestIp(context.request),
      },
    }) as unknown as MiddlewareResult<AuthEnrichedContext, unknown>;
  };
}
