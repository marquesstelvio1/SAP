import type { IncomingMessage } from "node:http";
import { ForbiddenException } from "@nestjs/common";
import { os } from "@orpc/server";
import {
  adminInvitationCancelInputSchema,
  adminInvitationCancelMetadata,
  adminInvitationLifecycleOutputSchema,
  adminInvitationResendInputSchema,
  adminInvitationResendMetadata,
  adminMembershipStatusUpdateInputSchema,
  adminMembershipStatusUpdateMetadata,
  adminMembershipStatusUpdateOutputSchema,
  adminOverviewInputSchema,
  adminOverviewMetadata,
  adminOverviewOutputSchema,
  adminRoleAssignInputSchema,
  adminRoleAssignMetadata,
  adminRoleAssignOutputSchema,
  adminRoleCreateInputSchema,
  adminRoleCreateMetadata,
  adminRoleDeleteInputSchema,
  adminRoleDeleteMetadata,
  adminRoleDeleteOutputSchema,
  adminRoleMutationOutputSchema,
  adminRolePermissionsUpdateInputSchema,
  adminRolePermissionsUpdateMetadata,
  adminRoleRevokeInputSchema,
  adminRoleRevokeMetadata,
  adminRoleRevokeOutputSchema,
  adminUserInviteInputSchema,
  adminUserInviteMetadata,
  adminUserInviteOutputSchema,
} from "@saptm/rpc";

import type { RpcRequestWithAuthContext } from "../rpc/rpc-context.js";
import type { RpcContextService } from "../rpc/rpc-context.service.js";
import type { AdminService } from "./admin.service.js";

export type AdminRpcContext = {
  request: IncomingMessage & RpcRequestWithAuthContext;
};

export type CreateAdminRpcRouterInput = {
  adminService: Pick<
    AdminService,
    | "assignRole"
    | "cancelInvitation"
    | "createRole"
    | "deleteRole"
    | "getOverview"
    | "inviteUser"
    | "resendInvitation"
    | "revokeRole"
    | "updateMembershipStatus"
    | "updateRolePermissions"
  >;
  rpcContextService: Pick<RpcContextService, "authorizeRequest">;
};

const adminRpc = os.$context<AdminRpcContext>();

export function createAdminRpcRouter(deps: CreateAdminRpcRouterInput) {
  return adminRpc.router({
    admin: {
      overview: adminRpc
        .meta(adminOverviewMetadata)
        .route({ method: "GET", path: "/admin/overview" })
        .input(adminOverviewInputSchema)
        .output(adminOverviewOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            adminOverviewMetadata,
          );
          const organizationId = authorizedContext.authContext?.organizationId;

          if (organizationId === undefined) {
            throw new ForbiddenException("admin.organization_required");
          }

          return deps.adminService.getOverview({
            organizationId,
            limit: input.limit,
            offset: input.offset,
          });
        }),
      inviteUser: adminRpc
        .meta(adminUserInviteMetadata)
        .route({ method: "POST", path: "/admin/inviteUser" })
        .input(adminUserInviteInputSchema)
        .output(adminUserInviteOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            adminUserInviteMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("admin.organization_required");
          }

          const userAgent = readRequestHeader(context.request, "user-agent");
          const ipAddress = readRequestIp(context.request);

          return deps.adminService.inviteUser({
            ...input,
            organizationId,
            actorId: authContext.actorId,
            actorType: authContext.actorType,
            correlationId: authContext.correlationId,
            ...(userAgent === undefined ? {} : { userAgent }),
            ...(ipAddress === undefined ? {} : { ipAddress }),
          });
        }),
      assignRole: adminRpc
        .meta(adminRoleAssignMetadata)
        .route({ method: "POST", path: "/admin/assignRole" })
        .input(adminRoleAssignInputSchema)
        .output(adminRoleAssignOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            adminRoleAssignMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("admin.organization_required");
          }

          const userAgent = readRequestHeader(context.request, "user-agent");
          const ipAddress = readRequestIp(context.request);

          return deps.adminService.assignRole({
            ...input,
            organizationId,
            actorId: authContext.actorId,
            actorType: authContext.actorType,
            correlationId: authContext.correlationId,
            ...(userAgent === undefined ? {} : { userAgent }),
            ...(ipAddress === undefined ? {} : { ipAddress }),
          });
        }),
      createRole: adminRpc
        .meta(adminRoleCreateMetadata)
        .route({ method: "POST", path: "/admin/createRole" })
        .input(adminRoleCreateInputSchema)
        .output(adminRoleMutationOutputSchema)
        .handler(async ({ context, input }) => {
          const requestInput = await resolveAdminMutationContext(
            context.request,
            deps.rpcContextService,
            adminRoleCreateMetadata,
          );

          return deps.adminService.createRole({
            ...input,
            ...requestInput,
          });
        }),
      updateRolePermissions: adminRpc
        .meta(adminRolePermissionsUpdateMetadata)
        .route({ method: "POST", path: "/admin/updateRolePermissions" })
        .input(adminRolePermissionsUpdateInputSchema)
        .output(adminRoleMutationOutputSchema)
        .handler(async ({ context, input }) => {
          const requestInput = await resolveAdminMutationContext(
            context.request,
            deps.rpcContextService,
            adminRolePermissionsUpdateMetadata,
          );

          return deps.adminService.updateRolePermissions({
            ...input,
            ...requestInput,
          });
        }),
      deleteRole: adminRpc
        .meta(adminRoleDeleteMetadata)
        .route({ method: "POST", path: "/admin/deleteRole" })
        .input(adminRoleDeleteInputSchema)
        .output(adminRoleDeleteOutputSchema)
        .handler(async ({ context, input }) => {
          const requestInput = await resolveAdminMutationContext(
            context.request,
            deps.rpcContextService,
            adminRoleDeleteMetadata,
          );

          return deps.adminService.deleteRole({
            ...input,
            ...requestInput,
          });
        }),
      revokeRole: adminRpc
        .meta(adminRoleRevokeMetadata)
        .route({ method: "POST", path: "/admin/revokeRole" })
        .input(adminRoleRevokeInputSchema)
        .output(adminRoleRevokeOutputSchema)
        .handler(async ({ context, input }) => {
          const requestInput = await resolveAdminMutationContext(
            context.request,
            deps.rpcContextService,
            adminRoleRevokeMetadata,
          );

          return deps.adminService.revokeRole({
            ...input,
            ...requestInput,
          });
        }),
      updateMembershipStatus: adminRpc
        .meta(adminMembershipStatusUpdateMetadata)
        .route({ method: "POST", path: "/admin/updateMembershipStatus" })
        .input(adminMembershipStatusUpdateInputSchema)
        .output(adminMembershipStatusUpdateOutputSchema)
        .handler(async ({ context, input }) => {
          const requestInput = await resolveAdminMutationContext(
            context.request,
            deps.rpcContextService,
            adminMembershipStatusUpdateMetadata,
          );

          return deps.adminService.updateMembershipStatus({
            ...input,
            ...requestInput,
          });
        }),
      resendInvitation: adminRpc
        .meta(adminInvitationResendMetadata)
        .route({ method: "POST", path: "/admin/resendInvitation" })
        .input(adminInvitationResendInputSchema)
        .output(adminInvitationLifecycleOutputSchema)
        .handler(async ({ context, input }) => {
          const requestInput = await resolveAdminMutationContext(
            context.request,
            deps.rpcContextService,
            adminInvitationResendMetadata,
          );

          return deps.adminService.resendInvitation({
            ...input,
            ...requestInput,
          });
        }),
      cancelInvitation: adminRpc
        .meta(adminInvitationCancelMetadata)
        .route({ method: "POST", path: "/admin/cancelInvitation" })
        .input(adminInvitationCancelInputSchema)
        .output(adminInvitationLifecycleOutputSchema)
        .handler(async ({ context, input }) => {
          const requestInput = await resolveAdminMutationContext(
            context.request,
            deps.rpcContextService,
            adminInvitationCancelMetadata,
          );

          return deps.adminService.cancelInvitation({
            ...input,
            ...requestInput,
          });
        }),
    },
  });
}

async function resolveAdminMutationContext(
  request: IncomingMessage & RpcRequestWithAuthContext,
  rpcContextService: Pick<RpcContextService, "authorizeRequest">,
  metadata: Parameters<RpcContextService["authorizeRequest"]>[1],
) {
  const authorizedContext = await rpcContextService.authorizeRequest(request, metadata);
  const authContext = authorizedContext.authContext;
  const organizationId = authContext?.organizationId;

  if (authContext === undefined || organizationId === undefined) {
    throw new ForbiddenException("admin.organization_required");
  }

  const userAgent = readRequestHeader(request, "user-agent");
  const ipAddress = readRequestIp(request);

  return {
    organizationId,
    actorId: authContext.actorId,
    actorType: authContext.actorType,
    correlationId: authContext.correlationId,
    ...(userAgent === undefined ? {} : { userAgent }),
    ...(ipAddress === undefined ? {} : { ipAddress }),
  };
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
