import type { IncomingMessage } from "node:http";
import { ForbiddenException } from "@nestjs/common";
import { os } from "@orpc/server";
import {
  type ReportExportDomain,
  reportExportInputSchema,
  reportExportMetadata,
  reportExportOutputSchema,
} from "@saptm/rpc";

import type { RpcRequestWithAuthContext } from "../rpc/rpc-context.js";
import type { RpcContextService } from "../rpc/rpc-context.service.js";
import type { ReportsService } from "./reports.service.js";

const domainPermission: Record<ReportExportDomain, string> = {
  tracking: "tracking.shipment.read",
  cargo: "cargo.read",
  capacity: "capacity.read",
  planning: "planning.order.read",
  tariff: "tariff.read",
};

export type ReportsRpcContext = {
  request: IncomingMessage & RpcRequestWithAuthContext;
};

export type CreateReportsRpcRouterInput = {
  reportsService: Pick<ReportsService, "exportOperationalReport">;
  rpcContextService: Pick<RpcContextService, "authorizeRequest">;
};

const reportsRpc = os.$context<ReportsRpcContext>();

export function createReportsRpcRouter(deps: CreateReportsRpcRouterInput) {
  return reportsRpc.router({
    reports: {
      export: reportsRpc
        .meta(reportExportMetadata)
        .route({ method: "GET", path: "/reports/export" })
        .input(reportExportInputSchema)
        .output(reportExportOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            reportExportMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("reports.organization_required");
          }

          const requiredPermission = domainPermission[input.domain];

          if (!(authContext.permissions as readonly string[]).includes(requiredPermission)) {
            throw new ForbiddenException("reports.permission_denied");
          }

          const userAgent = readRequestHeader(context.request, "user-agent");
          const ipAddress = readRequestIp(context.request);

          return deps.reportsService.exportOperationalReport({
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

export type ReportsRpcRouter = ReturnType<typeof createReportsRpcRouter>;

function readRequestHeader(
  request: IncomingMessage & RpcRequestWithAuthContext,
  name: string,
): string | undefined {
  const value = request.headers[name] ?? request.headers[name.toLowerCase()];

  if (Array.isArray(value)) {
    return value.at(0);
  }

  return value;
}

function readRequestIp(request: IncomingMessage & RpcRequestWithAuthContext): string | undefined {
  return readRequestHeader(request, "x-forwarded-for")?.split(",").at(0)?.trim();
}
