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
} from "@saptm/ui";
import { useActionState } from "react";

import type { SessionRevocationFormState } from "../../app/(platform)/app/security/form-state";

export type SessionRevocationFormProps = {
  action: (
    previousState: SessionRevocationFormState,
    formData: FormData,
  ) => Promise<SessionRevocationFormState>;
  activeSessions: number;
  initialState: SessionRevocationFormState;
  otherSessions: number;
};

export function SessionRevocationForm({
  action,
  activeSessions,
  initialState,
  otherSessions,
}: SessionRevocationFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const hasOtherSessions = otherSessions > 0;

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={hasOtherSessions ? "warning" : "success"}>
            {hasOtherSessions ? `${otherSessions} outras sessões` : "Sessão única"}
          </Badge>
          <Badge variant="outline">Better Auth Session</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Revogação de sessões</CardTitle>
          <CardDescription>
            Remove todas as sessões do utilizador exceto a sessão atual e grava evento de segurança
            auditável.
          </CardDescription>
        </div>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldDescription>
                Sessoes ativas: {activeSessions}. Outras sessoes revogaveis: {otherSessions}.
              </FieldDescription>
            </Field>
            <Field>
              <FieldDescription>
                {state.status === "success" && state.revokedSessions !== undefined
                  ? `${state.message} Revogadas: ${state.revokedSessions}.`
                  : state.message}
              </FieldDescription>
              {state.status === "error" ? <FieldError>{state.message}</FieldError> : null}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter>
          <Button disabled={isPending || !hasOtherSessions} type="submit">
            {isPending ? "A revogar..." : "Revogar outras sessoes"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
