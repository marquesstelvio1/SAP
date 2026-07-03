"use client";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  SelectNative,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@saptm/ui";
import { useActionState, useEffect, useState } from "react";

import { createIdempotencyKey } from "@/lib/idempotency";
import type {
  AdminRoleAssignFormState,
  AdminRoleRevokeFormState,
} from "../../app/(platform)/app/admin/form-state";

export type AdminUserManageMemberOption = {
  membershipId: string;
  name: string;
  email: string;
};

export type AdminUserManageRoleOption = {
  id: string;
  key: string;
  name: string;
};

export type AdminUserManageRevokeMemberOption = {
  membershipId: string;
  name: string;
  email: string;
  roles: readonly {
    id: string;
    key: string;
    name: string;
  }[];
};

export type AdminUserRoleManageFormProps = {
  canAssignRole: boolean;
  assignInitialState: AdminRoleAssignFormState;
  revokeInitialState: AdminRoleRevokeFormState;
  members: readonly AdminUserManageMemberOption[];
  roles: readonly AdminUserManageRoleOption[];
  revokeMembers: readonly AdminUserManageRevokeMemberOption[];
  assignAction: (
    previousState: AdminRoleAssignFormState,
    formData: FormData,
  ) => Promise<AdminRoleAssignFormState>;
  revokeAction: (
    previousState: AdminRoleRevokeFormState,
    formData: FormData,
  ) => Promise<AdminRoleRevokeFormState>;
};

export function AdminUserRoleManageForm({
  canAssignRole,
  assignInitialState,
  revokeInitialState,
  members,
  roles,
  revokeMembers,
  assignAction,
  revokeAction,
}: AdminUserRoleManageFormProps) {
  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canAssignRole ? "success" : "warning"}>
            {canAssignRole ? "Atribuicao autorizada" : "Indisponível"}
          </Badge>
          <Badge variant="outline">Perfis de utilizador</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Gerir perfis do utilizador</CardTitle>
          <CardDescription className="leading-6">
            Atribua ou revogue perfis de membros da organização.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="assign">
          <TabsList>
            <TabsTrigger value="assign">Atribuir perfil</TabsTrigger>
            <TabsTrigger value="revoke">Revogar perfil</TabsTrigger>
          </TabsList>
          <TabsContent value="assign">
            <AssignSection
              action={assignAction}
              canAssignRole={canAssignRole}
              initialState={assignInitialState}
              members={members}
              roles={roles}
            />
          </TabsContent>
          <TabsContent value="revoke">
            <RevokeSection
              action={revokeAction}
              canAssignRole={canAssignRole}
              initialState={revokeInitialState}
              members={revokeMembers}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function AssignSection({
  action,
  canAssignRole,
  initialState,
  members,
  roles,
}: {
  action: AdminUserRoleManageFormProps["assignAction"];
  canAssignRole: boolean;
  initialState: AdminRoleAssignFormState;
  members: readonly AdminUserManageMemberOption[];
  roles: readonly AdminUserManageRoleOption[];
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [idempotencyKey, setIdempotencyKey] = useState(() => createIdempotencyKey("admin_assign"));
  const isDisabled = isPending || !canAssignRole || members.length === 0 || roles.length === 0;

  useEffect(() => {
    if (state.status === "success") {
      setIdempotencyKey(createIdempotencyKey("admin_assign"));
    }
  }, [state.status]);

  return (
    <form action={formAction} className="mt-4">
      <FieldGroup>
        <input name="idempotencyKey" type="hidden" value={idempotencyKey} />
        <Field data-disabled={isDisabled}>
          <FieldLabel htmlFor="adminAssignMembershipId">Utilizador</FieldLabel>
          <SelectNative
            disabled={isDisabled}
            id="adminAssignMembershipId"
            name="membershipId"
            required
          >
            {members.map((member) => (
              <option key={member.membershipId} value={member.membershipId}>
                {member.name} ({member.email})
              </option>
            ))}
          </SelectNative>
        </Field>
        <Field data-disabled={isDisabled}>
          <FieldLabel htmlFor="adminAssignRoleId">Perfil</FieldLabel>
          <SelectNative disabled={isDisabled} id="adminAssignRoleId" name="roleId" required>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </SelectNative>
          <FieldDescription>Perfis disponíveis para esta organização.</FieldDescription>
        </Field>
        <Field>
          <FieldDescription>{state.message}</FieldDescription>
          {state.status === "error" ? <FieldError>{state.message}</FieldError> : null}
        </Field>
      </FieldGroup>
      <Button className="mt-4" disabled={isDisabled} type="submit">
        {isPending ? "A atribuir..." : "Atribuir role"}
      </Button>
    </form>
  );
}

function RevokeSection({
  action,
  canAssignRole,
  initialState,
  members,
}: {
  action: AdminUserRoleManageFormProps["revokeAction"];
  canAssignRole: boolean;
  initialState: AdminRoleRevokeFormState;
  members: readonly AdminUserManageRevokeMemberOption[];
}) {
  const assignedRoles = members.flatMap((member) =>
    member.roles.map((role) => ({
      membershipId: member.membershipId,
      memberLabel: `${member.name} (${member.email})`,
      ...role,
    })),
  );
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    createIdempotencyKey("admin_role_revoke"),
  );
  const isDisabled = isPending || !canAssignRole || assignedRoles.length === 0;

  useEffect(() => {
    if (state.status === "success") {
      setIdempotencyKey(createIdempotencyKey("admin_role_revoke"));
    }
  }, [state.status]);

  return (
    <form action={formAction} className="mt-4">
      <FieldGroup>
        <input name="idempotencyKey" type="hidden" value={idempotencyKey} />
        <Field data-disabled={isDisabled}>
          <FieldLabel htmlFor="adminRoleRevokeAssignment">Atribuicao</FieldLabel>
          <SelectNative
            disabled={isDisabled}
            id="adminRoleRevokeAssignment"
            name="assignment"
            required
          >
            {assignedRoles.map((assignment) => (
              <option
                key={`${assignment.membershipId}:${assignment.id}`}
                value={`${assignment.membershipId}:${assignment.id}`}
              >
                {assignment.memberLabel} · {assignment.key}
              </option>
            ))}
          </SelectNative>
        </Field>
        <Field>
          <FieldDescription>{state.message}</FieldDescription>
          {state.status === "error" ? <FieldError>{state.message}</FieldError> : null}
        </Field>
      </FieldGroup>
      <input name="membershipId" type="hidden" value="" />
      <input name="roleId" type="hidden" value="" />
      <Button className="mt-4" disabled={isDisabled} type="submit">
        {isPending ? "A revogar..." : "Revogar role"}
      </Button>
    </form>
  );
}
