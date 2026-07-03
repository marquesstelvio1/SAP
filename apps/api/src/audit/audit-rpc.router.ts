import type { IncomingMessage } from "node:http";
import { os } from "@orpc/server";
import {
  auditExportInputSchema,
  auditExportMetadata,
  auditExportOutputSchema,
  auditSearchInputSchema,
  auditSearchMetadata,
  auditSearchOutputSchema,
} from "@saptm/rpc";

import type { AuthEnrichedContext, RpcAuthMiddleware } from "../rpc/rpc-auth.middleware.js";
import type { AuditService } from "./audit.service.js";

export type AuditRpcContext = {
  request: IncomingMessage;
} & AuthEnrichedContext;

export type CreateAuditRpcRouterInput = {
  auditService: Pick<AuditService, "exportRecords" | "searchRecords">;
  authMiddleware: RpcAuthMiddleware;
};

export function createAuditRpcRouter(deps: CreateAuditRpcRouterInput) {
  const auditRpc = os.$context<AuditRpcContext>().use(deps.authMiddleware);

  return auditRpc.router({
    audit: {
      search: auditRpc
        .meta(auditSearchMetadata)
        .route({ method: "POST", path: "/audit/search" })
        .input(auditSearchInputSchema)
        .output(auditSearchOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.auditService.searchRecords({
            ...input,
            organizationId: context.organizationId,
          });
        }),
      export: auditRpc
        .meta(auditExportMetadata)
        .route({ method: "POST", path: "/audit/export" })
        .input(auditExportInputSchema)
        .output(auditExportOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.auditService.exportRecords({
            ...input,
            organizationId: context.organizationId,
            actorId: context.actorId,
            actorType: context.actorType,
            requestCorrelationId: context.correlationId,
            ...(context.userAgent === undefined ? {} : { userAgent: context.userAgent }),
            ...(context.ipAddress === undefined ? {} : { ipAddress: context.ipAddress }),
          });
        }),
    },
  });
}

export type AuditRpcRouter = ReturnType<typeof createAuditRpcRouter>;
