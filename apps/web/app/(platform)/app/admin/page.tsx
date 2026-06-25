import type { PlatformPermission } from "@saptm/auth";
import { AccessState } from "@saptm/ui";

import { AdminInvitationLifecycleForm } from "../../../../components/admin/admin-invitation-lifecycle-form";
import { AdminMembershipStatusForm } from "../../../../components/admin/admin-membership-status-form";
import { AdminOverviewHeader } from "../../../../components/admin/admin-overview-header";
import { AdminRoleAssignForm } from "../../../../components/admin/admin-role-assign-form";
import { AdminRoleCreateForm } from "../../../../components/admin/admin-role-create-form";
import { AdminRoleDeleteForm } from "../../../../components/admin/admin-role-delete-form";
import { AdminRolePermissionsForm } from "../../../../components/admin/admin-role-permissions-form";
import { AdminRoleRevokeForm } from "../../../../components/admin/admin-role-revoke-form";
import { AdminRolesTables } from "../../../../components/admin/admin-roles-tables";
import { AdminUserInviteForm } from "../../../../components/admin/admin-user-invite-form";
import { AdminUsersTable } from "../../../../components/admin/admin-users-table";
import { getAdminOverview } from "../../../../lib/admin-overview";
import { requirePlatformSession } from "../../../../lib/auth-session";
import {
  assignAdminRoleAction,
  cancelAdminInvitationAction,
  createAdminRoleAction,
  deleteAdminRoleAction,
  inviteAdminUserAction,
  resendAdminInvitationAction,
  revokeAdminRoleAction,
  updateAdminMembershipStatusAction,
  updateAdminRolePermissionsAction,
} from "./actions";
import {
  initialAdminInvitationLifecycleFormState,
  initialAdminMembershipStatusFormState,
  initialAdminRoleAssignFormState,
  initialAdminRoleCreateFormState,
  initialAdminRoleDeleteFormState,
  initialAdminRolePermissionsFormState,
  initialAdminRoleRevokeFormState,
  initialAdminUserInviteFormState,
} from "./form-state";

export const dynamic = "force-dynamic";

const openAdminPermissions: readonly PlatformPermission[] = [
  "tenant.manage",
  "identity.user.invite",
  "identity.role.assign",
];
const inviteUserPermission: PlatformPermission = "identity.user.invite";
const assignRolePermission: PlatformPermission = "identity.role.assign";
const manageTenantPermission: PlatformPermission = "tenant.manage";

export default async function AdminIdentityPage(props: {
  searchParams?: Promise<{ offset?: string; limit?: string }>;
}) {
  const searchParams = await props.searchParams;
  const offset = Number(searchParams?.offset) || 0;
  const limit = Number(searchParams?.limit) || 25;
  const platformSession = await requirePlatformSession("/app/admin");
  const viewerPermissions = platformSession.viewer.permissions;
  const canOpenAdmin = openAdminPermissions.some((permission) =>
    viewerPermissions.includes(permission),
  );
  const canInviteUser = viewerPermissions.includes(inviteUserPermission);
  const canAssignRole = viewerPermissions.includes(assignRolePermission);
  const canManageRoles =
    viewerPermissions.includes(manageTenantPermission) &&
    viewerPermissions.includes(assignRolePermission);
  const canManageMemberships =
    viewerPermissions.includes(inviteUserPermission) &&
    viewerPermissions.includes(assignRolePermission);

  if (!canOpenAdmin) {
    return (
      <AccessState
        badgeLabel="Better Auth + RBAC"
        message="A sessao esta autenticada, mas falta tenant.manage, identity.user.invite ou identity.role.assign."
        role="alert"
        status="Sem grant"
        title="Administracao bloqueada"
        variant="empty"
      />
    );
  }

  const result = await getAdminOverview({ offset, limit });

  if (result.status !== "ok") {
    return (
      <AccessState
        badgeLabel="Better Auth + RBAC"
        message={result.message}
        role="alert"
        status={result.status}
        title="Administracao indisponivel"
        variant="empty"
      />
    );
  }

  const { overview } = result;
  const roleInviteOptions = overview.roles.map((role) => ({
    key: role.key,
    name: role.name,
  }));
  const roleAssignOptions = overview.roles.map((role) => ({
    id: role.id,
    key: role.key,
    name: role.name,
  }));
  const memberOptions = overview.users.map((user) => ({
    membershipId: user.membership.id,
    name: user.name,
    email: user.email,
  }));
  const memberLifecycleOptions = overview.users.map((user) => ({
    membershipId: user.membership.id,
    name: user.name,
    email: user.email,
    status: user.membership.status,
  }));
  const memberRoleOptions = overview.users.map((user) => ({
    membershipId: user.membership.id,
    name: user.name,
    email: user.email,
    roles: user.membership.roles,
  }));
  const invitedMemberOptions = overview.users
    .filter((user) => user.membership.status === "invited")
    .map((user) => ({
      membershipId: user.membership.id,
      name: user.name,
      email: user.email,
    }));
  const roleManagementOptions = overview.roles.map((role) => ({
    id: role.id,
    key: role.key,
    name: role.name,
    protected: role.protected,
    permissions: role.permissions,
    membershipCount: role.membershipCount,
  }));
  const permissionOptions = overview.permissions.map((permission) => ({
    key: permission.key,
    description: permission.description,
  }));

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <AdminOverviewHeader
        totals={overview.totals}
        organization={overview.organization}
        securityModel={overview.securityModel}
      />

      <section className="grid gap-4 xl:grid-cols-2">
        <AdminUserInviteForm
          action={inviteAdminUserAction}
          canInviteUser={canInviteUser}
          initialState={initialAdminUserInviteFormState}
          roles={roleInviteOptions}
        />
        <AdminRoleAssignForm
          action={assignAdminRoleAction}
          canAssignRole={canAssignRole}
          initialState={initialAdminRoleAssignFormState}
          members={memberOptions}
          roles={roleAssignOptions}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <AdminRoleCreateForm
          action={createAdminRoleAction}
          canManageRoles={canManageRoles}
          initialState={initialAdminRoleCreateFormState}
          permissions={permissionOptions}
        />
        <AdminRolePermissionsForm
          action={updateAdminRolePermissionsAction}
          canManageRoles={canManageRoles}
          initialState={initialAdminRolePermissionsFormState}
          roles={roleManagementOptions}
        />
        <AdminRoleDeleteForm
          action={deleteAdminRoleAction}
          canManageRoles={canManageRoles}
          initialState={initialAdminRoleDeleteFormState}
          roles={roleManagementOptions}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <AdminRoleRevokeForm
          action={revokeAdminRoleAction}
          canAssignRole={canAssignRole}
          initialState={initialAdminRoleRevokeFormState}
          members={memberRoleOptions}
        />
        <AdminMembershipStatusForm
          action={updateAdminMembershipStatusAction}
          canManageMemberships={canManageMemberships}
          initialState={initialAdminMembershipStatusFormState}
          members={memberLifecycleOptions}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <AdminInvitationLifecycleForm
          action={resendAdminInvitationAction}
          actionLabel="Reenviar convite"
          canManageInvitations={canInviteUser}
          description="Reemite evento de outbox para convites ainda pendentes."
          initialState={initialAdminInvitationLifecycleFormState}
          members={invitedMemberOptions}
          title="Reenviar convite"
        />
        <AdminInvitationLifecycleForm
          action={cancelAdminInvitationAction}
          actionLabel="Cancelar convite"
          canManageInvitations={canInviteUser}
          description="Cancela convite pendente, remove roles e fecha acesso antes de ativacao."
          initialState={initialAdminInvitationLifecycleFormState}
          members={invitedMemberOptions}
          requiresReason
          title="Cancelar convite"
        />
      </section>

      <AdminUsersTable
        users={overview.users}
        pagination={{
          totalCount: overview.pagination.totalCount,
          limit,
          offset,
          totalPages: Math.ceil(overview.pagination.totalCount / limit),
          currentPage: Math.floor(offset / limit) + 1,
        }}
      />

      <AdminRolesTables roles={overview.roles} permissions={overview.permissions} />
    </div>
  );
}
