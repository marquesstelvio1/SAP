"use client";

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
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";

import { authClient } from "../../lib/auth-client";

export function TwoFactorVerificationForm({ nextPath }: { nextPath: string }) {
  const [error, setError] = useState<string | undefined>();
  const [mode, setMode] = useState<"totp" | "backup">("totp");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trustDevice, setTrustDevice] = useState(true);
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const code = String(formData.get("code") ?? "");
    const response =
      mode === "totp"
        ? await authClient.twoFactor.verifyTotp({ code, trustDevice })
        : await authClient.twoFactor.verifyBackupCode({ code, trustDevice });

    setIsSubmitting(false);

    if (response.error !== null) {
      setError(response.error.message ?? "Codigo MFA invalido ou expirado.");
      return;
    }

    router.replace(nextPath as Route);
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md border-border/80 shadow-overlay">
      <CardHeader className="gap-3">
        <div className="flex items-center justify-between gap-3">
          <Badge variant="info">MFA</Badge>
          <Badge variant="outline">Autenticação de dois fatores</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle className="text-2xl">Verificacao MFA</CardTitle>
          <CardDescription>
            Confirme o segundo fator para concluir o acesso a plataforma.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="mfaCode">
                {mode === "totp" ? "Codigo do autenticador" : "Codigo de backup"}
              </FieldLabel>
              <Input
                autoComplete="one-time-code"
                id="mfaCode"
                inputMode={mode === "totp" ? "numeric" : "text"}
                minLength={mode === "totp" ? 6 : 8}
                name="code"
                required
              />
            </Field>
            <Field orientation="horizontal">
              <Checkbox
                checked={trustDevice}
                className="mt-0.5"
                id="trustDevice"
                onCheckedChange={(checked) => setTrustDevice(checked === true)}
              />
              <div className="flex flex-col gap-1">
                <FieldLabel htmlFor="trustDevice">Confiar neste dispositivo</FieldLabel>
                <FieldDescription>Evita novo desafio MFA durante 30 dias.</FieldDescription>
              </div>
            </Field>
            <div className="flex gap-2">
              <Button
                disabled={mode === "totp"}
                onClick={() => setMode("totp")}
                type="button"
                variant={mode === "totp" ? "secondary" : "outline"}
              >
                TOTP
              </Button>
              <Button
                disabled={mode === "backup"}
                onClick={() => setMode("backup")}
                type="button"
                variant={mode === "backup" ? "secondary" : "outline"}
              >
                Backup
              </Button>
            </div>
          </FieldGroup>
          <FieldError>{error}</FieldError>
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? "A validar..." : "Confirmar acesso"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
