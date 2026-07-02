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
  Input,
  Textarea,
} from "@saptm/ui";
import { useActionState, useEffect, useState } from "react";

import { createIdempotencyKey } from "@/lib/idempotency";
import type { AdminRoleCreateFormState } from "../../app/(platform)/app/admin/form-state";

export type AdminPermissionOption = {
  key: string;
  description?: string | null;
};

export type AdminRoleCreateFormProps = {
  canManageRoles: boolean;
  initialState: AdminRoleCreateFormState;
  permissions: readonly AdminPermissionOption[];
  action: (
    previousState: AdminRoleCreateFormState,
    formData: FormData,
  ) => Promise<AdminRoleCreateFormState>;
};

export function AdminRoleCreateForm({
  action,
  canManageRoles,
  initialState,
  permissions,
}: AdminRoleCreateFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    createIdempotencyKey("admin_role_create"),
  );
  const isDisabled = isPending || !canManageRoles;

  useEffect(() => {
    if (state.status === "success") {
      setIdempotencyKey(createIdempotencyKey("admin_role_create"));
    }
  }, [state.status]);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canManageRoles ? "success" : "warning"}>
            {canManageRoles ? "Roles custom" : "Indisponível"}
          </Badge>
          <Badge variant="outline">Permissoes de administracao</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Criar role custom</CardTitle>
          <CardDescription className="leading-6">
            Crie roles personalizadas com permissoes selecionadas.
          </CardDescription>
        </div>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <FieldGroup>
            <input name="idempotencyKey" type="hidden" value={idempotencyKey} />
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="adminRoleCreateKey">Key</FieldLabel>
              <Input
                disabled={isDisabled}
                id="adminRoleCreateKey"
                name="key"
                placeholder="ex.: supervisor_de_terminal"
                required
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="adminRoleCreateName">Nome</FieldLabel>
              <Input
                disabled={isDisabled}
                id="adminRoleCreateName"
                name="name"
                placeholder="Yard Supervisor"
                required
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="adminRoleCreateDescription">Descrição</FieldLabel>
              <Textarea
                disabled={isDisabled}
                id="adminRoleCreateDescription"
                name="description"
                placeholder="Role custom para supervisores de pátio e terminal."
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="adminRoleCreatePermissions">Permissões</FieldLabel>
              <Textarea
                disabled={isDisabled}
                id="adminRoleCreatePermissions"
                name="permissionKeys"
                placeholder="cargo.read, tracking.shipment.read"
                required
              />
              <FieldDescription>
                Separe por vírgula ou linha. Catálogo disponível:{" "}
                {permissions.map((permission) => permission.key).join(", ")}
              </FieldDescription>
            </Field>
            <Field>
              <FieldDescription>{state.message}</FieldDescription>
              {state.status === "error" ? <FieldError>{state.message}</FieldError> : null}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter>
          <Button disabled={isDisabled} type="submit">
            {isPending ? "A criar..." : "Criar role"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
