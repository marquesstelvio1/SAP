import type { IncomingMessage } from "node:http";
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

import type { AuthEnrichedContext, RpcAuthMiddleware } from "../rpc/rpc-auth.middleware.js";
import type { IntegrationsService } from "./integrations.service.js";

export type IntegrationsRpcContext = {
  request: IncomingMessage;
} & AuthEnrichedContext;

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
  authMiddleware: RpcAuthMiddleware;
};

export function createIntegrationsRpcRouter(deps: CreateIntegrationsRpcRouterInput) {
  const integrationsRpc = os.$context<IntegrationsRpcContext>().use(deps.authMiddleware);

  return integrationsRpc.router({
    integrations: {
      overview: integrationsRpc
        .meta(integrationOverviewMetadata)
        .route({ method: "GET", path: "/integrations/overview" })
        .input(integrationOverviewInputSchema)
        .output(integrationOverviewOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.integrationsService.getOverview({
            organizationId: context.organizationId,
            limit: input.limit,
          });
        }),
      createServiceAccount: integrationsRpc
        .meta(integrationServiceAccountCreateMetadata)
        .route({ method: "POST", path: "/integrations/createServiceAccount" })
        .input(integrationServiceAccountCreateInputSchema)
        .output(integrationServiceAccountCreateOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.integrationsService.createServiceAccount({
            ...input,
            organizationId: context.organizationId,
            actorId: context.actorId,
            actorType: context.actorType,
            correlationId: context.correlationId,
            ...(context.userAgent === undefined ? {} : { userAgent: context.userAgent }),
            ...(context.ipAddress === undefined ? {} : { ipAddress: context.ipAddress }),
          });
        }),
      recordEvent: integrationsRpc
        .meta(integrationEventRecordMetadata)
        .route({ method: "POST", path: "/integrations/recordEvent" })
        .input(integrationEventRecordInputSchema)
        .output(integrationEventRecordOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.integrationsService.recordEvent({
            ...input,
            organizationId: context.organizationId,
            actorId: context.actorId,
            actorType: context.actorType,
            correlationId: context.correlationId,
            ...(context.userAgent === undefined ? {} : { userAgent: context.userAgent }),
            ...(context.ipAddress === undefined ? {} : { ipAddress: context.ipAddress }),
          });
        }),
      processPortTosMovement: integrationsRpc
        .meta(integrationPortTosMovementMetadata)
        .route({ method: "POST", path: "/integrations/processPortTosMovement" })
        .input(integrationPortTosMovementInputSchema)
        .output(integrationPortTosMovementOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.integrationsService.processPortTosMovement({
            ...input,
            organizationId: context.organizationId,
            actorId: context.actorId,
            actorType: context.actorType,
            correlationId: context.correlationId,
            ...(context.userAgent === undefined ? {} : { userAgent: context.userAgent }),
            ...(context.ipAddress === undefined ? {} : { ipAddress: context.ipAddress }),
          });
        }),
      processRailTmsMovement: integrationsRpc
        .meta(integrationRailTmsMovementMetadata)
        .route({ method: "POST", path: "/integrations/processRailTmsMovement" })
        .input(integrationRailTmsMovementInputSchema)
        .output(integrationRailTmsMovementOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.integrationsService.processRailTmsMovement({
            ...input,
            organizationId: context.organizationId,
            actorId: context.actorId,
            actorType: context.actorType,
            correlationId: context.correlationId,
            ...(context.userAgent === undefined ? {} : { userAgent: context.userAgent }),
            ...(context.ipAddress === undefined ? {} : { ipAddress: context.ipAddress }),
          });
        }),
      processCarrierTmsMovement: integrationsRpc
        .meta(integrationCarrierTmsMovementMetadata)
        .route({ method: "POST", path: "/integrations/processCarrierTmsMovement" })
        .input(integrationCarrierTmsMovementInputSchema)
        .output(integrationCarrierTmsMovementOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.integrationsService.processCarrierTmsMovement({
            ...input,
            organizationId: context.organizationId,
            actorId: context.actorId,
            actorType: context.actorType,
            correlationId: context.correlationId,
            ...(context.userAgent === undefined ? {} : { userAgent: context.userAgent }),
            ...(context.ipAddress === undefined ? {} : { ipAddress: context.ipAddress }),
          });
        }),
      processTelematicsGpsPosition: integrationsRpc
        .meta(integrationTelematicsGpsPositionMetadata)
        .route({ method: "POST", path: "/integrations/processTelematicsGpsPosition" })
        .input(integrationTelematicsGpsPositionInputSchema)
        .output(integrationTelematicsGpsPositionOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.integrationsService.processTelematicsGpsPosition({
            ...input,
            organizationId: context.organizationId,
            actorId: context.actorId,
            actorType: context.actorType,
            correlationId: context.correlationId,
            ...(context.userAgent === undefined ? {} : { userAgent: context.userAgent }),
            ...(context.ipAddress === undefined ? {} : { ipAddress: context.ipAddress }),
          });
        }),
      processCustomsErpStatus: integrationsRpc
        .meta(integrationCustomsErpStatusMetadata)
        .route({ method: "POST", path: "/integrations/processCustomsErpStatus" })
        .input(integrationCustomsErpStatusInputSchema)
        .output(integrationCustomsErpStatusOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.integrationsService.processCustomsErpStatus({
            ...input,
            organizationId: context.organizationId,
            actorId: context.actorId,
            actorType: context.actorType,
            correlationId: context.correlationId,
            ...(context.userAgent === undefined ? {} : { userAgent: context.userAgent }),
            ...(context.ipAddress === undefined ? {} : { ipAddress: context.ipAddress }),
          });
        }),
      processWarehouseWmsActivity: integrationsRpc
        .meta(integrationWarehouseWmsActivityMetadata)
        .route({ method: "POST", path: "/integrations/processWarehouseWmsActivity" })
        .input(integrationWarehouseWmsActivityInputSchema)
        .output(integrationWarehouseWmsActivityOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.integrationsService.processWarehouseWmsActivity({
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
