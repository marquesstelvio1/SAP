"use client";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  SelectNative,
} from "@saptm/ui";
import { useActionState, useEffect, useState } from "react";

import type { AdminRoleRevokeFormState } from "../../app/(platform)/app/admin/form-state";

export type AdminRoleRevokeMemberOption = {
  membershipId: string;
  name: string;
  email: string;
  roles: readonly {
    id: string;
    key: string;
    name: string;
  }[];
};

export type AdminRoleRevokeFormProps = {
  canAssignRole: boolean;
  initialState: AdminRoleRevokeFormState;
  members: readonly AdminRoleRevokeMemberOption[];
  action: (
    previousState: AdminRoleRevokeFormState,
    formData: FormData,
  ) => Promise<AdminRoleRevokeFormState>;
};

export function AdminRoleRevokeForm({
  action,
  canAssignRole,
  initialState,
  members,
}: AdminRoleRevokeFormProps) {
  const assignedRoles = members.flatMap((member) =>
    member.roles.map((role) => ({
      membershipId: member.membershipId,
      memberLabel: `${member.name} (${member.email})`,
      ...role,
    })),
  );
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [idempotencyKey, setIdempotencyKey] = useState(() => createIdempotencyKey("revoke"));
  const isDisabled = isPending || !canAssignRole || assignedRoles.length === 0;

  useEffect(() => {
    if (state.status === "success") {
      setIdempotencyKey(createIdempotencyKey("revoke"));
    }
  }, [state.status]);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canAssignRole ? "success" : "warning"}>
            {canAssignRole ? "Revogacao RBAC" : "Sem permissao"}
          </Badge>
          <Badge variant="outline">anti-lockout</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Revogar role</CardTitle>
          <CardDescription className="leading-6">
            Remove uma role atribuida. A API bloqueia a remocao do ultimo `tenant.admin` ativo.
          </CardDescription>
        </div>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
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
              <FieldDescription>
                {state.status === "success" && state.roleKey !== undefined
                  ? `${state.message} Role: ${state.roleKey} · Replay: ${
                      state.replayed ? "sim" : "nao"
                    }`
                  : state.message}
              </FieldDescription>
              {state.status === "error" ? <FieldError>{state.message}</FieldError> : null}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter>
          <input name="membershipId" type="hidden" value="" />
          <input name="roleId" type="hidden" value="" />
          <Button disabled={isDisabled} type="submit">
            {isPending ? "A revogar..." : "Revogar role"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function createIdempotencyKey(scope: string): string {
  const randomValue =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return `admin_role_${scope}_${randomValue}`;
}
