import type { IncomingMessage } from "node:http";
import { os } from "@orpc/server";
import {
  cargoClaimSettlementRecordInputSchema,
  cargoClaimSettlementRecordMetadata,
  cargoClaimSettlementRecordOutputSchema,
  cargoComplianceEvidenceRecordInputSchema,
  cargoComplianceEvidenceRecordMetadata,
  cargoComplianceEvidenceRecordOutputSchema,
  cargoComplianceEvidenceVerifyInputSchema,
  cargoComplianceEvidenceVerifyMetadata,
  cargoComplianceEvidenceVerifyOutputSchema,
  cargoDeliveryCompleteInputSchema,
  cargoDeliveryCompleteMetadata,
  cargoDeliveryCompleteOutputSchema,
  cargoDeliveryExceptionRecordInputSchema,
  cargoDeliveryExceptionRecordMetadata,
  cargoDeliveryExceptionRecordOutputSchema,
  cargoDeliveryExceptionResolveInputSchema,
  cargoDeliveryExceptionResolveMetadata,
  cargoDeliveryExceptionResolveOutputSchema,
  cargoOperationalHandoffRecordInputSchema,
  cargoOperationalHandoffRecordMetadata,
  cargoOperationalHandoffRecordOutputSchema,
  cargoOverviewInputSchema,
  cargoOverviewMetadata,
  cargoOverviewOutputSchema,
  cargoRegisterInputSchema,
  cargoRegisterMetadata,
  cargoRegisterOutputSchema,
  cargoReleaseInputSchema,
  cargoReleaseMetadata,
  cargoReleaseOutputSchema,
  cargoTransportArriveInputSchema,
  cargoTransportArriveMetadata,
  cargoTransportArriveOutputSchema,
  cargoTransportDepartInputSchema,
  cargoTransportDepartMetadata,
  cargoTransportDepartOutputSchema,
  cargoTransportPlanInputSchema,
  cargoTransportPlanMetadata,
  cargoTransportPlanOutputSchema,
  complianceOverviewInputSchema,
  complianceOverviewMetadata,
  complianceOverviewOutputSchema,
  deliveryOverviewInputSchema,
  deliveryOverviewMetadata,
  deliveryOverviewOutputSchema,
} from "@saptm/rpc";

import type { OverviewService } from "../overview/overview.service.js";
import type { AuthEnrichedContext } from "../rpc/rpc-auth.middleware.js";
import type { RpcAuthBuilder } from "../rpc/rpc-auth.middleware.js";
import type { CargoService } from "./cargo.service.js";

export type CargoRpcContext = {
  request: IncomingMessage;
} & AuthEnrichedContext;

export type CreateCargoRpcRouterInput = {
  cargoService: Pick<
    CargoService,
    | "departTransport"
    | "arriveTransport"
    | "completeDelivery"
    | "recordDeliveryException"
    | "resolveDeliveryException"
    | "recordOperationalHandoff"
    | "recordClaimSettlement"
    | "getOverview"
    | "planTransport"
    | "recordComplianceEvidence"
    | "registerCargo"
    | "releaseCargo"
    | "verifyComplianceEvidence"
  >;
  overviewService: Pick<OverviewService, "getComplianceOverview" | "getDeliveryOverview">;
  authMiddleware: RpcAuthBuilder;
};

export function createCargoRpcRouter(deps: CreateCargoRpcRouterInput) {
  const cargoRpc = os.$context<CargoRpcContext>().use(deps.authMiddleware);

  return cargoRpc.router({
    cargo: {
      overview: cargoRpc
        .meta(cargoOverviewMetadata)
        .route({ method: "GET", path: "/cargo/overview" })
        .input(cargoOverviewInputSchema)
        .output(cargoOverviewOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.cargoService.getOverview({
            organizationId: context.organizationId,
            limit: input.limit,
            offset: input.offset,
            ...(input.teamId === undefined ? {} : { teamId: input.teamId }),
          });
        }),
      complianceOverview: cargoRpc
        .meta(complianceOverviewMetadata)
        .route({ method: "GET", path: "/cargo/complianceOverview" })
        .input(complianceOverviewInputSchema)
        .output(complianceOverviewOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.overviewService.getComplianceOverview({
            organizationId: context.organizationId,
            limit: input.limit,
            offset: input.offset,
          });
        }),
      deliveryOverview: cargoRpc
        .meta(deliveryOverviewMetadata)
        .route({ method: "GET", path: "/cargo/deliveryOverview" })
        .input(deliveryOverviewInputSchema)
        .output(deliveryOverviewOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.overviewService.getDeliveryOverview({
            organizationId: context.organizationId,
            limit: input.limit,
            offset: input.offset,
          });
        }),
      register: cargoRpc
        .meta(cargoRegisterMetadata)
        .route({ method: "POST", path: "/cargo/register" })
        .input(cargoRegisterInputSchema)
        .output(cargoRegisterOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.cargoService.registerCargo({
            ...input,
            organizationId: context.organizationId,
            actorId: context.actorId,
            actorType: context.actorType,
            correlationId: context.correlationId,
            ...(context.userAgent === undefined ? {} : { userAgent: context.userAgent }),
            ...(context.ipAddress === undefined ? {} : { ipAddress: context.ipAddress }),
          });
        }),
      release: cargoRpc
        .meta(cargoReleaseMetadata)
        .route({ method: "POST", path: "/cargo/release" })
        .input(cargoReleaseInputSchema)
        .output(cargoReleaseOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.cargoService.releaseCargo({
            ...input,
            organizationId: context.organizationId,
            actorId: context.actorId,
            actorType: context.actorType,
            correlationId: context.correlationId,
            ...(context.userAgent === undefined ? {} : { userAgent: context.userAgent }),
            ...(context.ipAddress === undefined ? {} : { ipAddress: context.ipAddress }),
          });
        }),
      planTransport: cargoRpc
        .meta(cargoTransportPlanMetadata)
        .route({ method: "POST", path: "/cargo/planTransport" })
        .input(cargoTransportPlanInputSchema)
        .output(cargoTransportPlanOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.cargoService.planTransport({
            ...input,
            organizationId: context.organizationId,
            actorId: context.actorId,
            actorType: context.actorType,
            correlationId: context.correlationId,
            ...(context.userAgent === undefined ? {} : { userAgent: context.userAgent }),
            ...(context.ipAddress === undefined ? {} : { ipAddress: context.ipAddress }),
          });
        }),
      departTransport: cargoRpc
        .meta(cargoTransportDepartMetadata)
        .route({ method: "POST", path: "/cargo/departTransport" })
        .input(cargoTransportDepartInputSchema)
        .output(cargoTransportDepartOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.cargoService.departTransport({
            ...input,
            organizationId: context.organizationId,
            actorId: context.actorId,
            actorType: context.actorType,
            correlationId: context.correlationId,
            ...(context.userAgent === undefined ? {} : { userAgent: context.userAgent }),
            ...(context.ipAddress === undefined ? {} : { ipAddress: context.ipAddress }),
          });
        }),
      arriveTransport: cargoRpc
        .meta(cargoTransportArriveMetadata)
        .route({ method: "POST", path: "/cargo/arriveTransport" })
        .input(cargoTransportArriveInputSchema)
        .output(cargoTransportArriveOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.cargoService.arriveTransport({
            ...input,
            organizationId: context.organizationId,
            actorId: context.actorId,
            actorType: context.actorType,
            correlationId: context.correlationId,
            ...(context.userAgent === undefined ? {} : { userAgent: context.userAgent }),
            ...(context.ipAddress === undefined ? {} : { ipAddress: context.ipAddress }),
          });
        }),
      completeDelivery: cargoRpc
        .meta(cargoDeliveryCompleteMetadata)
        .route({ method: "POST", path: "/cargo/completeDelivery" })
        .input(cargoDeliveryCompleteInputSchema)
        .output(cargoDeliveryCompleteOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.cargoService.completeDelivery({
            ...input,
            organizationId: context.organizationId,
            actorId: context.actorId,
            actorType: context.actorType,
            correlationId: context.correlationId,
            ...(context.userAgent === undefined ? {} : { userAgent: context.userAgent }),
            ...(context.ipAddress === undefined ? {} : { ipAddress: context.ipAddress }),
          });
        }),
      recordDeliveryException: cargoRpc
        .meta(cargoDeliveryExceptionRecordMetadata)
        .route({ method: "POST", path: "/cargo/recordDeliveryException" })
        .input(cargoDeliveryExceptionRecordInputSchema)
        .output(cargoDeliveryExceptionRecordOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.cargoService.recordDeliveryException({
            ...input,
            organizationId: context.organizationId,
            actorId: context.actorId,
            actorType: context.actorType,
            correlationId: context.correlationId,
            ...(context.userAgent === undefined ? {} : { userAgent: context.userAgent }),
            ...(context.ipAddress === undefined ? {} : { ipAddress: context.ipAddress }),
          });
        }),
      resolveDeliveryException: cargoRpc
        .meta(cargoDeliveryExceptionResolveMetadata)
        .route({ method: "POST", path: "/cargo/resolveDeliveryException" })
        .input(cargoDeliveryExceptionResolveInputSchema)
        .output(cargoDeliveryExceptionResolveOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.cargoService.resolveDeliveryException({
            ...input,
            organizationId: context.organizationId,
            actorId: context.actorId,
            actorType: context.actorType,
            correlationId: context.correlationId,
            ...(context.userAgent === undefined ? {} : { userAgent: context.userAgent }),
            ...(context.ipAddress === undefined ? {} : { ipAddress: context.ipAddress }),
          });
        }),
      recordOperationalHandoff: cargoRpc
        .meta(cargoOperationalHandoffRecordMetadata)
        .route({ method: "POST", path: "/cargo/recordOperationalHandoff" })
        .input(cargoOperationalHandoffRecordInputSchema)
        .output(cargoOperationalHandoffRecordOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.cargoService.recordOperationalHandoff({
            ...input,
            organizationId: context.organizationId,
            actorId: context.actorId,
            actorType: context.actorType,
            correlationId: context.correlationId,
            ...(context.userAgent === undefined ? {} : { userAgent: context.userAgent }),
            ...(context.ipAddress === undefined ? {} : { ipAddress: context.ipAddress }),
          });
        }),
      recordClaimSettlement: cargoRpc
        .meta(cargoClaimSettlementRecordMetadata)
        .route({ method: "POST", path: "/cargo/recordClaimSettlement" })
        .input(cargoClaimSettlementRecordInputSchema)
        .output(cargoClaimSettlementRecordOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.cargoService.recordClaimSettlement({
            ...input,
            organizationId: context.organizationId,
            actorId: context.actorId,
            actorType: context.actorType,
            correlationId: context.correlationId,
            ...(context.userAgent === undefined ? {} : { userAgent: context.userAgent }),
            ...(context.ipAddress === undefined ? {} : { ipAddress: context.ipAddress }),
          });
        }),
      recordComplianceEvidence: cargoRpc
        .meta(cargoComplianceEvidenceRecordMetadata)
        .route({ method: "POST", path: "/cargo/recordComplianceEvidence" })
        .input(cargoComplianceEvidenceRecordInputSchema)
        .output(cargoComplianceEvidenceRecordOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.cargoService.recordComplianceEvidence({
            ...input,
            organizationId: context.organizationId,
            actorId: context.actorId,
            actorType: context.actorType,
            correlationId: context.correlationId,
            ...(context.userAgent === undefined ? {} : { userAgent: context.userAgent }),
            ...(context.ipAddress === undefined ? {} : { ipAddress: context.ipAddress }),
          });
        }),
      verifyComplianceEvidence: cargoRpc
        .meta(cargoComplianceEvidenceVerifyMetadata)
        .route({ method: "POST", path: "/cargo/verifyComplianceEvidence" })
        .input(cargoComplianceEvidenceVerifyInputSchema)
        .output(cargoComplianceEvidenceVerifyOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.cargoService.verifyComplianceEvidence({
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

export type CargoRpcRouter = ReturnType<typeof createCargoRpcRouter>;

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
