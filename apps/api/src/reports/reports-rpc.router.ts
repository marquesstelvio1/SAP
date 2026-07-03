import type { IncomingMessage } from "node:http";
import { os } from "@orpc/server";
import {
  reportExportInputSchema,
  reportExportMetadata,
  reportExportOutputSchema,
} from "@saptm/rpc";

import type { AuthEnrichedContext, RpcAuthMiddleware } from "../rpc/rpc-auth.middleware.js";
import type { ReportsService } from "./reports.service.js";

export type ReportsRpcContext = {
  request: IncomingMessage;
} & AuthEnrichedContext;

export type CreateReportsRpcRouterInput = {
  reportsService: Pick<ReportsService, "exportOperationalReport">;
  authMiddleware: RpcAuthMiddleware;
};

export function createReportsRpcRouter(deps: CreateReportsRpcRouterInput) {
  const reportsRpc = os.$context<ReportsRpcContext>().use(deps.authMiddleware);

  return reportsRpc.router({
    reports: {
      export: reportsRpc
        .meta(reportExportMetadata)
        .route({ method: "GET", path: "/reports/export" })
        .input(reportExportInputSchema)
        .output(reportExportOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.reportsService.exportOperationalReport({
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

export type ReportsRpcRouter = ReturnType<typeof createReportsRpcRouter>;
