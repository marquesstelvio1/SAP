import type { IncomingMessage } from "node:http";
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

import type { AuthEnrichedContext, RpcAuthMiddleware } from "../rpc/rpc-auth.middleware.js";
import type { CapacityService } from "./capacity.service.js";

export type CapacityRpcContext = {
  request: IncomingMessage;
} & AuthEnrichedContext;

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
  authMiddleware: RpcAuthMiddleware;
};

export function createCapacityRpcRouter(deps: CreateCapacityRpcRouterInput) {
  const capacityRpc = os.$context<CapacityRpcContext>().use(deps.authMiddleware);

  return capacityRpc.router({
    capacity: {
      overview: capacityRpc
        .meta(capacityOverviewMetadata)
        .route({ method: "GET", path: "/capacity/overview" })
        .input(capacityOverviewInputSchema)
        .output(capacityOverviewOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.capacityService.getOverview({
            organizationId: context.organizationId,
            limit: input.limit,
          });
        }),
      advisory: capacityRpc
        .meta(capacityAdvisoryMetadata)
        .route({ method: "GET", path: "/capacity/advisory" })
        .input(capacityAdvisoryInputSchema)
        .output(capacityAdvisoryOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.capacityService.getAdvisory({
            organizationId: context.organizationId,
            limit: input.limit,
          });
        }),
      advisoryDecisionAnalytics: capacityRpc
        .meta(capacityAdvisoryDecisionAnalyticsMetadata)
        .route({ method: "GET", path: "/capacity/advisoryDecisionAnalytics" })
        .input(capacityAdvisoryDecisionAnalyticsInputSchema)
        .output(capacityAdvisoryDecisionAnalyticsOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.capacityService.getAdvisoryDecisionAnalytics({
            organizationId: context.organizationId,
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
          return deps.capacityService.registerResource({
            ...input,
            organizationId: context.organizationId,
            actorId: context.actorId,
            actorType: context.actorType,
            correlationId: context.correlationId,
            ...(context.userAgent === undefined ? {} : { userAgent: context.userAgent }),
            ...(context.ipAddress === undefined ? {} : { ipAddress: context.ipAddress }),
          });
        }),
      openSlot: capacityRpc
        .meta(capacitySlotOpenMetadata)
        .route({ method: "POST", path: "/capacity/openSlot" })
        .input(capacitySlotOpenInputSchema)
        .output(capacitySlotOpenOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.capacityService.openSlot({
            ...input,
            organizationId: context.organizationId,
            actorId: context.actorId,
            actorType: context.actorType,
            correlationId: context.correlationId,
            ...(context.userAgent === undefined ? {} : { userAgent: context.userAgent }),
            ...(context.ipAddress === undefined ? {} : { ipAddress: context.ipAddress }),
          });
        }),
      reserveSlot: capacityRpc
        .meta(capacitySlotReserveMetadata)
        .route({ method: "POST", path: "/capacity/reserveSlot" })
        .input(capacitySlotReserveInputSchema)
        .output(capacitySlotReserveOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.capacityService.reserveSlot({
            ...input,
            organizationId: context.organizationId,
            actorId: context.actorId,
            actorType: context.actorType,
            correlationId: context.correlationId,
            ...(context.userAgent === undefined ? {} : { userAgent: context.userAgent }),
            ...(context.ipAddress === undefined ? {} : { ipAddress: context.ipAddress }),
          });
        }),
      cancelSlotReservation: capacityRpc
        .meta(capacitySlotCancelMetadata)
        .route({ method: "POST", path: "/capacity/cancelSlotReservation" })
        .input(capacitySlotCancelInputSchema)
        .output(capacitySlotCancelOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.capacityService.cancelSlotReservation({
            ...input,
            organizationId: context.organizationId,
            actorId: context.actorId,
            actorType: context.actorType,
            correlationId: context.correlationId,
            ...(context.userAgent === undefined ? {} : { userAgent: context.userAgent }),
            ...(context.ipAddress === undefined ? {} : { ipAddress: context.ipAddress }),
          });
        }),
      recordAdvisoryDecision: capacityRpc
        .meta(capacityAdvisoryDecisionRecordMetadata)
        .route({ method: "POST", path: "/capacity/recordAdvisoryDecision" })
        .input(capacityAdvisoryDecisionRecordInputSchema)
        .output(capacityAdvisoryDecisionRecordOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.capacityService.recordAdvisoryDecision({
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

export type CapacityRpcRouter = ReturnType<typeof createCapacityRpcRouter>;
