import type { IncomingMessage } from "node:http";
import { ForbiddenException } from "@nestjs/common";
import { os } from "@orpc/server";
import {
  exceptionOverviewInputSchema,
  exceptionOverviewMetadata,
  exceptionOverviewOutputSchema,
  trackingAdvisoryInputSchema,
  trackingAdvisoryMetadata,
  trackingAdvisoryOutputSchema,
  trackingAnalyticsInputSchema,
  trackingAnalyticsMetadata,
  trackingAnalyticsOutputSchema,
  trackingEventRecordInputSchema,
  trackingEventRecordMetadata,
  trackingEventRecordOutputSchema,
  trackingExceptionManageInputSchema,
  trackingExceptionManageMetadata,
  trackingExceptionManageOutputSchema,
  trackingExceptionResolveInputSchema,
  trackingExceptionResolveMetadata,
  trackingExceptionResolveOutputSchema,
  trackingOverviewInputSchema,
  trackingOverviewMetadata,
  trackingOverviewOutputSchema,
  trackingShipmentDetailInputSchema,
  trackingShipmentDetailMetadata,
  trackingShipmentDetailOutputSchema,
} from "@saptm/rpc";

import type { OverviewService } from "../overview/overview.service.js";
import type { RpcRequestWithAuthContext } from "../rpc/rpc-context.js";
import type { RpcContextService } from "../rpc/rpc-context.service.js";
import type { TrackingService } from "./tracking.service.js";

export type TrackingRpcContext = {
  request: IncomingMessage & RpcRequestWithAuthContext;
};

export type CreateTrackingRpcRouterInput = {
  trackingService: Pick<
    TrackingService,
    | "getAnalytics"
    | "getAdvisory"
    | "getOverview"
    | "getShipmentDetail"
    | "manageException"
    | "recordEvent"
    | "resolveException"
  >;
  overviewService: Pick<OverviewService, "getExceptionOverview">;
  rpcContextService: Pick<RpcContextService, "authorizeRequest">;
};

const trackingRpc = os.$context<TrackingRpcContext>();

export function createTrackingRpcRouter(deps: CreateTrackingRpcRouterInput) {
  return trackingRpc.router({
    tracking: {
      overview: trackingRpc
        .meta(trackingOverviewMetadata)
        .route({ method: "GET", path: "/tracking/overview" })
        .input(trackingOverviewInputSchema)
        .output(trackingOverviewOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            trackingOverviewMetadata,
          );
          const organizationId = authorizedContext.authContext?.organizationId;

          if (organizationId === undefined) {
            throw new ForbiddenException("tracking.organization_required");
          }

          return deps.trackingService.getOverview({
            organizationId,
            limit: input.limit,
            offset: input.offset,
            ...(input.teamId === undefined ? {} : { teamId: input.teamId }),
          });
        }),
      exceptionOverview: trackingRpc
        .meta(exceptionOverviewMetadata)
        .route({ method: "GET", path: "/tracking/exceptionOverview" })
        .input(exceptionOverviewInputSchema)
        .output(exceptionOverviewOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            exceptionOverviewMetadata,
          );
          const organizationId = authorizedContext.authContext?.organizationId;

          if (organizationId === undefined) {
            throw new ForbiddenException("tracking.organization_required");
          }

          return deps.overviewService.getExceptionOverview({
            organizationId,
            limit: input.limit,
            offset: input.offset,
          });
        }),
      analytics: trackingRpc
        .meta(trackingAnalyticsMetadata)
        .route({ method: "GET", path: "/tracking/analytics" })
        .input(trackingAnalyticsInputSchema)
        .output(trackingAnalyticsOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            trackingAnalyticsMetadata,
          );
          const organizationId = authorizedContext.authContext?.organizationId;

          if (organizationId === undefined) {
            throw new ForbiddenException("tracking.organization_required");
          }

          return deps.trackingService.getAnalytics({
            organizationId,
            lookbackDays: input.lookbackDays,
          });
        }),
      advisory: trackingRpc
        .meta(trackingAdvisoryMetadata)
        .route({ method: "GET", path: "/tracking/advisory" })
        .input(trackingAdvisoryInputSchema)
        .output(trackingAdvisoryOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            trackingAdvisoryMetadata,
          );
          const organizationId = authorizedContext.authContext?.organizationId;

          if (organizationId === undefined) {
            throw new ForbiddenException("tracking.organization_required");
          }

          return deps.trackingService.getAdvisory({
            organizationId,
            limit: input.limit,
          });
        }),
      events: trackingRpc
        .meta(trackingEventRecordMetadata)
        .route({ method: "POST", path: "/tracking/events" })
        .input(trackingEventRecordInputSchema)
        .output(trackingEventRecordOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            trackingEventRecordMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("tracking.organization_required");
          }

          const userAgent = readRequestHeader(context.request, "user-agent");
          const ipAddress = readRequestIp(context.request);

          return deps.trackingService.recordEvent({
            shipmentId: input.shipmentId,
            eventType: input.eventType,
            occurredAt: input.occurredAt,
            sourceSystem: input.sourceSystem,
            idempotencyKey: input.idempotencyKey,
            organizationId,
            actorId: authContext.actorId,
            actorType: authContext.actorType,
            correlationId: authContext.correlationId,
            ...(input.locationName === undefined ? {} : { locationName: input.locationName }),
            ...(input.notes === undefined ? {} : { notes: input.notes }),
            ...(input.payload === undefined ? {} : { payload: input.payload }),
            ...(userAgent === undefined ? {} : { userAgent }),
            ...(ipAddress === undefined ? {} : { ipAddress }),
          });
        }),
      shipmentDetail: trackingRpc
        .meta(trackingShipmentDetailMetadata)
        .route({ method: "GET", path: "/tracking/shipmentDetail" })
        .input(trackingShipmentDetailInputSchema)
        .output(trackingShipmentDetailOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            trackingShipmentDetailMetadata,
          );
          const organizationId = authorizedContext.authContext?.organizationId;

          if (organizationId === undefined) {
            throw new ForbiddenException("tracking.organization_required");
          }

          return deps.trackingService.getShipmentDetail({
            organizationId,
            shipmentId: input.shipmentId,
            eventLimit: input.eventLimit,
          });
        }),
      exceptions: trackingRpc
        .meta(trackingExceptionManageMetadata)
        .route({ method: "POST", path: "/tracking/exceptions" })
        .input(trackingExceptionManageInputSchema)
        .output(trackingExceptionManageOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            trackingExceptionManageMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("tracking.organization_required");
          }

          const userAgent = readRequestHeader(context.request, "user-agent");
          const ipAddress = readRequestIp(context.request);

          return deps.trackingService.manageException({
            shipmentId: input.shipmentId,
            category: input.category,
            severity: input.severity,
            summary: input.summary,
            recoveryPlan: input.recoveryPlan,
            occurredAt: input.occurredAt,
            sourceSystem: input.sourceSystem,
            idempotencyKey: input.idempotencyKey,
            evidence: {
              ...input.evidence,
              approvalReference: input.evidence.approvalReference ?? null,
              approverName: input.evidence.approverName ?? null,
            },
            organizationId,
            actorId: authContext.actorId,
            actorType: authContext.actorType,
            correlationId: authContext.correlationId,
            ...(input.ownerTeam === undefined ? {} : { ownerTeam: input.ownerTeam }),
            ...(input.expectedResolutionAt === undefined
              ? {}
              : { expectedResolutionAt: input.expectedResolutionAt }),
            ...(input.locationName === undefined ? {} : { locationName: input.locationName }),
            ...(input.payload === undefined ? {} : { payload: input.payload }),
            ...(userAgent === undefined ? {} : { userAgent }),
            ...(ipAddress === undefined ? {} : { ipAddress }),
          });
        }),
      exceptionResolution: trackingRpc
        .meta(trackingExceptionResolveMetadata)
        .route({ method: "POST", path: "/tracking/exceptionResolution" })
        .input(trackingExceptionResolveInputSchema)
        .output(trackingExceptionResolveOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            trackingExceptionResolveMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("tracking.organization_required");
          }

          const userAgent = readRequestHeader(context.request, "user-agent");
          const ipAddress = readRequestIp(context.request);

          return deps.trackingService.resolveException({
            shipmentId: input.shipmentId,
            occurredAt: input.occurredAt,
            idempotencyKey: input.idempotencyKey,
            resolutionCode: input.resolutionCode,
            summary: input.summary,
            nextStatus: input.nextStatus,
            evidence: input.evidence,
            sourceSystem: input.sourceSystem,
            organizationId,
            actorId: authContext.actorId,
            actorType: authContext.actorType,
            correlationId: authContext.correlationId,
            ...(input.ownerTeam === undefined ? {} : { ownerTeam: input.ownerTeam }),
            ...(input.locationName === undefined ? {} : { locationName: input.locationName }),
            ...(input.payload === undefined ? {} : { payload: input.payload }),
            ...(userAgent === undefined ? {} : { userAgent }),
            ...(ipAddress === undefined ? {} : { ipAddress }),
          });
        }),
    },
  });
}

export type TrackingRpcRouter = ReturnType<typeof createTrackingRpcRouter>;

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
