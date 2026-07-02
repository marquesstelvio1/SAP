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

import { createIdempotencyKey } from "@/lib/idempotency";
import type { AdminRolePermissionsFormState } from "../../app/(platform)/app/admin/form-state";

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
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    createIdempotencyKey("admin_role_permissions"),
  );
  const isDisabled = isPending || !canManageRoles || customRoles.length === 0;

  useEffect(() => {
    if (state.status === "success") {
      setIdempotencyKey(createIdempotencyKey("admin_role_permissions"));
    }
  }, [state.status]);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canManageRoles ? "success" : "warning"}>
            {canManageRoles ? "Permissões custom" : "Indisponível"}
          </Badge>
          <Badge variant="outline">templates protegidos</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Atualizar permissões</CardTitle>
          <CardDescription className="leading-6">
            Substitui o conjunto de permissões de uma role custom. Roles base não podem ser
            alteradas pela interface.
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
                    {role.name}
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
                Informe o conjunto completo. A operação é transacional e auditável.
              </FieldDescription>
            </Field>
            <Field>
              <FieldDescription>
                {state.message}
              </FieldDescription>
              {state.status === "error" ? <FieldError>{state.message}</FieldError> : null}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter>
          <Button disabled={isDisabled} type="submit">
            {isPending ? "A atualizar..." : "Atualizar permissões"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
