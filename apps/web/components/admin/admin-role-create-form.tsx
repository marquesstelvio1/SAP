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
import { useCaptureEvent } from "@/hooks/use-capture-event";
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
}: AdminRoleCreateFormProps) {
  const capture = useCaptureEvent();
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    createIdempotencyKey("admin_role_create"),
  );
  const isDisabled = isPending || !canManageRoles;

  useEffect(() => {
    if (state.status === "success") {
      setIdempotencyKey(createIdempotencyKey("admin_role_create"));
      capture("settings:role_created", {
        role_id: state.roleId,
        role_key: state.roleKey,
      });
    }
  }, [state.status]);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canManageRoles ? "success" : "warning"}>
            {canManageRoles ? "Perfis personalizados" : "Indisponível"}
          </Badge>
          <Badge variant="outline">Permissões de administracao</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Criar perfil personalizado</CardTitle>
          <CardDescription className="leading-6">
            Crie roles personalizadas com permissões selecionadas.
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
                placeholder="Ler cargas, Ler tracking"
                required
              />
              <FieldDescription>
                Separe por vírgula ou linha. Use o catalogo de permissões como referencia.
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
            {isPending ? "A criar..." : "Criar perfil"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
