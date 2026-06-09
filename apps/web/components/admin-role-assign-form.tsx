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

import type { AdminRoleAssignFormState } from "../app/(platform)/app/admin/form-state";

export type AdminRoleAssignMemberOption = {
  membershipId: string;
  name: string;
  email: string;
};

export type AdminRoleAssignRoleOption = {
  id: string;
  key: string;
  name: string;
};

export type AdminRoleAssignFormProps = {
  canAssignRole: boolean;
  initialState: AdminRoleAssignFormState;
  members: readonly AdminRoleAssignMemberOption[];
  roles: readonly AdminRoleAssignRoleOption[];
  action: (
    previousState: AdminRoleAssignFormState,
    formData: FormData,
  ) => Promise<AdminRoleAssignFormState>;
};

export function AdminRoleAssignForm({
  action,
  canAssignRole,
  initialState,
  members,
  roles,
}: AdminRoleAssignFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [idempotencyKey, setIdempotencyKey] = useState(createIdempotencyKey);
  const isDisabled = isPending || !canAssignRole || members.length === 0 || roles.length === 0;

  useEffect(() => {
    if (state.status === "success") {
      setIdempotencyKey(createIdempotencyKey());
    }
  }, [state.status]);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canAssignRole ? "success" : "warning"}>
            {canAssignRole ? "RBAC governado" : "Sem permissao"}
          </Badge>
          <Badge variant="outline">identity.role.assign</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Atribuir role</CardTitle>
          <CardDescription className="leading-6">
            Liga um membership ativo ou convidado a uma role do tenant. A API impede escopo fora da
            organizacao e registra audit/outbox.
          </CardDescription>
        </div>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
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
              <FieldLabel htmlFor="adminAssignRoleId">Role</FieldLabel>
              <SelectNative disabled={isDisabled} id="adminAssignRoleId" name="roleId" required>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name} ({role.key})
                  </option>
                ))}
              </SelectNative>
              <FieldDescription>
                Roles sao tenant-scoped e carregadas do contrato administrativo.
              </FieldDescription>
            </Field>
            <Field>
              <FieldDescription>
                {state.status === "success" && state.roleKey !== undefined
                  ? `${state.message} Role: ${state.roleKey} · Membership: ${
                      state.membershipId ?? "sem-id"
                    } · Replay: ${state.replayed ? "sim" : "nao"}`
                  : state.message}
              </FieldDescription>
              {state.status === "error" ? <FieldError>{state.message}</FieldError> : null}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter>
          <Button disabled={isDisabled} type="submit">
            {isPending ? "A atribuir..." : "Atribuir role"}
          </Button>
          <span className="text-muted-foreground text-xs">
            {canAssignRole ? "Atribuicao auditavel." : "Requer identity.role.assign."}
          </span>
        </CardFooter>
      </form>
    </Card>
  );
}

function createIdempotencyKey(): string {
  const randomValue =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return `admin_assign_${randomValue}`;
}
