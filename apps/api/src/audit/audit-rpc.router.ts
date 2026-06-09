import type { IncomingMessage } from "node:http";
import { ForbiddenException } from "@nestjs/common";
import { os } from "@orpc/server";
import {
  auditExportInputSchema,
  auditExportMetadata,
  auditExportOutputSchema,
  auditSearchInputSchema,
  auditSearchMetadata,
  auditSearchOutputSchema,
} from "@saptm/rpc";

import type { RpcRequestWithAuthContext } from "../rpc/rpc-context.js";
import type { RpcContextService } from "../rpc/rpc-context.service.js";
import type { AuditService } from "./audit.service.js";

export type AuditRpcContext = {
  request: IncomingMessage & RpcRequestWithAuthContext;
};

export type CreateAuditRpcRouterInput = {
  auditService: Pick<AuditService, "exportRecords" | "searchRecords">;
  rpcContextService: Pick<RpcContextService, "authorizeRequest">;
};

const auditRpc = os.$context<AuditRpcContext>();

export function createAuditRpcRouter(deps: CreateAuditRpcRouterInput) {
  return auditRpc.router({
    audit: {
      search: auditRpc
        .meta(auditSearchMetadata)
        .route({ method: "POST", path: "/audit/search" })
        .input(auditSearchInputSchema)
        .output(auditSearchOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            auditSearchMetadata,
          );
          const organizationId = authorizedContext.authContext?.organizationId;

          if (organizationId === undefined) {
            throw new ForbiddenException("audit.organization_required");
          }

          return deps.auditService.searchRecords({
            ...input,
            organizationId,
          });
        }),
      export: auditRpc
        .meta(auditExportMetadata)
        .route({ method: "POST", path: "/audit/export" })
        .input(auditExportInputSchema)
        .output(auditExportOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            auditExportMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("audit.organization_required");
          }

          const userAgent = readRequestHeader(context.request, "user-agent");
          const ipAddress = readRequestIp(context.request);

          return deps.auditService.exportRecords({
            ...input,
            organizationId,
            actorId: authContext.actorId,
            actorType: authContext.actorType,
            requestCorrelationId: authContext.correlationId,
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
