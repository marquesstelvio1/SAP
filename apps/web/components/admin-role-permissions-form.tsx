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
  Textarea,
} from "@saptm/ui";
import { useActionState, useEffect, useState } from "react";

import type { AdminRolePermissionsFormState } from "../app/(platform)/app/admin/form-state";

export type AdminRolePermissionRoleOption = {
  id: string;
  key: string;
  name: string;
  protected: boolean;
  permissions: readonly string[];
};

export type AdminRolePermissionsFormProps = {
  canManageRoles: boolean;
  initialState: AdminRolePermissionsFormState;
  roles: readonly AdminRolePermissionRoleOption[];
  action: (
    previousState: AdminRolePermissionsFormState,
    formData: FormData,
  ) => Promise<AdminRolePermissionsFormState>;
};

export function AdminRolePermissionsForm({
  action,
  canManageRoles,
  initialState,
  roles,
}: AdminRolePermissionsFormProps) {
  const customRoles = roles.filter((role) => !role.protected);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [idempotencyKey, setIdempotencyKey] = useState(() => createIdempotencyKey("permissions"));
  const isDisabled = isPending || !canManageRoles || customRoles.length === 0;

  useEffect(() => {
    if (state.status === "success") {
      setIdempotencyKey(createIdempotencyKey("permissions"));
    }
  }, [state.status]);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canManageRoles ? "success" : "warning"}>
            {canManageRoles ? "Permissoes custom" : "Sem permissao"}
          </Badge>
          <Badge variant="outline">templates protegidos</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Atualizar permissoes</CardTitle>
          <CardDescription className="leading-6">
            Substitui o conjunto de permissoes de uma role custom. Roles bootstrap nao podem ser
            alteradas pela UI.
          </CardDescription>
        </div>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <FieldGroup>
            <input name="idempotencyKey" type="hidden" value={idempotencyKey} />
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="adminRolePermissionsRole">Role custom</FieldLabel>
              <SelectNative
                disabled={isDisabled}
                id="adminRolePermissionsRole"
                name="roleId"
                required
              >
                {customRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name} ({role.key})
                  </option>
                ))}
              </SelectNative>
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="adminRolePermissionsKeys">Novo conjunto</FieldLabel>
              <Textarea
                disabled={isDisabled}
                id="adminRolePermissionsKeys"
                name="permissionKeys"
                placeholder="cargo.read, capacity.read"
                required
              />
              <FieldDescription>
                Informe o conjunto completo. A operacao e transacional e auditavel.
              </FieldDescription>
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
          <Button disabled={isDisabled} type="submit">
            {isPending ? "A atualizar..." : "Atualizar permissoes"}
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
