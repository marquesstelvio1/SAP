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
} from "@saptm/ui";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";

import { authClient } from "../../lib/auth-client";

export function SignInForm({ nextPath }: { nextPath: string }) {
  const [error, setError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const rememberMe = formData.get("rememberMe") === "on";

    const response = await authClient.signIn.email({
      email,
      password,
      rememberMe,
      callbackURL: nextPath,
    });

    setIsSubmitting(false);

    if (response.error !== null) {
      setError(response.error.message ?? "Credenciais inválidas ou email ainda não verificado.");
      return;
    }

    if (requiresTwoFactor(response.data)) {
      router.replace(`/two-factor?next=${encodeURIComponent(nextPath)}` as Route);
      return;
    }

    router.replace(nextPath as Route);
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md border-border/80 shadow-overlay">
      <CardHeader className="gap-3">
        <div className="flex items-center justify-between gap-3">
          <Badge variant="info">Better Auth</Badge>
          <Badge variant="outline">Sessão real</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle className="text-2xl">Entrar na plataforma</CardTitle>
          <CardDescription>
            Autenticação local com sessão HTTP-only e resolução RBAC no shell.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">Email corporativo</FieldLabel>
              <Input
                autoComplete="email"
                id="email"
                name="email"
                placeholder="operador@saptm.local"
                required
                type="email"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                autoComplete="current-password"
                id="password"
                minLength={12}
                name="password"
                required
                type="password"
              />
              <FieldDescription>
                Mínimo de 12 caracteres conforme política de auth.
              </FieldDescription>
            </Field>
            <Field orientation="horizontal">
              <input
                className="mt-0.5 size-4 rounded border-input accent-primary"
                id="rememberMe"
                name="rememberMe"
                type="checkbox"
              />
              <div className="flex flex-col gap-1">
                <FieldLabel htmlFor="rememberMe">Manter sessão ativa</FieldLabel>
                <FieldDescription>Usa a estratégia de sessão do Better Auth.</FieldDescription>
              </div>
            </Field>
          </FieldGroup>
          <FieldError>{error}</FieldError>
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? "A validar..." : "Entrar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function requiresTwoFactor(value: unknown): boolean {
  if (typeof value !== "object" || value === null || !("twoFactorRedirect" in value)) {
    return false;
  }

  return (value as { twoFactorRedirect?: unknown }).twoFactorRedirect === true;
}
