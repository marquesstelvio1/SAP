"use client";

import type { TeamDetail, TeamSummary } from "@saptm/rpc/teams";
import { DataTable } from "@saptm/ui";
import type { ColumnDef } from "@tanstack/react-table";

import type { TeamMembersFormState } from "./team-members-dialog";
import { TeamMembersDialog } from "./team-members-dialog";

type TeamsTableProps = {
  teams: TeamSummary[];
  teamDetails: Record<string, TeamDetail>;
  orgUsers: { id: string; name: string; email: string }[];
  pageSize: number;
  pageCount: number;
  pageIndex: number;
  canManage: boolean;
  addMemberAction: (
    _previousState: TeamMembersFormState,
    formData: FormData,
  ) => Promise<TeamMembersFormState>;
  removeMemberAction: (
    _previousState: TeamMembersFormState,
    formData: FormData,
  ) => Promise<TeamMembersFormState>;
  updateRoleAction: (
    _previousState: TeamMembersFormState,
    formData: FormData,
  ) => Promise<TeamMembersFormState>;
};

export function TeamsTable({
  teams,
  teamDetails,
  orgUsers,
  pageSize,
  pageCount,
  pageIndex,
  canManage,
  addMemberAction,
  removeMemberAction,
  updateRoleAction,
}: TeamsTableProps) {
  const columns: ColumnDef<TeamSummary>[] = [
    {
      accessorKey: "name",
      header: "Nome",
    },
    {
      accessorKey: "slug",
      header: "Slug",
    },
    {
      accessorKey: "description",
      header: "Descricao",
      cell: ({ row }) => row.original.description ?? "-",
    },
    {
      accessorKey: "memberCount",
      header: "Membros",
    },
    {
      id: "actions",
      header: "Acoes",
      cell: ({ row }) => {
        const team = row.original;
        const detail = teamDetails[team.id];

        if (detail === undefined) return null;

        return (
          <TeamMembersDialog
            team={detail}
            addMemberAction={addMemberAction}
            removeMemberAction={removeMemberAction}
            updateRoleAction={updateRoleAction}
            canManage={canManage}
            users={orgUsers}
          />
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={teams}
      filterColumn="name"
      filterPlaceholder="Filtrar por nome..."
      emptyMessage="Nenhuma equipa encontrada."
      pageSize={pageSize}
      manualPagination
      pageCount={pageCount}
      pageIndex={pageIndex}
    />
  );
}
