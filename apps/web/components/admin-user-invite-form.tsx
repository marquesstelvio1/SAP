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

import type { AdminUserInviteFormState } from "../app/(platform)/app/admin/form-state";

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
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [idempotencyKey, setIdempotencyKey] = useState(createIdempotencyKey);
  const isDisabled = isPending || !canInviteUser;

  useEffect(() => {
    if (state.status === "success") {
      setIdempotencyKey(createIdempotencyKey());
    }
  }, [state.status]);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canInviteUser ? "success" : "warning"}>
            {canInviteUser ? "Convite governado" : "Sem permissao"}
          </Badge>
          <Badge variant="outline">identity.user.invite</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Convidar utilizador</CardTitle>
          <CardDescription className="leading-6">
            Cria ou reativa membership no tenant, associa uma role inicial opcional, grava audit
            trail e emite evento de outbox para o fluxo de convite.
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
              <FieldLabel htmlFor="adminInviteRoleKey">Role inicial</FieldLabel>
              <SelectNative disabled={isDisabled} id="adminInviteRoleKey" name="roleKey">
                <option value="">Sem role inicial</option>
                {roles.map((role) => (
                  <option key={role.key} value={role.key}>
                    {role.name} ({role.key})
                  </option>
                ))}
              </SelectNative>
              <FieldDescription>
                Use uma role bootstrap do tenant; novas roles entram por governanca RBAC.
              </FieldDescription>
            </Field>
            <Field>
              <FieldDescription>
                {state.status === "success" && state.email !== undefined
                  ? `${state.message} Email: ${state.email} · Membership: ${
                      state.membershipId ?? "sem-id"
                    } · Replay: ${state.replayed ? "sim" : "nao"}`
                  : state.message}
              </FieldDescription>
              {state.status === "error" ? <FieldError>{state.message}</FieldError> : null}
            </Field>
            {state.status === "success" && state.invitationAcceptUrl !== undefined ? (
              <Field>
                <FieldLabel htmlFor="adminInviteAcceptUrl">Link de aceite</FieldLabel>
                <Input id="adminInviteAcceptUrl" readOnly value={state.invitationAcceptUrl} />
                <FieldDescription>
                  Valido ate {state.invitationExpiresAt ?? "validade nao informada"}. Em dev, o
                  mesmo link tambem segue no outbox/notificacoes.
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

function createIdempotencyKey(): string {
  const randomValue =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return `admin_invite_${randomValue}`;
}
