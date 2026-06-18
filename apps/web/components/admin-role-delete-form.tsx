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

import type { AdminRoleDeleteFormState } from "../app/(platform)/app/admin/form-state";

export type AdminRoleDeleteOption = {
  id: string;
  key: string;
  name: string;
  protected: boolean;
  membershipCount: number;
};

export type AdminRoleDeleteFormProps = {
  canManageRoles: boolean;
  initialState: AdminRoleDeleteFormState;
  roles: readonly AdminRoleDeleteOption[];
  action: (
    previousState: AdminRoleDeleteFormState,
    formData: FormData,
  ) => Promise<AdminRoleDeleteFormState>;
};

export function AdminRoleDeleteForm({
  action,
  canManageRoles,
  initialState,
  roles,
}: AdminRoleDeleteFormProps) {
  const deletableRoles = roles.filter((role) => !role.protected && role.membershipCount === 0);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [idempotencyKey, setIdempotencyKey] = useState(() => createIdempotencyKey("delete"));
  const isDisabled = isPending || !canManageRoles || deletableRoles.length === 0;

  useEffect(() => {
    if (state.status === "success") {
      setIdempotencyKey(createIdempotencyKey("delete"));
    }
  }, [state.status]);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canManageRoles ? "success" : "warning"}>
            {canManageRoles ? "Delete custom" : "Sem permissao"}
          </Badge>
          <Badge variant="outline">sem membros</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Eliminar role custom</CardTitle>
          <CardDescription className="leading-6">
            Apenas roles custom sem memberships podem ser eliminadas. Templates bootstrap ficam
            protegidos.
          </CardDescription>
        </div>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <FieldGroup>
            <input name="idempotencyKey" type="hidden" value={idempotencyKey} />
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="adminRoleDeleteRole">Role custom</FieldLabel>
              <SelectNative disabled={isDisabled} id="adminRoleDeleteRole" name="roleId" required>
                {deletableRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name} ({role.key})
                  </option>
                ))}
              </SelectNative>
            </Field>
            <Field>
              <FieldDescription>
                {state.status === "success" && state.roleKey !== undefined
                  ? `${state.message} Role: ${state.roleKey}`
                  : state.message}
              </FieldDescription>
              {state.status === "error" ? <FieldError>{state.message}</FieldError> : null}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter>
          <Button disabled={isDisabled} type="submit" variant="destructive">
            {isPending ? "A eliminar..." : "Eliminar role"}
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
