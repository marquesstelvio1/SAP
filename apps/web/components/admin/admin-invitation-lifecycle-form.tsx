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
import type { AdminInvitationLifecycleFormState } from "../../app/(platform)/app/admin/form-state";

export type AdminInvitationMemberOption = {
  membershipId: string;
  name: string;
  email: string;
};

export type AdminInvitationLifecycleFormProps = {
  actionLabel: string;
  canManageInvitations: boolean;
  initialState: AdminInvitationLifecycleFormState;
  members: readonly AdminInvitationMemberOption[];
  requiresReason?: boolean;
  title: string;
  description: string;
  action: (
    previousState: AdminInvitationLifecycleFormState,
    formData: FormData,
  ) => Promise<AdminInvitationLifecycleFormState>;
};

export function AdminInvitationLifecycleForm({
  action,
  actionLabel,
  canManageInvitations,
  description,
  initialState,
  members,
  requiresReason = false,
  title,
}: AdminInvitationLifecycleFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    createIdempotencyKey("admin_invitation"),
  );
  const isDisabled = isPending || !canManageInvitations || members.length === 0;

  useEffect(() => {
    if (state.status === "success") {
      setIdempotencyKey(createIdempotencyKey("admin_invitation"));
    }
  }, [state.status]);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canManageInvitations ? "success" : "warning"}>
            {canManageInvitations ? "Convites" : "Indisponível"}
          </Badge>
          <Badge variant="outline">Convidar utilizador</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>{title}</CardTitle>
          <CardDescription className="leading-6">{description}</CardDescription>
        </div>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <FieldGroup>
            <input name="idempotencyKey" type="hidden" value={idempotencyKey} />
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor={`${title}-membership`}>Convite</FieldLabel>
              <SelectNative
                disabled={isDisabled}
                id={`${title}-membership`}
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
            {requiresReason ? (
              <Field data-disabled={isDisabled}>
                <FieldLabel htmlFor={`${title}-reason`}>Motivo</FieldLabel>
                <Textarea
                  disabled={isDisabled}
                  id={`${title}-reason`}
                  name="reason"
                  placeholder="Ex.: convite enviado para equipa incorreta."
                  required
                />
              </Field>
            ) : null}
            <Field>
              <FieldDescription>{state.message}</FieldDescription>
              {state.status === "error" ? <FieldError>{state.message}</FieldError> : null}
            </Field>
            {state.status === "success" && state.invitationAcceptUrl !== undefined ? (
              <Field>
                <FieldLabel htmlFor={`${title}-accept-url`}>Link de aceite</FieldLabel>
                <Textarea id={`${title}-accept-url`} readOnly value={state.invitationAcceptUrl} />
                <FieldDescription>
                  Valido até {state.invitationExpiresAt ?? "validade não informada"}.
                </FieldDescription>
              </Field>
            ) : null}
          </FieldGroup>
        </CardContent>
        <CardFooter>
          <Button disabled={isDisabled} type="submit">
            {isPending ? "A processar..." : actionLabel}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
