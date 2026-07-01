"use client";

import { useForm, zodResolver } from "@saptm/form";
import {
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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { z } from "zod";
import type { ResetPasswordFormState } from "./actions";
import { resetPasswordAction } from "./actions";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(12, "A password deve ter no mínimo 12 caracteres")
      .max(128, "A password deve ter no máximo 128 caracteres"),
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "As passwords não coincidem",
    path: ["passwordConfirmation"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [state, setState] = useState<ResetPasswordFormState>({ status: "idle" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onBlur",
    defaultValues: {
      password: "",
      passwordConfirmation: "",
    },
  });

  useEffect(() => {
    if (state.status === "success") {
      const timeout = setTimeout(() => {
        router.replace("/sign-in" as Route);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [state.status, router]);

  async function onSubmit(data: ResetPasswordFormData) {
    setIsSubmitting(true);
    setState({ status: "idle" });

    const formData = new FormData();
    formData.append("token", token);
    formData.append("password", data.password);
    formData.append("passwordConfirmation", data.passwordConfirmation);

    const result = await resetPasswordAction({ status: "idle" }, formData);
    setState(result);
    setIsSubmitting(false);
  }

  return (
    <Card className="w-full max-w-md border-border/80 shadow-overlay">
      <CardHeader className="gap-3">
        <CardTitle className="text-2xl">Redefinir password</CardTitle>
        <CardDescription>Escolha uma nova password para a sua conta SAPTM.</CardDescription>
      </CardHeader>
      <CardContent>
        {state.status === "success" ? (
          <div className="flex flex-col gap-4">
            <p className="text-muted-foreground text-sm">{state.message}</p>
            <Button asChild variant="outline">
              <Link href={"/sign-in" as Route}>Ir para o login</Link>
            </Button>
          </div>
        ) : (
          <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
            <input name="token" type="hidden" value={token} />
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="password">Nova password</FieldLabel>
                <Input
                  autoComplete="new-password"
                  id="password"
                  type="password"
                  {...register("password")}
                />
                <FieldDescription>
                  Mínimo de 12 caracteres conforme política de auth.
                </FieldDescription>
                {errors.password && <FieldError>{errors.password.message}</FieldError>}
              </Field>
              <Field>
                <FieldLabel htmlFor="passwordConfirmation">Confirmar password</FieldLabel>
                <Input
                  autoComplete="new-password"
                  id="passwordConfirmation"
                  type="password"
                  {...register("passwordConfirmation")}
                />
                {errors.passwordConfirmation && (
                  <FieldError>{errors.passwordConfirmation.message}</FieldError>
                )}
              </Field>
            </FieldGroup>
            {state.status === "error" && <FieldError>{state.message}</FieldError>}
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? "A redefinir..." : "Redefinir password"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
