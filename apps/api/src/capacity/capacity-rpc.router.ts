import type { IncomingMessage } from "node:http";
import { ForbiddenException } from "@nestjs/common";
import { os } from "@orpc/server";
import {
  capacityAdvisoryDecisionAnalyticsInputSchema,
  capacityAdvisoryDecisionAnalyticsMetadata,
  capacityAdvisoryDecisionAnalyticsOutputSchema,
  capacityAdvisoryDecisionRecordInputSchema,
  capacityAdvisoryDecisionRecordMetadata,
  capacityAdvisoryDecisionRecordOutputSchema,
  capacityAdvisoryInputSchema,
  capacityAdvisoryMetadata,
  capacityAdvisoryOutputSchema,
  capacityOverviewInputSchema,
  capacityOverviewMetadata,
  capacityOverviewOutputSchema,
  capacityResourceRegisterInputSchema,
  capacityResourceRegisterMetadata,
  capacityResourceRegisterOutputSchema,
  capacitySlotCancelInputSchema,
  capacitySlotCancelMetadata,
  capacitySlotCancelOutputSchema,
  capacitySlotOpenInputSchema,
  capacitySlotOpenMetadata,
  capacitySlotOpenOutputSchema,
  capacitySlotReserveInputSchema,
  capacitySlotReserveMetadata,
  capacitySlotReserveOutputSchema,
} from "@saptm/rpc";

import type { RpcRequestWithAuthContext } from "../rpc/rpc-context.js";
import type { RpcContextService } from "../rpc/rpc-context.service.js";
import type { CapacityService } from "./capacity.service.js";

export type CapacityRpcContext = {
  request: IncomingMessage & RpcRequestWithAuthContext;
};

export type CreateCapacityRpcRouterInput = {
  capacityService: Pick<
    CapacityService,
    | "cancelSlotReservation"
    | "getAdvisory"
    | "getAdvisoryDecisionAnalytics"
    | "getOverview"
    | "openSlot"
    | "recordAdvisoryDecision"
    | "registerResource"
    | "reserveSlot"
  >;
  rpcContextService: Pick<RpcContextService, "authorizeRequest">;
};

const capacityRpc = os.$context<CapacityRpcContext>();

export function createCapacityRpcRouter(deps: CreateCapacityRpcRouterInput) {
  return capacityRpc.router({
    capacity: {
      overview: capacityRpc
        .meta(capacityOverviewMetadata)
        .route({ method: "GET", path: "/capacity/overview" })
        .input(capacityOverviewInputSchema)
        .output(capacityOverviewOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            capacityOverviewMetadata,
          );
          const organizationId = authorizedContext.authContext?.organizationId;

          if (organizationId === undefined) {
            throw new ForbiddenException("capacity.organization_required");
          }

          return deps.capacityService.getOverview({
            organizationId,
            limit: input.limit,
          });
        }),
      advisory: capacityRpc
        .meta(capacityAdvisoryMetadata)
        .route({ method: "GET", path: "/capacity/advisory" })
        .input(capacityAdvisoryInputSchema)
        .output(capacityAdvisoryOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            capacityAdvisoryMetadata,
          );
          const organizationId = authorizedContext.authContext?.organizationId;

          if (organizationId === undefined) {
            throw new ForbiddenException("capacity.organization_required");
          }

          return deps.capacityService.getAdvisory({
            organizationId,
            limit: input.limit,
          });
        }),
      advisoryDecisionAnalytics: capacityRpc
        .meta(capacityAdvisoryDecisionAnalyticsMetadata)
        .route({ method: "GET", path: "/capacity/advisoryDecisionAnalytics" })
        .input(capacityAdvisoryDecisionAnalyticsInputSchema)
        .output(capacityAdvisoryDecisionAnalyticsOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            capacityAdvisoryDecisionAnalyticsMetadata,
          );
          const organizationId = authorizedContext.authContext?.organizationId;

          if (organizationId === undefined) {
            throw new ForbiddenException("capacity.organization_required");
          }

          return deps.capacityService.getAdvisoryDecisionAnalytics({
            organizationId,
            limit: input.limit,
            windowDays: input.windowDays,
          });
        }),
      registerResource: capacityRpc
        .meta(capacityResourceRegisterMetadata)
        .route({ method: "POST", path: "/capacity/registerResource" })
        .input(capacityResourceRegisterInputSchema)
        .output(capacityResourceRegisterOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            capacityResourceRegisterMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("capacity.organization_required");
          }

          const userAgent = readRequestHeader(context.request, "user-agent");
          const ipAddress = readRequestIp(context.request);

          return deps.capacityService.registerResource({
            ...input,
            organizationId,
            actorId: authContext.actorId,
            actorType: authContext.actorType,
            correlationId: authContext.correlationId,
            ...(userAgent === undefined ? {} : { userAgent }),
            ...(ipAddress === undefined ? {} : { ipAddress }),
          });
        }),
      openSlot: capacityRpc
        .meta(capacitySlotOpenMetadata)
        .route({ method: "POST", path: "/capacity/openSlot" })
        .input(capacitySlotOpenInputSchema)
        .output(capacitySlotOpenOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            capacitySlotOpenMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("capacity.organization_required");
          }

          const userAgent = readRequestHeader(context.request, "user-agent");
          const ipAddress = readRequestIp(context.request);

          return deps.capacityService.openSlot({
            ...input,
            organizationId,
            actorId: authContext.actorId,
            actorType: authContext.actorType,
            correlationId: authContext.correlationId,
            ...(userAgent === undefined ? {} : { userAgent }),
            ...(ipAddress === undefined ? {} : { ipAddress }),
          });
        }),
      reserveSlot: capacityRpc
        .meta(capacitySlotReserveMetadata)
        .route({ method: "POST", path: "/capacity/reserveSlot" })
        .input(capacitySlotReserveInputSchema)
        .output(capacitySlotReserveOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            capacitySlotReserveMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("capacity.organization_required");
          }

          const userAgent = readRequestHeader(context.request, "user-agent");
          const ipAddress = readRequestIp(context.request);

          return deps.capacityService.reserveSlot({
            ...input,
            organizationId,
            actorId: authContext.actorId,
            actorType: authContext.actorType,
            correlationId: authContext.correlationId,
            ...(userAgent === undefined ? {} : { userAgent }),
            ...(ipAddress === undefined ? {} : { ipAddress }),
          });
        }),
      cancelSlotReservation: capacityRpc
        .meta(capacitySlotCancelMetadata)
        .route({ method: "POST", path: "/capacity/cancelSlotReservation" })
        .input(capacitySlotCancelInputSchema)
        .output(capacitySlotCancelOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            capacitySlotCancelMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("capacity.organization_required");
          }

          const userAgent = readRequestHeader(context.request, "user-agent");
          const ipAddress = readRequestIp(context.request);

          return deps.capacityService.cancelSlotReservation({
            ...input,
            organizationId,
            actorId: authContext.actorId,
            actorType: authContext.actorType,
            correlationId: authContext.correlationId,
            ...(userAgent === undefined ? {} : { userAgent }),
            ...(ipAddress === undefined ? {} : { ipAddress }),
          });
        }),
      recordAdvisoryDecision: capacityRpc
        .meta(capacityAdvisoryDecisionRecordMetadata)
        .route({ method: "POST", path: "/capacity/recordAdvisoryDecision" })
        .input(capacityAdvisoryDecisionRecordInputSchema)
        .output(capacityAdvisoryDecisionRecordOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            capacityAdvisoryDecisionRecordMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("capacity.organization_required");
          }

          const userAgent = readRequestHeader(context.request, "user-agent");
          const ipAddress = readRequestIp(context.request);

          return deps.capacityService.recordAdvisoryDecision({
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

export type CapacityRpcRouter = ReturnType<typeof createCapacityRpcRouter>;

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
