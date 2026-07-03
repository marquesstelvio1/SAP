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

import type { AuthEnrichedContext, RpcAuthMiddleware } from "../rpc/rpc-auth.middleware.js";
import type { PrivacyService } from "./privacy.service.js";

export type PrivacyRpcContext = {
  request: IncomingMessage;
} & AuthEnrichedContext;

export type CreatePrivacyRpcRouterInput = {
  privacyService: Pick<PrivacyService, "exportUserData" | "scheduleAccountDeletion">;
  authMiddleware: RpcAuthMiddleware;
};

export function createPrivacyRpcRouter(deps: CreatePrivacyRpcRouterInput) {
  const privacyRpc = os.$context<PrivacyRpcContext>().use(deps.authMiddleware);

  return privacyRpc.router({
    privacy: {
      exportData: privacyRpc
        .meta(privacyExportMetadata)
        .route({ method: "POST", path: "/privacy/export" })
        .input(privacyExportInputSchema)
        .output(privacyExportOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.privacyService.exportUserData(context.actorId, {
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
          const result = await deps.privacyService.scheduleAccountDeletion(context.actorId, {
            actorType: context.actorType,
            actorId: context.actorId,
            correlationId: context.correlationId,
          });

          return {
            scheduledAt: result.scheduledAt,
            message: result.message,
            idempotency: { key: input.idempotencyKey, replayed: false },
            audit: {
              action: "account.deletion_scheduled",
              subjectType: "user",
              subjectId: context.actorId,
            },
            outbox: {
              eventType: "account.deletion_scheduled",
              aggregateType: "user",
              aggregateId: context.actorId,
            },
          };
        }),
    },
  });
}

export type PrivacyRpcRouter = ReturnType<typeof createPrivacyRpcRouter>;
