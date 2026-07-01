import type { IncomingMessage } from "node:http";
import { os } from "@orpc/server";
import {
  privacyDeleteInputSchema,
  privacyDeleteMetadata,
  privacyDeleteOutputSchema,
  privacyExportInputSchema,
  privacyExportMetadata,
  privacyExportOutputSchema,
} from "@saptm/rpc";

import type { RpcRequestWithAuthContext } from "../rpc/rpc-context.js";
import type { RpcContextService } from "../rpc/rpc-context.service.js";
import type { PrivacyService } from "./privacy.service.js";

export type PrivacyRpcContext = {
  request: IncomingMessage & RpcRequestWithAuthContext;
};

export type CreatePrivacyRpcRouterInput = {
  privacyService: Pick<PrivacyService, "exportUserData" | "scheduleAccountDeletion">;
  rpcContextService: Pick<RpcContextService, "authorizeRequest">;
};

const privacyRpc = os.$context<PrivacyRpcContext>();

export function createPrivacyRpcRouter(deps: CreatePrivacyRpcRouterInput) {
  return privacyRpc.router({
    privacy: {
      exportData: privacyRpc
        .meta(privacyExportMetadata)
        .route({ method: "POST", path: "/privacy/export" })
        .input(privacyExportInputSchema)
        .output(privacyExportOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            privacyExportMetadata,
          );
          const authContext = authorizedContext.authContext;

          if (authContext === undefined) {
            throw new Error("authentication_required");
          }

          return deps.privacyService.exportUserData(authContext.actorId, {
            format: input.format,
            includeAuditLogs: input.includeAuditLogs,
            includeSessions: input.includeSessions,
          });
        }),
      deleteAccount: privacyRpc
        .meta(privacyDeleteMetadata)
        .route({ method: "POST", path: "/privacy/delete" })
        .input(privacyDeleteInputSchema)
        .output(privacyDeleteOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            privacyDeleteMetadata,
          );
          const authContext = authorizedContext.authContext;

          if (authContext === undefined) {
            throw new Error("authentication_required");
          }

          const result = await deps.privacyService.scheduleAccountDeletion(authContext.actorId, {
            actorType: authContext.actorType,
            actorId: authContext.actorId,
            correlationId: authContext.correlationId,
          });

          return {
            scheduledAt: result.scheduledAt,
            message: result.message,
            idempotency: { key: input.idempotencyKey, replayed: false },
            audit: {
              action: "account.deletion_scheduled",
              subjectType: "user",
              subjectId: authContext.actorId,
            },
            outbox: {
              eventType: "account.deletion_scheduled",
              aggregateType: "user",
              aggregateId: authContext.actorId,
            },
          };
        }),
    },
  });
}
