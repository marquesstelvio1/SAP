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
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
} from "@saptm/ui";
import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";
import { z } from "zod";
import type { ForgotPasswordFormState } from "./actions";
import { forgotPasswordAction } from "./actions";

const forgotPasswordSchema = z.object({
  email: z.string().email("Introduza um email corporativo válido"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [state, setState] = useState<ForgotPasswordFormState>({ status: "idle" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
    },
  });

  if (state.status === "success") {
    return (
      <Card className="w-full max-w-md border-border/80 shadow-overlay">
        <CardHeader className="gap-3">
          <CardTitle className="text-2xl">Email enviado</CardTitle>
          <CardDescription>
            Se existir uma conta associada a esse email, receberá instruções para redefinir a sua
            password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">{state.message}</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href={"/sign-in" as Route}>Voltar para o login</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  async function onSubmit(data: ForgotPasswordFormData) {
    setIsSubmitting(true);
    setState({ status: "idle" });

    const formData = new FormData();
    formData.append("email", data.email);

    const result = await forgotPasswordAction({ status: "idle" }, formData);
    setState(result);
    setIsSubmitting(false);
  }

  return (
    <Card className="w-full max-w-md border-border/80 shadow-overlay">
      <CardHeader className="gap-3">
        <CardTitle className="text-2xl">Recuperar password</CardTitle>
        <CardDescription>
          Introduza o seu email corporativo para receber um link de redefinição de password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">Email corporativo</FieldLabel>
              <Input
                autoComplete="email"
                id="email"
                placeholder="operador@empresa.pt"
                type="email"
                {...register("email")}
              />
              {errors.email && <FieldError>{errors.email.message}</FieldError>}
            </Field>
          </FieldGroup>
          {state.status === "error" && <FieldError>{state.message}</FieldError>}
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? "A enviar..." : "Enviar link de recuperação"}
          </Button>
          <p className="text-center text-muted-foreground text-sm">
            <Link
              className="rounded-sm text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
              href={"/sign-in" as Route}
            >
              Voltar para o login
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
