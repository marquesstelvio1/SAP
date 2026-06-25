import type { TeamDetail } from "@saptm/rpc/teams";
import { listTeamsInputSchema, listTeamsOutputSchema } from "@saptm/rpc/teams";
import { AccessState, Button } from "@saptm/ui";
import { PlusIcon } from "lucide-react";

import { requirePlatformSession } from "../../../../../lib/auth-session";
import { rpcGet } from "../../../../../lib/rpc-server";
import { getOrgUsers, getTeamDetail } from "../../../../../lib/teams-overview";
import {
  addTeamMemberAction,
  createTeamAction,
  removeTeamMemberAction,
  updateTeamMemberRoleAction,
} from "./actions";
import { CreateTeamDialog } from "./create-team-dialog";
import { TeamsTable } from "./teams-table";

export const dynamic = "force-dynamic";

export default async function AdminTeamsPage(props: {
  searchParams?: Promise<{ offset?: string; limit?: string }>;
}) {
  const searchParams = await props.searchParams;
  const offset = Number(searchParams?.offset) || 0;
  const limit = Number(searchParams?.limit) || 25;
  const platformSession = await requirePlatformSession("/app/admin/teams");
  const viewerPermissions = platformSession.viewer.permissions;
  const canManageTeams = viewerPermissions.includes("tenant.manage");

  if (!canManageTeams) {
    return (
      <AccessState
        badgeLabel="Better Auth + RBAC"
        message="A sessao nao possui tenant.manage para gerir equipas."
        role="alert"
        status="Sem grant"
        title="Equipas bloqueado"
        variant="empty"
      />
    );
  }

  const input = listTeamsInputSchema.parse({ limit, offset });
  const [result, orgUsers] = await Promise.all([
    rpcGet("/rpc/teams/list", listTeamsOutputSchema, {
      searchParams: input,
    }),
    getOrgUsers(),
  ]);

  if (result.status !== "ok") {
    return (
      <AccessState
        badgeLabel="Teams API"
        message={result.message}
        role="alert"
        status={result.status}
        title="Equipas indisponivel"
        variant="empty"
      />
    );
  }

  const { teams, pagination } = result.data;

  const teamDetails: Record<string, TeamDetail> = {};
  if (teams.length > 0) {
    const details = await Promise.allSettled(teams.map((t) => getTeamDetail(t.id)));
    for (const d of details) {
      if (d.status === "fulfilled" && d.value.status === "ok") {
        const detail = d.value.data.team;
        teamDetails[detail.id] = detail;
      }
    }
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Equipas</h1>
          <p className="text-muted-foreground text-sm">
            Gerir equipas, membros e permissoes dentro da organizacao.
          </p>
        </div>
        <CreateTeamDialog action={createTeamAction} canCreate={canManageTeams}>
          <Button className="gap-1.5">
            <PlusIcon className="size-4" />
            Nova equipa
          </Button>
        </CreateTeamDialog>
      </div>

      <TeamsTable
        teams={teams}
        teamDetails={teamDetails}
        orgUsers={orgUsers}
        pageSize={limit}
        pageCount={Math.ceil(pagination.totalCount / limit)}
        pageIndex={Math.floor(offset / limit)}
        canManage={canManageTeams}
        addMemberAction={addTeamMemberAction}
        removeMemberAction={removeTeamMemberAction}
        updateRoleAction={updateTeamMemberRoleAction}
      />
    </div>
  );
}
