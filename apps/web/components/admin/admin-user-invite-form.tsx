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
  SelectNative,
} from "@saptm/ui";
import { useActionState, useEffect, useState } from "react";
import { useCaptureEvent } from "@/hooks/use-capture-event";
import { createIdempotencyKey } from "@/lib/idempotency";
import type { AdminUserInviteFormState } from "../../app/(platform)/app/admin/form-state";

export type AdminUserInviteRoleOption = {
  key: string;
  name: string;
};

export type AdminUserInviteFormProps = {
  canInviteUser: boolean;
  initialState: AdminUserInviteFormState;
  roles: readonly AdminUserInviteRoleOption[];
  action: (
    previousState: AdminUserInviteFormState,
    formData: FormData,
  ) => Promise<AdminUserInviteFormState>;
};

export function AdminUserInviteForm({
  action,
  canInviteUser,
  initialState,
  roles,
}: AdminUserInviteFormProps) {
  const capture = useCaptureEvent();
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [idempotencyKey, setIdempotencyKey] = useState(() => createIdempotencyKey("admin_invite"));
  const isDisabled = isPending || !canInviteUser;

  useEffect(() => {
    if (state.status === "success") {
      setIdempotencyKey(createIdempotencyKey("admin_invite"));
      capture("settings:member_invited", {
        user_id: state.userId,
        membership_id: state.membershipId,
        email: state.email,
      });
    }
  }, [state.status]);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canInviteUser ? "success" : "warning"}>
            {canInviteUser ? "Convite autorizado" : "Indisponível"}
          </Badge>
          <Badge variant="outline">Convite de utilizador</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Convidar utilizador</CardTitle>
          <CardDescription className="leading-6">
            Cria ou reativa o membro da organização, associa um perfil inicial opcional e envia a
            notificação de convite.
          </CardDescription>
        </div>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <FieldGroup>
            <input name="idempotencyKey" type="hidden" value={idempotencyKey} />
            <Field data-disabled={!canInviteUser}>
              <FieldLabel htmlFor="adminInviteName">Nome</FieldLabel>
              <Input
                disabled={isDisabled}
                id="adminInviteName"
                name="name"
                placeholder="Ex.: Operador Ferro-Portuario"
                required
              />
            </Field>
            <Field data-disabled={!canInviteUser}>
              <FieldLabel htmlFor="adminInviteEmail">Email</FieldLabel>
              <Input
                disabled={isDisabled}
                id="adminInviteEmail"
                name="email"
                placeholder="operador@saptm.local"
                required
                type="email"
              />
            </Field>
            <Field data-disabled={!canInviteUser}>
              <FieldLabel htmlFor="adminInviteRoleKey">Perfil inicial</FieldLabel>
              <SelectNative disabled={isDisabled} id="adminInviteRoleKey" name="roleKey">
                <option value="">Sem perfil inicial</option>
                {roles.map((role) => (
                  <option key={role.key} value={role.key}>
                    {role.name}
                  </option>
                ))}
              </SelectNative>
              <FieldDescription>
                Use um perfil existente da organização; novos perfis são geridos pelo administrador.
              </FieldDescription>
            </Field>
            <Field>
              <FieldDescription>{state.message}</FieldDescription>
              {state.status === "error" ? <FieldError>{state.message}</FieldError> : null}
            </Field>
            {state.status === "success" && state.invitationAcceptUrl !== undefined ? (
              <Field>
                <FieldLabel htmlFor="adminInviteAcceptUrl">Link de aceite</FieldLabel>
                <Input id="adminInviteAcceptUrl" readOnly value={state.invitationAcceptUrl} />
                <FieldDescription>
                  Válido até {state.invitationExpiresAt ?? "validade nao informada"}. Em dev, o
                  mesmo link tambem segue nas notificacoes.
                </FieldDescription>
              </Field>
            ) : null}
          </FieldGroup>
        </CardContent>
        <CardFooter>
          <Button disabled={isDisabled} type="submit">
            {isPending ? "A convidar..." : "Convidar utilizador"}
          </Button>
          <span className="text-muted-foreground text-xs">
            {canInviteUser ? "Revalida a pagina admin apos sucesso." : "Requer convite."}
          </span>
        </CardFooter>
      </form>
    </Card>
  );
}
