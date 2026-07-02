"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Badge,
  Button,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  SelectNative,
} from "@saptm/ui";
import { useActionState, useEffect, useState } from "react";

import { createIdempotencyKey } from "@/lib/idempotency";
import type { AdminRoleDeleteFormState } from "../../app/(platform)/app/admin/form-state";

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
  const [open, setOpen] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    createIdempotencyKey("admin_role_delete"),
  );
  const isDisabled = isPending || !canManageRoles || deletableRoles.length === 0;

  useEffect(() => {
    if (state.status === "success") {
      setIdempotencyKey(createIdempotencyKey("admin_role_delete"));
      setOpen(false);
    }
  }, [state.status]);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          disabled={!canManageRoles || deletableRoles.length === 0}
          variant="destructive"
          size="sm"
        >
          Eliminar role
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={canManageRoles ? "success" : "warning"}>
              {canManageRoles ? "Delete custom" : "Indisponível"}
            </Badge>
            <Badge variant="outline">sem membros</Badge>
          </div>
          <AlertDialogTitle>Eliminar role custom</AlertDialogTitle>
          <AlertDialogDescription>
            Apenas roles custom sem memberships podem ser eliminadas. Templates bootstrap ficam
            protegidos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form action={formAction} className="space-y-4">
          <input name="idempotencyKey" type="hidden" value={idempotencyKey} />
          <Field data-disabled={isDisabled}>
            <FieldLabel htmlFor="adminRoleDeleteRole">Role custom</FieldLabel>
            <SelectNative disabled={isDisabled} id="adminRoleDeleteRole" name="roleId" required>
              {deletableRoles.length === 0 ? (
                <option value="">Nenhuma role disponivel</option>
              ) : (
                deletableRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name} ({role.key})
                  </option>
                ))
              )}
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
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
            <Button disabled={isDisabled} type="submit" variant="destructive">
              {isPending ? "A eliminar..." : "Eliminar"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
