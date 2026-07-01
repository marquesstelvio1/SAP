export const membershipStatusLabels = {
  active: "Ativo",
  invited: "Convidado",
  removed: "Removido",
  suspended: "Suspenso",
} as const;

export const organizationStatusLabels = {
  active: "Ativa",
  archived: "Arquivada",
  suspended: "Suspensa",
} as const;

export function resolveMembershipStatusVariant(
  status: keyof typeof membershipStatusLabels,
): "outline" | "success" | "warning" | "destructive" {
  if (status === "active") return "success";
  if (status === "suspended" || status === "removed") return "destructive";
  return "warning";
}

export { formatDateTime } from "@/lib/format";

export type AdminOverviewData = {
  roles: Array<{
    id: string;
    key: string;
    name: string;
    protected: boolean;
    permissions: string[];
    membershipCount: number;
  }>;
  users: Array<{
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    createdAt: string;
    membership: {
      id: string;
      status: string;
      roles: Array<{ id: string; key: string }>;
    };
  }>;
  permissions: Array<{
    id: string;
    key: string;
    description: string | null;
    roleCount: number;
  }>;
};

export type AdminPageOptions = {
  roleInviteOptions: Array<{ key: string; name: string }>;
  roleAssignOptions: Array<{ id: string; key: string; name: string }>;
  memberOptions: Array<{ membershipId: string; name: string; email: string }>;
  memberLifecycleOptions: Array<{
    membershipId: string;
    name: string;
    email: string;
    status: string;
  }>;
  memberRoleOptions: Array<{
    membershipId: string;
    name: string;
    email: string;
    roles: Array<{ id: string; key: string; name: string }>;
  }>;
  invitedMemberOptions: Array<{ membershipId: string; name: string; email: string }>;
  roleManagementOptions: Array<{
    id: string;
    key: string;
    name: string;
    protected: boolean;
    permissions: string[];
    membershipCount: number;
  }>;
  permissionOptions: Array<{ key: string; description: string | null }>;
};

export function prepareAdminOptions(data: AdminOverviewData): AdminPageOptions {
  const roleInviteOptions = data.roles.map((role) => ({
    key: role.key,
    name: role.name,
  }));
  const roleAssignOptions = data.roles.map((role) => ({
    id: role.id,
    key: role.key,
    name: role.name,
  }));
  const memberOptions = data.users.map((user) => ({
    membershipId: user.membership.id,
    name: user.name,
    email: user.email,
  }));
  const memberLifecycleOptions = data.users.map((user) => ({
    membershipId: user.membership.id,
    name: user.name,
    email: user.email,
    status: user.membership.status,
  }));
  const memberRoleOptions = data.users.map((user) => ({
    membershipId: user.membership.id,
    name: user.name,
    email: user.email,
    roles: user.membership.roles.map((role) => ({
      ...role,
      name: data.roles.find((r) => r.id === role.id)?.name ?? role.key,
    })),
  }));
  const invitedMemberOptions = data.users
    .filter((user) => user.membership.status === "invited")
    .map((user) => ({
      membershipId: user.membership.id,
      name: user.name,
      email: user.email,
    }));
  const roleManagementOptions = data.roles.map((role) => ({
    id: role.id,
    key: role.key,
    name: role.name,
    protected: role.protected,
    permissions: role.permissions,
    membershipCount: role.membershipCount,
  }));
  const permissionOptions = data.permissions.map((permission) => ({
    key: permission.key,
    description: permission.description,
  }));

  return {
    roleInviteOptions,
    roleAssignOptions,
    memberOptions,
    memberLifecycleOptions,
    memberRoleOptions,
    invitedMemberOptions,
    roleManagementOptions,
    permissionOptions,
  };
}
