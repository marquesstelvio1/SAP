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
} from "@saptm/ui";
import type { Route } from "next";
import Link from "next/link";
import { useActionState } from "react";

import type { AcceptInvitationFormState } from "../../app/accept-invitation/form-state";

export type InvitationAcceptFormProps = {
  action: (
    previousState: AcceptInvitationFormState,
    formData: FormData,
  ) => Promise<AcceptInvitationFormState>;
  initialState: AcceptInvitationFormState;
  token: string;
};

export function InvitationAcceptForm({ action, initialState, token }: InvitationAcceptFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const isSuccess = state.status === "success";

  return (
    <Card className="w-full max-w-lg border-border/80 shadow-overlay">
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="info">Convite SAPTM</Badge>
          <Badge variant={isSuccess ? "success" : "outline"}>
            {isSuccess ? "Ativo" : "Onboarding"}
          </Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Ativar acesso empresarial</CardTitle>
          <CardDescription className="leading-6">
            O convite ativa a adesão à organização, verifica o email e cria a credencial de acesso
            com password corporativa.
          </CardDescription>
        </div>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <FieldGroup>
            <input name="token" type="hidden" value={token} />
            <Field data-disabled={isSuccess}>
              <FieldLabel htmlFor="acceptInvitationName">Nome completo</FieldLabel>
              <Input
                disabled={isPending || isSuccess}
                id="acceptInvitationName"
                name="name"
                placeholder="Ex.: Operador Ferro-Portuário"
              />
            </Field>
            <Field data-disabled={isSuccess}>
              <FieldLabel htmlFor="acceptInvitationPassword">Password</FieldLabel>
              <Input
                autoComplete="new-password"
                disabled={isPending || isSuccess}
                id="acceptInvitationPassword"
                maxLength={128}
                minLength={12}
                name="password"
                required
                type="password"
              />
              <FieldDescription>Minimo de 12 caracteres e maximo de 128.</FieldDescription>
            </Field>
            <Field data-disabled={isSuccess}>
              <FieldLabel htmlFor="acceptInvitationPasswordConfirmation">
                Confirmar password
              </FieldLabel>
              <Input
                autoComplete="new-password"
                disabled={isPending || isSuccess}
                id="acceptInvitationPasswordConfirmation"
                maxLength={128}
                minLength={12}
                name="passwordConfirmation"
                required
                type="password"
              />
            </Field>
            <Field>
              <FieldDescription>
                {isSuccess && state.email !== undefined
                  ? `${state.message} Email: ${state.email}`
                  : state.message}
              </FieldDescription>
              {state.status === "error" ? <FieldError>{state.message}</FieldError> : null}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter>
          {isSuccess ? (
            <Button asChild>
              <Link href={"/sign-in" as Route}>Entrar na plataforma</Link>
            </Button>
          ) : (
            <Button disabled={isPending || token.length === 0} type="submit">
              {isPending ? "A ativar..." : "Aceitar convite"}
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
