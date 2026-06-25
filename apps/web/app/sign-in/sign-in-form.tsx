"use client";

import { useForm, zodResolver } from "@saptm/form";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
} from "@saptm/ui";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";

import { authClient } from "../../lib/auth-client";

const signInSchema = z.object({
  email: z.string().email("Email corporativo inválido"),
  password: z.string().min(12, "A password deve ter no mínimo 12 caracteres"),
  rememberMe: z.boolean().optional().default(false),
});

type SignInFormData = z.infer<typeof signInSchema>;

export function SignInForm({ nextPath }: { nextPath: string }) {
  const [serverError, setServerError] = useState<string | undefined>();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  async function onSubmit(data: SignInFormData) {
    setServerError(undefined);

    const response = await authClient.signIn.email({
      email: data.email,
      password: data.password,
      rememberMe: data.rememberMe,
      callbackURL: nextPath,
    });

    if (response.error !== null) {
      setServerError(
        response.error.message ?? "Credenciais inválidas ou email ainda não verificado.",
      );
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
        <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">Email corporativo</FieldLabel>
              <Input
                autoComplete="email"
                id="email"
                placeholder="operador@saptm.local"
                type="email"
                {...register("email")}
              />
              {errors.email && <FieldError>{errors.email.message}</FieldError>}
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                autoComplete="current-password"
                id="password"
                type="password"
                {...register("password")}
              />
              <div className="flex items-center justify-between">
                <FieldDescription>
                  Mínimo de 12 caracteres conforme política de auth.
                </FieldDescription>
                <Link
                  className="text-primary text-xs underline-offset-4 hover:underline"
                  href={"/forgot-password" as Route}
                >
                  Esqueceu-se da password?
                </Link>
              </div>
              {errors.password && <FieldError>{errors.password.message}</FieldError>}
            </Field>
            <Field orientation="horizontal">
              <Checkbox className="mt-0.5" id="rememberMe" {...register("rememberMe")} />
              <div className="flex flex-col gap-1">
                <FieldLabel htmlFor="rememberMe">Manter sessão ativa</FieldLabel>
                <FieldDescription>Usa a estratégia de sessão do Better Auth.</FieldDescription>
              </div>
            </Field>
          </FieldGroup>
          {serverError && <FieldError>{serverError}</FieldError>}
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
