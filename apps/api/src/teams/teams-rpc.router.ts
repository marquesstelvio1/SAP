import type { IncomingMessage } from "node:http";
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

import type { AuthEnrichedContext, RpcAuthMiddleware } from "../rpc/rpc-auth.middleware.js";
import type { TeamsService } from "./teams.service.js";

export type TeamsRpcContext = {
  request: IncomingMessage;
} & AuthEnrichedContext;

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
  authMiddleware: RpcAuthMiddleware;
};

export function createTeamsRpcRouter(deps: CreateTeamsRpcRouterInput) {
  const teamsRpc = os.$context<TeamsRpcContext>().use(deps.authMiddleware);

  return teamsRpc.router({
    teams: {
      create: teamsRpc
        .meta(createTeamMetadata)
        .route({ method: "POST", path: "/teams/create" })
        .input(createTeamInputSchema)
        .output(createTeamOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.teamsService.createTeam({
            ...input,
            organizationId: context.organizationId,
            actorId: context.actorId,
            actorType: context.actorType,
            correlationId: context.correlationId,
          });
        }),
      update: teamsRpc
        .meta(updateTeamMetadata)
        .route({ method: "POST", path: "/teams/update" })
        .input(updateTeamInputSchema)
        .output(updateTeamOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.teamsService.updateTeam({
            ...input,
            organizationId: context.organizationId,
            actorId: context.actorId,
            actorType: context.actorType,
            correlationId: context.correlationId,
          });
        }),
      delete: teamsRpc
        .meta(deleteTeamMetadata)
        .route({ method: "POST", path: "/teams/delete" })
        .input(deleteTeamInputSchema)
        .output(deleteTeamOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.teamsService.deleteTeam({
            ...input,
            organizationId: context.organizationId,
            actorId: context.actorId,
            actorType: context.actorType,
            correlationId: context.correlationId,
          });
        }),
      list: teamsRpc
        .meta(listTeamsMetadata)
        .route({ method: "GET", path: "/teams/list" })
        .input(listTeamsInputSchema)
        .output(listTeamsOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.teamsService.listTeams({
            organizationId: context.organizationId,
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
          return deps.teamsService.getTeam({
            ...input,
            organizationId: context.organizationId,
          });
        }),
      addMember: teamsRpc
        .meta(addTeamMemberMetadata)
        .route({ method: "POST", path: "/teams/addMember" })
        .input(addTeamMemberInputSchema)
        .output(addTeamMemberOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.teamsService.addTeamMember({
            ...input,
            organizationId: context.organizationId,
            actorId: context.actorId,
            actorType: context.actorType,
            correlationId: context.correlationId,
          });
        }),
      removeMember: teamsRpc
        .meta(removeTeamMemberMetadata)
        .route({ method: "POST", path: "/teams/removeMember" })
        .input(removeTeamMemberInputSchema)
        .output(removeTeamMemberOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.teamsService.removeTeamMember({
            ...input,
            organizationId: context.organizationId,
            actorId: context.actorId,
            actorType: context.actorType,
            correlationId: context.correlationId,
          });
        }),
      updateMemberRole: teamsRpc
        .meta(updateTeamMemberRoleMetadata)
        .route({ method: "POST", path: "/teams/updateMemberRole" })
        .input(updateTeamMemberRoleInputSchema)
        .output(updateTeamMemberRoleOutputSchema)
        .handler(async ({ context, input }) => {
          return deps.teamsService.updateTeamMemberRole({
            ...input,
            organizationId: context.organizationId,
            actorId: context.actorId,
            actorType: context.actorType,
            correlationId: context.correlationId,
          });
        }),
    },
  });
}

export type TeamsRpcRouter = ReturnType<typeof createTeamsRpcRouter>;
