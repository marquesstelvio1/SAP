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
  Input,
  SelectNative,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@saptm/ui";
import { useActionState, useEffect, useState } from "react";

import { createIdempotencyKey } from "@/lib/idempotency";
import type {
  AdminRoleCreateFormState,
  AdminRolePermissionsFormState,
} from "../../app/(platform)/app/admin/form-state";

export type AdminPermissionOption = {
  key: string;
  description?: string | null;
};

export type AdminRoleManageRoleOption = {
  id: string;
  key: string;
  name: string;
  protected: boolean;
  permissions: readonly string[];
};

export type AdminRoleManageFormProps = {
  canManageRoles: boolean;
  createInitialState: AdminRoleCreateFormState;
  permissionsInitialState: AdminRolePermissionsFormState;
  permissions: readonly AdminPermissionOption[];
  roles: readonly AdminRoleManageRoleOption[];
  createAction: (
    previousState: AdminRoleCreateFormState,
    formData: FormData,
  ) => Promise<AdminRoleCreateFormState>;
  permissionsAction: (
    previousState: AdminRolePermissionsFormState,
    formData: FormData,
  ) => Promise<AdminRolePermissionsFormState>;
};

export function AdminRoleManageForm({
  canManageRoles,
  createInitialState,
  permissionsInitialState,
  permissions,
  roles,
  createAction,
  permissionsAction,
}: AdminRoleManageFormProps) {
  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canManageRoles ? "success" : "warning"}>
            {canManageRoles ? "Roles custom" : "Indisponível"}
          </Badge>
          <Badge variant="outline">Gestao de roles</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Gerir roles</CardTitle>
          <CardDescription className="leading-6">
            Crie roles personalizadas ou atualize as permissões de roles existentes.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="create">
          <TabsList>
            <TabsTrigger value="create">Criar role</TabsTrigger>
            <TabsTrigger value="permissions">Atualizar permissoes</TabsTrigger>
          </TabsList>
          <TabsContent value="create">
            <CreateRoleSection
              action={createAction}
              canManageRoles={canManageRoles}
              initialState={createInitialState}
              permissions={permissions}
            />
          </TabsContent>
          <TabsContent value="permissions">
            <PermissionsSection
              action={permissionsAction}
              canManageRoles={canManageRoles}
              initialState={permissionsInitialState}
              roles={roles}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function CreateRoleSection({
  action,
  canManageRoles,
  initialState,
  permissions,
}: {
  action: AdminRoleManageFormProps["createAction"];
  canManageRoles: boolean;
  initialState: AdminRoleCreateFormState;
  permissions: readonly AdminPermissionOption[];
}) {
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
    <form action={formAction} className="mt-4">
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
          <FieldLabel htmlFor="adminRoleCreateDescription">Descricao</FieldLabel>
          <Textarea
            disabled={isDisabled}
            id="adminRoleCreateDescription"
            name="description"
            placeholder="Role custom para supervisores de patio e terminal."
          />
        </Field>
        <Field data-disabled={isDisabled}>
          <FieldLabel htmlFor="adminRoleCreatePermissions">Permissoes</FieldLabel>
          <Textarea
            disabled={isDisabled}
            id="adminRoleCreatePermissions"
            name="permissionKeys"
            placeholder="cargo.read, tracking.shipment.read"
            required
          />
          <FieldDescription>
            Separe por virgula ou linha. Catalogo disponivel:{" "}
            {permissions.map((permission) => permission.key).join(", ")}
          </FieldDescription>
        </Field>
        <Field>
          <FieldDescription>{state.message}</FieldDescription>
          {state.status === "error" ? <FieldError>{state.message}</FieldError> : null}
        </Field>
      </FieldGroup>
      <Button className="mt-4" disabled={isDisabled} type="submit">
        {isPending ? "A criar..." : "Criar role"}
      </Button>
    </form>
  );
}

function PermissionsSection({
  action,
  canManageRoles,
  initialState,
  roles,
}: {
  action: AdminRoleManageFormProps["permissionsAction"];
  canManageRoles: boolean;
  initialState: AdminRolePermissionsFormState;
  roles: readonly AdminRoleManageRoleOption[];
}) {
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
    <form action={formAction} className="mt-4">
      <FieldGroup>
        <input name="idempotencyKey" type="hidden" value={idempotencyKey} />
        <Field data-disabled={isDisabled}>
          <FieldLabel htmlFor="adminRolePermissionsRole">Role custom</FieldLabel>
          <SelectNative disabled={isDisabled} id="adminRolePermissionsRole" name="roleId" required>
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
            Informe o conjunto completo. A operacao e transacional e auditavel.
          </FieldDescription>
        </Field>
        <Field>
          <FieldDescription>{state.message}</FieldDescription>
          {state.status === "error" ? <FieldError>{state.message}</FieldError> : null}
        </Field>
      </FieldGroup>
      <Button className="mt-4" disabled={isDisabled} type="submit">
        {isPending ? "A atualizar..." : "Atualizar permissoes"}
      </Button>
    </form>
  );
}
