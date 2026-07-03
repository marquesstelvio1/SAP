import type { IncomingMessage } from "node:http";
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

import type { AuthEnrichedContext, RpcAuthBuilder } from "../rpc/rpc-auth.middleware.js";
import type { AdminService } from "./admin.service.js";

export type AdminRpcContext = {
  request: IncomingMessage;
} & AuthEnrichedContext;

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
  authMiddleware: RpcAuthBuilder;
};

export function createAdminRpcRouter(deps: CreateAdminRpcRouterInput) {
  const adminRpc = os.$context<AdminRpcContext>().use(deps.authMiddleware);

  return adminRpc.router({
    admin: {
      overview: adminRpc
        .meta(adminOverviewMetadata)
        .route({ method: "GET", path: "/admin/overview" })
        .input(adminOverviewInputSchema)
        .output(adminOverviewOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.adminService.getOverview({
            organizationId: context.organizationId,
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
          return deps.adminService.inviteUser({
            ...input,
            organizationId: context.organizationId,
            actorId: context.actorId,
            actorType: context.actorType,
            correlationId: context.correlationId,
            ...(context.userAgent === undefined ? {} : { userAgent: context.userAgent }),
            ...(context.ipAddress === undefined ? {} : { ipAddress: context.ipAddress }),
          });
        }),
      assignRole: adminRpc
        .meta(adminRoleAssignMetadata)
        .route({ method: "POST", path: "/admin/assignRole" })
        .input(adminRoleAssignInputSchema)
        .output(adminRoleAssignOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.adminService.assignRole({
            ...input,
            organizationId: context.organizationId,
            actorId: context.actorId,
            actorType: context.actorType,
            correlationId: context.correlationId,
            ...(context.userAgent === undefined ? {} : { userAgent: context.userAgent }),
            ...(context.ipAddress === undefined ? {} : { ipAddress: context.ipAddress }),
          });
        }),
      createRole: adminRpc
        .meta(adminRoleCreateMetadata)
        .route({ method: "POST", path: "/admin/createRole" })
        .input(adminRoleCreateInputSchema)
        .output(adminRoleMutationOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.adminService.createRole({
            ...input,
            organizationId: context.organizationId,
            actorId: context.actorId,
            actorType: context.actorType,
            correlationId: context.correlationId,
            ...(context.userAgent === undefined ? {} : { userAgent: context.userAgent }),
            ...(context.ipAddress === undefined ? {} : { ipAddress: context.ipAddress }),
          });
        }),
      updateRolePermissions: adminRpc
        .meta(adminRolePermissionsUpdateMetadata)
        .route({ method: "POST", path: "/admin/updateRolePermissions" })
        .input(adminRolePermissionsUpdateInputSchema)
        .output(adminRoleMutationOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.adminService.updateRolePermissions({
            ...input,
            organizationId: context.organizationId,
            actorId: context.actorId,
            actorType: context.actorType,
            correlationId: context.correlationId,
            ...(context.userAgent === undefined ? {} : { userAgent: context.userAgent }),
            ...(context.ipAddress === undefined ? {} : { ipAddress: context.ipAddress }),
          });
        }),
      deleteRole: adminRpc
        .meta(adminRoleDeleteMetadata)
        .route({ method: "POST", path: "/admin/deleteRole" })
        .input(adminRoleDeleteInputSchema)
        .output(adminRoleDeleteOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.adminService.deleteRole({
            ...input,
            organizationId: context.organizationId,
            actorId: context.actorId,
            actorType: context.actorType,
            correlationId: context.correlationId,
            ...(context.userAgent === undefined ? {} : { userAgent: context.userAgent }),
            ...(context.ipAddress === undefined ? {} : { ipAddress: context.ipAddress }),
          });
        }),
      revokeRole: adminRpc
        .meta(adminRoleRevokeMetadata)
        .route({ method: "POST", path: "/admin/revokeRole" })
        .input(adminRoleRevokeInputSchema)
        .output(adminRoleRevokeOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.adminService.revokeRole({
            ...input,
            organizationId: context.organizationId,
            actorId: context.actorId,
            actorType: context.actorType,
            correlationId: context.correlationId,
            ...(context.userAgent === undefined ? {} : { userAgent: context.userAgent }),
            ...(context.ipAddress === undefined ? {} : { ipAddress: context.ipAddress }),
          });
        }),
      updateMembershipStatus: adminRpc
        .meta(adminMembershipStatusUpdateMetadata)
        .route({ method: "POST", path: "/admin/updateMembershipStatus" })
        .input(adminMembershipStatusUpdateInputSchema)
        .output(adminMembershipStatusUpdateOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.adminService.updateMembershipStatus({
            ...input,
            organizationId: context.organizationId,
            actorId: context.actorId,
            actorType: context.actorType,
            correlationId: context.correlationId,
            ...(context.userAgent === undefined ? {} : { userAgent: context.userAgent }),
            ...(context.ipAddress === undefined ? {} : { ipAddress: context.ipAddress }),
          });
        }),
      resendInvitation: adminRpc
        .meta(adminInvitationResendMetadata)
        .route({ method: "POST", path: "/admin/resendInvitation" })
        .input(adminInvitationResendInputSchema)
        .output(adminInvitationLifecycleOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.adminService.resendInvitation({
            ...input,
            organizationId: context.organizationId,
            actorId: context.actorId,
            actorType: context.actorType,
            correlationId: context.correlationId,
            ...(context.userAgent === undefined ? {} : { userAgent: context.userAgent }),
            ...(context.ipAddress === undefined ? {} : { ipAddress: context.ipAddress }),
          });
        }),
      cancelInvitation: adminRpc
        .meta(adminInvitationCancelMetadata)
        .route({ method: "POST", path: "/admin/cancelInvitation" })
        .input(adminInvitationCancelInputSchema)
        .output(adminInvitationLifecycleOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.adminService.cancelInvitation({
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
