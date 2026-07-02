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
import type { AdminMembershipStatusFormState } from "../../app/(platform)/app/admin/form-state";

export type AdminMembershipLifecycleMemberOption = {
  membershipId: string;
  name: string;
  email: string;
  status: string;
};

export type AdminMembershipStatusFormProps = {
  canManageMemberships: boolean;
  initialState: AdminMembershipStatusFormState;
  members: readonly AdminMembershipLifecycleMemberOption[];
  action: (
    previousState: AdminMembershipStatusFormState,
    formData: FormData,
  ) => Promise<AdminMembershipStatusFormState>;
};

export function AdminMembershipStatusForm({
  action,
  canManageMemberships,
  initialState,
  members,
}: AdminMembershipStatusFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    createIdempotencyKey("admin_membership_status"),
  );
  const isDisabled = isPending || !canManageMemberships || members.length === 0;

  useEffect(() => {
    if (state.status === "success") {
      setIdempotencyKey(createIdempotencyKey("admin_membership_status"));
    }
  }, [state.status]);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canManageMemberships ? "success" : "warning"}>
            {canManageMemberships ? "Lifecycle" : "Indisponível"}
          </Badge>
          <Badge variant="outline">active/suspended/removed</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Atualizar membership</CardTitle>
          <CardDescription className="leading-6">
            Ativa, suspende ou remove acesso. Sessão removida perde permissões porque o resolver só
            aceita memberships `active`.
          </CardDescription>
        </div>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <FieldGroup>
            <input name="idempotencyKey" type="hidden" value={idempotencyKey} />
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="adminMembershipStatusMember">Utilizador</FieldLabel>
              <SelectNative
                disabled={isDisabled}
                id="adminMembershipStatusMember"
                name="membershipId"
                required
              >
                {members.map((member) => (
                  <option key={member.membershipId} value={member.membershipId}>
                    {member.name} ({member.email}) · {member.status}
                  </option>
                ))}
              </SelectNative>
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="adminMembershipStatus">Novo status</FieldLabel>
              <SelectNative disabled={isDisabled} id="adminMembershipStatus" name="status" required>
                <option value="active">Ativo</option>
                <option value="suspended">Suspenso</option>
                <option value="removed">Removido</option>
              </SelectNative>
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="adminMembershipStatusReason">Motivo</FieldLabel>
              <Textarea
                disabled={isDisabled}
                id="adminMembershipStatusReason"
                name="reason"
                placeholder="Ex.: Revisão operacional aprovada pelo security admin."
                required
              />
            </Field>
            <Field>
              <FieldDescription>{state.message}</FieldDescription>
              {state.status === "error" ? <FieldError>{state.message}</FieldError> : null}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter>
          <Button disabled={isDisabled} type="submit">
            {isPending ? "A atualizar..." : "Atualizar membership"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
