import type { IncomingMessage } from "node:http";
import { ForbiddenException } from "@nestjs/common";
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
} from "@saptm/rpc";

import type { RpcRequestWithAuthContext } from "../rpc/rpc-context.js";
import type { RpcContextService } from "../rpc/rpc-context.service.js";
import type { CargoService } from "./cargo.service.js";

export type CargoRpcContext = {
  request: IncomingMessage & RpcRequestWithAuthContext;
};

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
  rpcContextService: Pick<RpcContextService, "authorizeRequest">;
};

const cargoRpc = os.$context<CargoRpcContext>();

export function createCargoRpcRouter(deps: CreateCargoRpcRouterInput) {
  return cargoRpc.router({
    cargo: {
      overview: cargoRpc
        .meta(cargoOverviewMetadata)
        .route({ method: "GET", path: "/cargo/overview" })
        .input(cargoOverviewInputSchema)
        .output(cargoOverviewOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            cargoOverviewMetadata,
          );
          const organizationId = authorizedContext.authContext?.organizationId;

          if (organizationId === undefined) {
            throw new ForbiddenException("cargo.organization_required");
          }

          return deps.cargoService.getOverview({
            organizationId,
            limit: input.limit,
          });
        }),
      register: cargoRpc
        .meta(cargoRegisterMetadata)
        .route({ method: "POST", path: "/cargo/register" })
        .input(cargoRegisterInputSchema)
        .output(cargoRegisterOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            cargoRegisterMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("cargo.organization_required");
          }

          const userAgent = readRequestHeader(context.request, "user-agent");
          const ipAddress = readRequestIp(context.request);

          return deps.cargoService.registerCargo({
            ...input,
            organizationId,
            actorId: authContext.actorId,
            actorType: authContext.actorType,
            correlationId: authContext.correlationId,
            ...(userAgent === undefined ? {} : { userAgent }),
            ...(ipAddress === undefined ? {} : { ipAddress }),
          });
        }),
      release: cargoRpc
        .meta(cargoReleaseMetadata)
        .route({ method: "POST", path: "/cargo/release" })
        .input(cargoReleaseInputSchema)
        .output(cargoReleaseOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            cargoReleaseMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("cargo.organization_required");
          }

          const userAgent = readRequestHeader(context.request, "user-agent");
          const ipAddress = readRequestIp(context.request);

          return deps.cargoService.releaseCargo({
            ...input,
            organizationId,
            actorId: authContext.actorId,
            actorType: authContext.actorType,
            correlationId: authContext.correlationId,
            ...(userAgent === undefined ? {} : { userAgent }),
            ...(ipAddress === undefined ? {} : { ipAddress }),
          });
        }),
      planTransport: cargoRpc
        .meta(cargoTransportPlanMetadata)
        .route({ method: "POST", path: "/cargo/planTransport" })
        .input(cargoTransportPlanInputSchema)
        .output(cargoTransportPlanOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            cargoTransportPlanMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("cargo.organization_required");
          }

          const userAgent = readRequestHeader(context.request, "user-agent");
          const ipAddress = readRequestIp(context.request);

          return deps.cargoService.planTransport({
            ...input,
            organizationId,
            actorId: authContext.actorId,
            actorType: authContext.actorType,
            correlationId: authContext.correlationId,
            ...(userAgent === undefined ? {} : { userAgent }),
            ...(ipAddress === undefined ? {} : { ipAddress }),
          });
        }),
      departTransport: cargoRpc
        .meta(cargoTransportDepartMetadata)
        .route({ method: "POST", path: "/cargo/departTransport" })
        .input(cargoTransportDepartInputSchema)
        .output(cargoTransportDepartOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            cargoTransportDepartMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("cargo.organization_required");
          }

          const userAgent = readRequestHeader(context.request, "user-agent");
          const ipAddress = readRequestIp(context.request);

          return deps.cargoService.departTransport({
            ...input,
            organizationId,
            actorId: authContext.actorId,
            actorType: authContext.actorType,
            correlationId: authContext.correlationId,
            ...(userAgent === undefined ? {} : { userAgent }),
            ...(ipAddress === undefined ? {} : { ipAddress }),
          });
        }),
      arriveTransport: cargoRpc
        .meta(cargoTransportArriveMetadata)
        .route({ method: "POST", path: "/cargo/arriveTransport" })
        .input(cargoTransportArriveInputSchema)
        .output(cargoTransportArriveOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            cargoTransportArriveMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("cargo.organization_required");
          }

          const userAgent = readRequestHeader(context.request, "user-agent");
          const ipAddress = readRequestIp(context.request);

          return deps.cargoService.arriveTransport({
            ...input,
            organizationId,
            actorId: authContext.actorId,
            actorType: authContext.actorType,
            correlationId: authContext.correlationId,
            ...(userAgent === undefined ? {} : { userAgent }),
            ...(ipAddress === undefined ? {} : { ipAddress }),
          });
        }),
      completeDelivery: cargoRpc
        .meta(cargoDeliveryCompleteMetadata)
        .route({ method: "POST", path: "/cargo/completeDelivery" })
        .input(cargoDeliveryCompleteInputSchema)
        .output(cargoDeliveryCompleteOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            cargoDeliveryCompleteMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("cargo.organization_required");
          }

          const userAgent = readRequestHeader(context.request, "user-agent");
          const ipAddress = readRequestIp(context.request);

          return deps.cargoService.completeDelivery({
            ...input,
            organizationId,
            actorId: authContext.actorId,
            actorType: authContext.actorType,
            correlationId: authContext.correlationId,
            ...(userAgent === undefined ? {} : { userAgent }),
            ...(ipAddress === undefined ? {} : { ipAddress }),
          });
        }),
      recordDeliveryException: cargoRpc
        .meta(cargoDeliveryExceptionRecordMetadata)
        .route({ method: "POST", path: "/cargo/recordDeliveryException" })
        .input(cargoDeliveryExceptionRecordInputSchema)
        .output(cargoDeliveryExceptionRecordOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            cargoDeliveryExceptionRecordMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("cargo.organization_required");
          }

          const userAgent = readRequestHeader(context.request, "user-agent");
          const ipAddress = readRequestIp(context.request);

          return deps.cargoService.recordDeliveryException({
            ...input,
            organizationId,
            actorId: authContext.actorId,
            actorType: authContext.actorType,
            correlationId: authContext.correlationId,
            ...(userAgent === undefined ? {} : { userAgent }),
            ...(ipAddress === undefined ? {} : { ipAddress }),
          });
        }),
      resolveDeliveryException: cargoRpc
        .meta(cargoDeliveryExceptionResolveMetadata)
        .route({ method: "POST", path: "/cargo/resolveDeliveryException" })
        .input(cargoDeliveryExceptionResolveInputSchema)
        .output(cargoDeliveryExceptionResolveOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            cargoDeliveryExceptionResolveMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("cargo.organization_required");
          }

          const userAgent = readRequestHeader(context.request, "user-agent");
          const ipAddress = readRequestIp(context.request);

          return deps.cargoService.resolveDeliveryException({
            ...input,
            organizationId,
            actorId: authContext.actorId,
            actorType: authContext.actorType,
            correlationId: authContext.correlationId,
            ...(userAgent === undefined ? {} : { userAgent }),
            ...(ipAddress === undefined ? {} : { ipAddress }),
          });
        }),
      recordOperationalHandoff: cargoRpc
        .meta(cargoOperationalHandoffRecordMetadata)
        .route({ method: "POST", path: "/cargo/recordOperationalHandoff" })
        .input(cargoOperationalHandoffRecordInputSchema)
        .output(cargoOperationalHandoffRecordOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            cargoOperationalHandoffRecordMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("cargo.organization_required");
          }

          const userAgent = readRequestHeader(context.request, "user-agent");
          const ipAddress = readRequestIp(context.request);

          return deps.cargoService.recordOperationalHandoff({
            ...input,
            organizationId,
            actorId: authContext.actorId,
            actorType: authContext.actorType,
            correlationId: authContext.correlationId,
            ...(userAgent === undefined ? {} : { userAgent }),
            ...(ipAddress === undefined ? {} : { ipAddress }),
          });
        }),
      recordClaimSettlement: cargoRpc
        .meta(cargoClaimSettlementRecordMetadata)
        .route({ method: "POST", path: "/cargo/recordClaimSettlement" })
        .input(cargoClaimSettlementRecordInputSchema)
        .output(cargoClaimSettlementRecordOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            cargoClaimSettlementRecordMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("cargo.organization_required");
          }

          const userAgent = readRequestHeader(context.request, "user-agent");
          const ipAddress = readRequestIp(context.request);

          return deps.cargoService.recordClaimSettlement({
            ...input,
            organizationId,
            actorId: authContext.actorId,
            actorType: authContext.actorType,
            correlationId: authContext.correlationId,
            ...(userAgent === undefined ? {} : { userAgent }),
            ...(ipAddress === undefined ? {} : { ipAddress }),
          });
        }),
      recordComplianceEvidence: cargoRpc
        .meta(cargoComplianceEvidenceRecordMetadata)
        .route({ method: "POST", path: "/cargo/recordComplianceEvidence" })
        .input(cargoComplianceEvidenceRecordInputSchema)
        .output(cargoComplianceEvidenceRecordOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            cargoComplianceEvidenceRecordMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("cargo.organization_required");
          }

          const userAgent = readRequestHeader(context.request, "user-agent");
          const ipAddress = readRequestIp(context.request);

          return deps.cargoService.recordComplianceEvidence({
            ...input,
            organizationId,
            actorId: authContext.actorId,
            actorType: authContext.actorType,
            correlationId: authContext.correlationId,
            ...(userAgent === undefined ? {} : { userAgent }),
            ...(ipAddress === undefined ? {} : { ipAddress }),
          });
        }),
      verifyComplianceEvidence: cargoRpc
        .meta(cargoComplianceEvidenceVerifyMetadata)
        .route({ method: "POST", path: "/cargo/verifyComplianceEvidence" })
        .input(cargoComplianceEvidenceVerifyInputSchema)
        .output(cargoComplianceEvidenceVerifyOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            cargoComplianceEvidenceVerifyMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("cargo.organization_required");
          }

          const userAgent = readRequestHeader(context.request, "user-agent");
          const ipAddress = readRequestIp(context.request);

          return deps.cargoService.verifyComplianceEvidence({
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
