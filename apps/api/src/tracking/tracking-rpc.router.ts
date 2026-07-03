import type { IncomingMessage } from "node:http";
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
import type { AuthEnrichedContext, RpcAuthMiddleware } from "../rpc/rpc-auth.middleware.js";
import type { TrackingService } from "./tracking.service.js";

export type TrackingRpcContext = {
  request: IncomingMessage;
} & AuthEnrichedContext;

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
  authMiddleware: RpcAuthMiddleware;
};

export function createTrackingRpcRouter(deps: CreateTrackingRpcRouterInput) {
  const trackingRpc = os.$context<TrackingRpcContext>().use(deps.authMiddleware);

  return trackingRpc.router({
    tracking: {
      overview: trackingRpc
        .meta(trackingOverviewMetadata)
        .route({ method: "GET", path: "/tracking/overview" })
        .input(trackingOverviewInputSchema)
        .output(trackingOverviewOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.trackingService.getOverview({
            organizationId: context.organizationId,
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
          return deps.overviewService.getExceptionOverview({
            organizationId: context.organizationId,
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
          return deps.trackingService.getAnalytics({
            organizationId: context.organizationId,
            lookbackDays: input.lookbackDays,
          });
        }),
      advisory: trackingRpc
        .meta(trackingAdvisoryMetadata)
        .route({ method: "GET", path: "/tracking/advisory" })
        .input(trackingAdvisoryInputSchema)
        .output(trackingAdvisoryOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.trackingService.getAdvisory({
            organizationId: context.organizationId,
            limit: input.limit,
          });
        }),
      events: trackingRpc
        .meta(trackingEventRecordMetadata)
        .route({ method: "POST", path: "/tracking/events" })
        .input(trackingEventRecordInputSchema)
        .output(trackingEventRecordOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.trackingService.recordEvent({
            shipmentId: input.shipmentId,
            eventType: input.eventType,
            occurredAt: input.occurredAt,
            sourceSystem: input.sourceSystem,
            idempotencyKey: input.idempotencyKey,
            organizationId: context.organizationId,
            actorId: context.actorId,
            actorType: context.actorType,
            correlationId: context.correlationId,
            ...(input.locationName === undefined ? {} : { locationName: input.locationName }),
            ...(input.notes === undefined ? {} : { notes: input.notes }),
            ...(input.payload === undefined ? {} : { payload: input.payload }),
            ...(context.userAgent === undefined ? {} : { userAgent: context.userAgent }),
            ...(context.ipAddress === undefined ? {} : { ipAddress: context.ipAddress }),
          });
        }),
      shipmentDetail: trackingRpc
        .meta(trackingShipmentDetailMetadata)
        .route({ method: "GET", path: "/tracking/shipmentDetail" })
        .input(trackingShipmentDetailInputSchema)
        .output(trackingShipmentDetailOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.trackingService.getShipmentDetail({
            organizationId: context.organizationId,
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
            organizationId: context.organizationId,
            actorId: context.actorId,
            actorType: context.actorType,
            correlationId: context.correlationId,
            ...(input.ownerTeam === undefined ? {} : { ownerTeam: input.ownerTeam }),
            ...(input.expectedResolutionAt === undefined
              ? {}
              : { expectedResolutionAt: input.expectedResolutionAt }),
            ...(input.locationName === undefined ? {} : { locationName: input.locationName }),
            ...(input.payload === undefined ? {} : { payload: input.payload }),
            ...(context.userAgent === undefined ? {} : { userAgent: context.userAgent }),
            ...(context.ipAddress === undefined ? {} : { ipAddress: context.ipAddress }),
          });
        }),
      exceptionResolution: trackingRpc
        .meta(trackingExceptionResolveMetadata)
        .route({ method: "POST", path: "/tracking/exceptionResolution" })
        .input(trackingExceptionResolveInputSchema)
        .output(trackingExceptionResolveOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.trackingService.resolveException({
            shipmentId: input.shipmentId,
            occurredAt: input.occurredAt,
            idempotencyKey: input.idempotencyKey,
            resolutionCode: input.resolutionCode,
            summary: input.summary,
            nextStatus: input.nextStatus,
            evidence: input.evidence,
            sourceSystem: input.sourceSystem,
            organizationId: context.organizationId,
            actorId: context.actorId,
            actorType: context.actorType,
            correlationId: context.correlationId,
            ...(input.ownerTeam === undefined ? {} : { ownerTeam: input.ownerTeam }),
            ...(input.locationName === undefined ? {} : { locationName: input.locationName }),
            ...(input.payload === undefined ? {} : { payload: input.payload }),
            ...(context.userAgent === undefined ? {} : { userAgent: context.userAgent }),
            ...(context.ipAddress === undefined ? {} : { ipAddress: context.ipAddress }),
          });
        }),
    },
  });
}

export type TrackingRpcRouter = ReturnType<typeof createTrackingRpcRouter>;
