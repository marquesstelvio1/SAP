import type { IncomingMessage } from "node:http";
import { ForbiddenException } from "@nestjs/common";
import { os } from "@orpc/server";
import {
  addTeamMemberInputSchema,
  addTeamMemberMetadata,
  addTeamMemberOutputSchema,
  createTeamInputSchema,
  createTeamMetadata,
  createTeamOutputSchema,
  deleteTeamInputSchema,
  deleteTeamMetadata,
  deleteTeamOutputSchema,
  getTeamInputSchema,
  getTeamMetadata,
  getTeamOutputSchema,
  listTeamsInputSchema,
  listTeamsMetadata,
  listTeamsOutputSchema,
  removeTeamMemberInputSchema,
  removeTeamMemberMetadata,
  removeTeamMemberOutputSchema,
  updateTeamInputSchema,
  updateTeamMemberRoleInputSchema,
  updateTeamMemberRoleMetadata,
  updateTeamMemberRoleOutputSchema,
  updateTeamMetadata,
  updateTeamOutputSchema,
} from "@saptm/rpc";

import type { RpcRequestWithAuthContext } from "../rpc/rpc-context.js";
import type { RpcContextService } from "../rpc/rpc-context.service.js";
import type { TeamsService } from "./teams.service.js";

export type TeamsRpcContext = {
  request: IncomingMessage & RpcRequestWithAuthContext;
};

export type CreateTeamsRpcRouterInput = {
  teamsService: Pick<
    TeamsService,
    | "addTeamMember"
    | "createTeam"
    | "deleteTeam"
    | "getTeam"
    | "listTeams"
    | "removeTeamMember"
    | "updateTeam"
    | "updateTeamMemberRole"
  >;
  rpcContextService: Pick<RpcContextService, "authorizeRequest">;
};

const teamsRpc = os.$context<TeamsRpcContext>();

export function createTeamsRpcRouter(deps: CreateTeamsRpcRouterInput) {
  return teamsRpc.router({
    teams: {
      create: teamsRpc
        .meta(createTeamMetadata)
        .route({ method: "POST", path: "/teams/create" })
        .input(createTeamInputSchema)
        .output(createTeamOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            createTeamMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("teams.organization_required");
          }

          return deps.teamsService.createTeam({
            ...input,
            organizationId,
          });
        }),
      update: teamsRpc
        .meta(updateTeamMetadata)
        .route({ method: "POST", path: "/teams/update" })
        .input(updateTeamInputSchema)
        .output(updateTeamOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            updateTeamMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("teams.organization_required");
          }

          return deps.teamsService.updateTeam({
            ...input,
            organizationId,
          });
        }),
      delete: teamsRpc
        .meta(deleteTeamMetadata)
        .route({ method: "POST", path: "/teams/delete" })
        .input(deleteTeamInputSchema)
        .output(deleteTeamOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            deleteTeamMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("teams.organization_required");
          }

          return deps.teamsService.deleteTeam({
            ...input,
            organizationId,
          });
        }),
      list: teamsRpc
        .meta(listTeamsMetadata)
        .route({ method: "GET", path: "/teams/list" })
        .input(listTeamsInputSchema)
        .output(listTeamsOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            listTeamsMetadata,
          );
          const organizationId = authorizedContext.authContext?.organizationId;

          if (organizationId === undefined) {
            throw new ForbiddenException("teams.organization_required");
          }

          return deps.teamsService.listTeams({
            organizationId,
            limit: input.limit,
            offset: input.offset,
          });
        }),
      get: teamsRpc
        .meta(getTeamMetadata)
        .route({ method: "GET", path: "/teams/get" })
        .input(getTeamInputSchema)
        .output(getTeamOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            getTeamMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("teams.organization_required");
          }

          return deps.teamsService.getTeam({
            ...input,
            organizationId,
          });
        }),
      addMember: teamsRpc
        .meta(addTeamMemberMetadata)
        .route({ method: "POST", path: "/teams/addMember" })
        .input(addTeamMemberInputSchema)
        .output(addTeamMemberOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            addTeamMemberMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("teams.organization_required");
          }

          return deps.teamsService.addTeamMember({
            ...input,
            organizationId,
          });
        }),
      removeMember: teamsRpc
        .meta(removeTeamMemberMetadata)
        .route({ method: "POST", path: "/teams/removeMember" })
        .input(removeTeamMemberInputSchema)
        .output(removeTeamMemberOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            removeTeamMemberMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("teams.organization_required");
          }

          return deps.teamsService.removeTeamMember({
            ...input,
            organizationId,
          });
        }),
      updateMemberRole: teamsRpc
        .meta(updateTeamMemberRoleMetadata)
        .route({ method: "POST", path: "/teams/updateMemberRole" })
        .input(updateTeamMemberRoleInputSchema)
        .output(updateTeamMemberRoleOutputSchema)
        .handler(async ({ context, input }) => {
          const authorizedContext = await deps.rpcContextService.authorizeRequest(
            context.request,
            updateTeamMemberRoleMetadata,
          );
          const authContext = authorizedContext.authContext;
          const organizationId = authContext?.organizationId;

          if (authContext === undefined || organizationId === undefined) {
            throw new ForbiddenException("teams.organization_required");
          }

          return deps.teamsService.updateTeamMemberRole({
            ...input,
            organizationId,
          });
        }),
    },
  });
}

export type TeamsRpcRouter = ReturnType<typeof createTeamsRpcRouter>;
