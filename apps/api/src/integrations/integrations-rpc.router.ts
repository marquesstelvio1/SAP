import type { IncomingMessage } from "node:http";
import { ForbiddenException } from "@nestjs/common";
import { os } from "@orpc/server";
import {
  integrationCarrierTmsMovementInputSchema,
  integrationCarrierTmsMovementMetadata,
  integrationCarrierTmsMovementOutputSchema,
  integrationCustomsErpStatusInputSchema,
  integrationCustomsErpStatusMetadata,
  integrationCustomsErpStatusOutputSchema,
  integrationEventRecordInputSchema,
  integrationEventRecordMetadata,
  integrationEventRecordOutputSchema,
  integrationOverviewInputSchema,
  integrationOverviewMetadata,
  integrationOverviewOutputSchema,
  integrationPortTosMovementInputSchema,
  integrationPortTosMovementMetadata,
  integrationPortTosMovementOutputSchema,
  integrationRailTmsMovementInputSchema,
  integrationRailTmsMovementMetadata,
  integrationRailTmsMovementOutputSchema,
  integrationServiceAccountCreateInputSchema,
  integrationServiceAccountCreateMetadata,
  integrationServiceAccountCreateOutputSchema,
  integrationTelematicsGpsPositionInputSchema,
  integrationTelematicsGpsPositionMetadata,
  integrationTelematicsGpsPositionOutputSchema,
  integrationWarehouseWmsActivityInputSchema,
  integrationWarehouseWmsActivityMetadata,
  integrationWarehouseWmsActivityOutputSchema,
} from "@saptm/rpc";

import type { RpcRequestWithAuthContext } from "../rpc/rpc-context.js";
import type { RpcContextService } from "../rpc/rpc-context.service.js";
import type { IntegrationsService } from "./integrations.service.js";

export type IntegrationsRpcContext = {
  request: IncomingMessage & RpcRequestWithAuthContext;
};

export type CreateIntegrationsRpcRouterInput = {
  integrationsService: Pick<
    IntegrationsService,
    | "createServiceAccount"
    | "getOverview"
    | "processCarrierTmsMovement"
    | "processCustomsErpStatus"
    | "processPortTosMovement"
    | "processRailTmsMovement"
    | "processTelematicsGpsPosition"
    | "processWarehouseWmsActivity"
    | "recordEvent"
  >;
  rpcContextService: Pick<RpcContextService, "authorizeRequest">;
};

const integrationsRpc = os.$context<IntegrationsRpcContext>();

export function createIntegrationsRpcRouter(deps: CreateIntegrationsRpcRouterInput) {
  return integrationsRpc.router({
    integrations: {
      overview: integrationsRpc
        .meta(integrationOverviewMetadata)
        .route({ method: "GET", path: "/integrations/overview" })
        .input(integrationOverviewInputSchema)
        .output(integrationOverviewOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            integrationOverviewMetadata,
          );
          const organizationId = authorizedContext.authContext?.organizationId;

          if (organizationId === undefined) {
            throw new ForbiddenException("integration.organization_required");
          }

          return deps.integrationsService.getOverview({
            organizationId,
            limit: input.limit,
          });
        }),
      createServiceAccount: integrationsRpc
        .meta(integrationServiceAccountCreateMetadata)
        .route({ method: "POST", path: "/integrations/createServiceAccount" })
        .input(integrationServiceAccountCreateInputSchema)
        .output(integrationServiceAccountCreateOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            integrationServiceAccountCreateMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("integration.organization_required");
          }

          const userAgent = readRequestHeader(context.request, "user-agent");
          const ipAddress = readRequestIp(context.request);

          return deps.integrationsService.createServiceAccount({
            ...input,
            organizationId,
            actorId: authContext.actorId,
            actorType: authContext.actorType,
            correlationId: authContext.correlationId,
            ...(userAgent === undefined ? {} : { userAgent }),
            ...(ipAddress === undefined ? {} : { ipAddress }),
          });
        }),
      recordEvent: integrationsRpc
        .meta(integrationEventRecordMetadata)
        .route({ method: "POST", path: "/integrations/recordEvent" })
        .input(integrationEventRecordInputSchema)
        .output(integrationEventRecordOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            integrationEventRecordMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("integration.organization_required");
          }

          const userAgent = readRequestHeader(context.request, "user-agent");
          const ipAddress = readRequestIp(context.request);

          return deps.integrationsService.recordEvent({
            ...input,
            organizationId,
            actorId: authContext.actorId,
            actorType: authContext.actorType,
            correlationId: authContext.correlationId,
            ...(userAgent === undefined ? {} : { userAgent }),
            ...(ipAddress === undefined ? {} : { ipAddress }),
          });
        }),
      processPortTosMovement: integrationsRpc
        .meta(integrationPortTosMovementMetadata)
        .route({ method: "POST", path: "/integrations/processPortTosMovement" })
        .input(integrationPortTosMovementInputSchema)
        .output(integrationPortTosMovementOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            integrationPortTosMovementMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("integration.organization_required");
          }

          const userAgent = readRequestHeader(context.request, "user-agent");
          const ipAddress = readRequestIp(context.request);

          return deps.integrationsService.processPortTosMovement({
            ...input,
            organizationId,
            actorId: authContext.actorId,
            actorType: authContext.actorType,
            correlationId: authContext.correlationId,
            ...(userAgent === undefined ? {} : { userAgent }),
            ...(ipAddress === undefined ? {} : { ipAddress }),
          });
        }),
      processRailTmsMovement: integrationsRpc
        .meta(integrationRailTmsMovementMetadata)
        .route({ method: "POST", path: "/integrations/processRailTmsMovement" })
        .input(integrationRailTmsMovementInputSchema)
        .output(integrationRailTmsMovementOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            integrationRailTmsMovementMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("integration.organization_required");
          }

          const userAgent = readRequestHeader(context.request, "user-agent");
          const ipAddress = readRequestIp(context.request);

          return deps.integrationsService.processRailTmsMovement({
            ...input,
            organizationId,
            actorId: authContext.actorId,
            actorType: authContext.actorType,
            correlationId: authContext.correlationId,
            ...(userAgent === undefined ? {} : { userAgent }),
            ...(ipAddress === undefined ? {} : { ipAddress }),
          });
        }),
      processCarrierTmsMovement: integrationsRpc
        .meta(integrationCarrierTmsMovementMetadata)
        .route({ method: "POST", path: "/integrations/processCarrierTmsMovement" })
        .input(integrationCarrierTmsMovementInputSchema)
        .output(integrationCarrierTmsMovementOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            integrationCarrierTmsMovementMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("integration.organization_required");
          }

          const userAgent = readRequestHeader(context.request, "user-agent");
          const ipAddress = readRequestIp(context.request);

          return deps.integrationsService.processCarrierTmsMovement({
            ...input,
            organizationId,
            actorId: authContext.actorId,
            actorType: authContext.actorType,
            correlationId: authContext.correlationId,
            ...(userAgent === undefined ? {} : { userAgent }),
            ...(ipAddress === undefined ? {} : { ipAddress }),
          });
        }),
      processTelematicsGpsPosition: integrationsRpc
        .meta(integrationTelematicsGpsPositionMetadata)
        .route({ method: "POST", path: "/integrations/processTelematicsGpsPosition" })
        .input(integrationTelematicsGpsPositionInputSchema)
        .output(integrationTelematicsGpsPositionOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            integrationTelematicsGpsPositionMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("integration.organization_required");
          }

          const userAgent = readRequestHeader(context.request, "user-agent");
          const ipAddress = readRequestIp(context.request);

          return deps.integrationsService.processTelematicsGpsPosition({
            ...input,
            organizationId,
            actorId: authContext.actorId,
            actorType: authContext.actorType,
            correlationId: authContext.correlationId,
            ...(userAgent === undefined ? {} : { userAgent }),
            ...(ipAddress === undefined ? {} : { ipAddress }),
          });
        }),
      processCustomsErpStatus: integrationsRpc
        .meta(integrationCustomsErpStatusMetadata)
        .route({ method: "POST", path: "/integrations/processCustomsErpStatus" })
        .input(integrationCustomsErpStatusInputSchema)
        .output(integrationCustomsErpStatusOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            integrationCustomsErpStatusMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("integration.organization_required");
          }

          const userAgent = readRequestHeader(context.request, "user-agent");
          const ipAddress = readRequestIp(context.request);

          return deps.integrationsService.processCustomsErpStatus({
            ...input,
            organizationId,
            actorId: authContext.actorId,
            actorType: authContext.actorType,
            correlationId: authContext.correlationId,
            ...(userAgent === undefined ? {} : { userAgent }),
            ...(ipAddress === undefined ? {} : { ipAddress }),
          });
        }),
      processWarehouseWmsActivity: integrationsRpc
        .meta(integrationWarehouseWmsActivityMetadata)
        .route({ method: "POST", path: "/integrations/processWarehouseWmsActivity" })
        .input(integrationWarehouseWmsActivityInputSchema)
        .output(integrationWarehouseWmsActivityOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            integrationWarehouseWmsActivityMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("integration.organization_required");
          }

          const userAgent = readRequestHeader(context.request, "user-agent");
          const ipAddress = readRequestIp(context.request);

          return deps.integrationsService.processWarehouseWmsActivity({
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
