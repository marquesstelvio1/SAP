import type { PlatformPermission } from "@saptm/auth";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@saptm/ui";
import { AdminInvitationLifecycleForm } from "../../../../components/admin-invitation-lifecycle-form";
import { AdminMembershipStatusForm } from "../../../../components/admin-membership-status-form";
import { AdminRoleAssignForm } from "../../../../components/admin-role-assign-form";
import { AdminRoleCreateForm } from "../../../../components/admin-role-create-form";
import { AdminRoleDeleteForm } from "../../../../components/admin-role-delete-form";
import { AdminRolePermissionsForm } from "../../../../components/admin-role-permissions-form";
import { AdminRoleRevokeForm } from "../../../../components/admin-role-revoke-form";
import { AdminUserInviteForm } from "../../../../components/admin-user-invite-form";
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

const membershipStatusLabels = {
  active: "Ativo",
  invited: "Convidado",
  removed: "Removido",
  suspended: "Suspenso",
} as const;

const organizationStatusLabels = {
  active: "Ativa",
  archived: "Arquivada",
  suspended: "Suspensa",
} as const;

export default async function AdminIdentityPage() {
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
      <AdminAccessState
        message="A sessao esta autenticada, mas falta tenant.manage, identity.user.invite ou identity.role.assign."
        status="Sem grant"
        title="Administracao bloqueada"
      />
    );
  }

  const result = await getAdminOverview();

  if (result.status !== "ok") {
    return (
      <AdminAccessState
        message={result.message}
        status={result.status}
        title="Administracao indisponivel"
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
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">Admin P1</Badge>
              <Badge variant="outline">Better Auth + RBAC</Badge>
              <Badge variant="outline">{overview.securityModel.authorizationModel}</Badge>
            </div>
            <div className="flex flex-col gap-2">
              <CardTitle className="text-3xl">Administracao de identidade e RBAC</CardTitle>
              <CardDescription className="max-w-3xl text-base leading-7">
                Governanca tenant-scoped para organizacao, utilizadores, memberships, roles e
                permissoes. Convites e atribuicoes passam por oRPC, RBAC, audit trail e outbox.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-5">
            <MetricTile label="Utilizadores" value={overview.totals.users.toString()} />
            <MetricTile label="Ativos" value={overview.totals.activeMemberships.toString()} />
            <MetricTile label="Convites" value={overview.totals.invitedMemberships.toString()} />
            <MetricTile label="Roles" value={overview.totals.roles.toString()} />
            <MetricTile label="Permissoes" value={overview.totals.permissions.toString()} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organizacao</CardTitle>
            <CardDescription>Escopo administrativo resolvido da sessao atual.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <ContextRow label="Nome" value={overview.organization.name} />
            <ContextRow label="Slug" value={overview.organization.slug} />
            <ContextRow
              label="Status"
              value={organizationStatusLabels[overview.organization.status]}
            />
            <ContextRow label="Tenant ID" value={overview.organization.id} />
            <ContextRow
              label="Atualizado"
              value={formatDateTime(overview.organization.updatedAt)}
            />
          </CardContent>
        </Card>
      </section>

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

      <Card>
        <CardHeader>
          <CardTitle>Utilizadores e memberships</CardTitle>
          <CardDescription>
            Lista tenant-scoped com status, verificacao de email e roles atribuidas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilizador</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Criado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overview.users.map((user) => (
                <TableRow key={user.membership.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{user.name}</span>
                      <span className="text-muted-foreground text-xs">{user.id}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={resolveMembershipStatusVariant(user.membership.status)}>
                      {membershipStatusLabels[user.membership.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span>{user.email}</span>
                      <span className="text-muted-foreground text-xs">
                        {user.emailVerified ? "Email verificado" : "Email pendente"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.membership.roles.length === 0 ? (
                        <Badge variant="warning">Sem role</Badge>
                      ) : (
                        user.membership.roles.map((role) => (
                          <Badge key={role.id} variant="outline">
                            {role.key}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatDateTime(user.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Roles do tenant</CardTitle>
            <CardDescription>
              Templates bootstrap e contagem de permissoes/memberships.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Permissoes</TableHead>
                  <TableHead>Membros</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{role.name}</span>
                        <span className="text-muted-foreground text-xs">
                          {role.key} · {role.protected ? "template protegido" : "custom"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        <span>{role.permissionCount}</span>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.slice(0, 4).map((permission) => (
                            <Badge key={permission} variant="outline">
                              {permission}
                            </Badge>
                          ))}
                          {role.permissions.length > 4 ? (
                            <Badge variant="secondary">+{role.permissions.length - 4}</Badge>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{role.membershipCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Permissoes</CardTitle>
            <CardDescription>
              Catalogo efetivo usado pelo RBAC, APIs, navegação e formularios governados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Permissao</TableHead>
                  <TableHead>Roles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.permissions.map((permission) => (
                  <TableRow key={permission.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{permission.key}</span>
                        <span className="text-muted-foreground text-xs">
                          {permission.description ?? "Sem descricao"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{permission.roleCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function AdminAccessState({
  message,
  status,
  title,
}: {
  message: string;
  status: string;
  title: string;
}) {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <Card>
        <CardHeader className="gap-3">
          <Badge variant="warning">{status}</Badge>
          <CardTitle>{title}</CardTitle>
          <CardDescription className="leading-6">{message}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/35 p-4">
      <span className="text-muted-foreground text-xs uppercase tracking-[0.14em]">{label}</span>
      <p className="mt-2 font-semibold text-2xl">{value}</p>
    </div>
  );
}

function ContextRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border bg-muted/35 px-3 py-2">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="max-w-[70%] text-right font-medium text-sm">{value}</span>
    </div>
  );
}

function resolveMembershipStatusVariant(
  status: keyof typeof membershipStatusLabels,
): "outline" | "success" | "warning" | "destructive" {
  if (status === "active") {
    return "success";
  }

  if (status === "suspended" || status === "removed") {
    return "destructive";
  }

  return "warning";
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
