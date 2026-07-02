import type { PlatformPermission } from "@saptm/auth";
import { AccessState } from "@saptm/ui";
import type { Metadata } from "next";

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
import { CapacityResourceRegisterForm } from "../../../../components/capacity/capacity-resource-register-form";
import { getAdminOverview } from "../../../../lib/admin-overview";
import { requirePlatformSession } from "../../../../lib/auth-session";
import { registerCapacityResourceAction } from "../capacity/actions";
import { initialCapacityResourceRegisterFormState } from "../capacity/form-state";
import {
  assignAdminRoleAction,
  cancelInvitationAction,
  createAdminRoleAction,
  deleteAdminRoleAction,
  inviteAdminUserAction,
  resendInvitationAction,
  revokeAdminRoleAction,
  updateAdminMembershipStatusAction,
  updateAdminRolePermissionsAction,
} from "./actions";
import {
  initialAdminMembershipStatusFormState,
  initialAdminRoleAssignFormState,
  initialAdminRoleCreateFormState,
  initialAdminRoleDeleteFormState,
  initialAdminRolePermissionsFormState,
  initialAdminRoleRevokeFormState,
  initialAdminUserInviteFormState,
} from "./form-state";
import { prepareAdminOptions } from "./logic";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Administração",
  description: "Gestão de utilizadores, convites, roles e permissões da organização.",
};

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
  const canRegisterResource = viewerPermissions.includes("capacity.manage" as PlatformPermission);
  if (!canOpenAdmin) {
    return (
      <AccessState
        badgeLabel="Administração"
        description="O utilizador autenticado não tem acesso ao módulo de administração."
        role="alert"
        title="Administração bloqueada"
        variant="blocked"
      />
    );
  }
  let result: Awaited<ReturnType<typeof getAdminOverview>>;
  try {
    result = await getAdminOverview({ offset, limit });
  } catch (_error) {
    return (
      <AccessState
        badgeLabel="Administração"
        description="Ocorreu um erro inesperado ao carregar a administração."
        role="alert"
        title="Administração indisponível"
        variant="error"
      />
    );
  }

  if (result.status !== "ok") {
    return (
      <AccessState
        badgeLabel="Administração"
        description={result.message}
        role="alert"
        title="Administração indisponível"
        variant="error"
      />
    );
  }
  const { overview } = result;
  const options = prepareAdminOptions(overview);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <AdminOverviewHeader totals={overview.totals} organization={overview.organization} />
      <section className="grid gap-4 xl:grid-cols-2">
        <AdminUserInviteForm
          action={inviteAdminUserAction}
          canInviteUser={canInviteUser}
          initialState={initialAdminUserInviteFormState}
          roles={options.roleInviteOptions}
        />
        <AdminRoleAssignForm
          action={assignAdminRoleAction}
          canAssignRole={canAssignRole}
          initialState={initialAdminRoleAssignFormState}
          members={options.memberOptions}
          roles={options.roleAssignOptions}
        />
      </section>
      <section className="grid gap-4 xl:grid-cols-3">
        <AdminRoleCreateForm
          action={createAdminRoleAction}
          canManageRoles={canManageRoles}
          initialState={initialAdminRoleCreateFormState}
          permissions={options.permissionOptions}
        />
        <AdminRolePermissionsForm
          action={updateAdminRolePermissionsAction}
          canManageRoles={canManageRoles}
          initialState={initialAdminRolePermissionsFormState}
          roles={options.roleManagementOptions}
        />
        <AdminRoleDeleteForm
          action={deleteAdminRoleAction}
          canManageRoles={canManageRoles}
          initialState={initialAdminRoleDeleteFormState}
          roles={options.roleManagementOptions}
        />
      </section>
      <section className="grid gap-4 xl:grid-cols-2">
        <AdminRoleRevokeForm
          action={revokeAdminRoleAction}
          canAssignRole={canAssignRole}
          initialState={initialAdminRoleRevokeFormState}
          members={options.memberRoleOptions}
        />
        <AdminMembershipStatusForm
          action={updateAdminMembershipStatusAction}
          canManageMemberships={canManageMemberships}
          initialState={initialAdminMembershipStatusFormState}
          members={options.memberLifecycleOptions}
        />
      </section>
      <AdminUsersTable
        canInviteUser={canInviteUser}
        onCancelInvitation={cancelInvitationAction}
        onResendInvitation={resendInvitationAction}
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
      <section className="grid gap-4">
        <CapacityResourceRegisterForm
          action={registerCapacityResourceAction}
          canManageCapacity={canRegisterResource}
          initialState={initialCapacityResourceRegisterFormState}
        />
      </section>
    </div>
  );
}
