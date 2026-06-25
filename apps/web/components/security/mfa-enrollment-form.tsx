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
  Textarea,
} from "@saptm/ui";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";

import { authClient } from "../../lib/auth-client";

type MfaSetup = {
  totpURI: string;
  backupCodes: string[];
};

type Feedback = {
  status: "idle" | "success" | "error";
  message: string;
};

export type MfaEnrollmentFormProps = {
  email: string;
  initialEnabled: boolean;
};

export function MfaEnrollmentForm({ email, initialEnabled }: MfaEnrollmentFormProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [feedback, setFeedback] = useState<Feedback>({
    status: "idle",
    message: initialEnabled
      ? "MFA TOTP esta ativo para este utilizador."
      : "Ative MFA para exigir codigo TOTP apos password.",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [setup, setSetup] = useState<MfaSetup | undefined>();
  const router = useRouter();

  async function handleEnable(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback({ status: "idle", message: "A preparar segredo TOTP..." });

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const response = await authClient.twoFactor.enable({
      issuer: "SAPTM",
      password,
    });

    setIsSubmitting(false);

    if (response.error !== null) {
      setFeedback({
        status: "error",
        message: response.error.message ?? "Nao foi possivel iniciar MFA.",
      });
      return;
    }

    setSetup({
      backupCodes: response.data.backupCodes,
      totpURI: response.data.totpURI,
    });
    setFeedback({
      status: "success",
      message: "Segredo TOTP criado. Confirme um codigo do autenticador para concluir.",
    });
    event.currentTarget.reset();
  }

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback({ status: "idle", message: "A validar codigo TOTP..." });

    const formData = new FormData(event.currentTarget);
    const code = String(formData.get("code") ?? "");
    const response = await authClient.twoFactor.verifyTotp({
      code,
      trustDevice: true,
    });

    setIsSubmitting(false);

    if (response.error !== null) {
      setFeedback({
        status: "error",
        message: response.error.message ?? "Codigo TOTP invalido.",
      });
      return;
    }

    setEnabled(true);
    setSetup(undefined);
    setFeedback({
      status: "success",
      message: "MFA TOTP ativado. A sessao foi atualizada pelo Better Auth.",
    });
    event.currentTarget.reset();
    router.refresh();
  }

  async function handleDisable(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback({ status: "idle", message: "A desativar MFA..." });

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const response = await authClient.twoFactor.disable({ password });

    setIsSubmitting(false);

    if (response.error !== null) {
      setFeedback({
        status: "error",
        message: response.error.message ?? "Nao foi possivel desativar MFA.",
      });
      return;
    }

    setEnabled(false);
    setSetup(undefined);
    setFeedback({
      status: "success",
      message: "MFA desativado e dispositivos confiaveis revogados.",
    });
    event.currentTarget.reset();
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={enabled ? "success" : "warning"}>
            {enabled ? "MFA ativo" : "MFA inativo"}
          </Badge>
          <Badge variant="outline">Better Auth twoFactor</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Politica MFA</CardTitle>
          <CardDescription>
            Enrollment TOTP real para {email}, com segredo persistido no schema oficial e codigos de
            backup criptografados.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldDescription>{feedback.message}</FieldDescription>
            {feedback.status === "error" ? <FieldError>{feedback.message}</FieldError> : null}
          </Field>

          {enabled ? (
            <form className="flex flex-col gap-4" onSubmit={handleDisable}>
              <Field>
                <FieldLabel htmlFor="disableMfaPassword">Password atual</FieldLabel>
                <Input
                  autoComplete="current-password"
                  id="disableMfaPassword"
                  minLength={12}
                  name="password"
                  required
                  type="password"
                />
                <FieldDescription>
                  Necessaria para desativar MFA e limpar dispositivos confiaveis.
                </FieldDescription>
              </Field>
              <Button disabled={isSubmitting} type="submit" variant="outline">
                {isSubmitting ? "A processar..." : "Desativar MFA"}
              </Button>
            </form>
          ) : setup === undefined ? (
            <form className="flex flex-col gap-4" onSubmit={handleEnable}>
              <Field>
                <FieldLabel htmlFor="enableMfaPassword">Password atual</FieldLabel>
                <Input
                  autoComplete="current-password"
                  id="enableMfaPassword"
                  minLength={12}
                  name="password"
                  required
                  type="password"
                />
                <FieldDescription>
                  Better Auth exige password antes de gerar o segredo TOTP.
                </FieldDescription>
              </Field>
              <Button disabled={isSubmitting} type="submit">
                {isSubmitting ? "A processar..." : "Iniciar MFA"}
              </Button>
            </form>
          ) : null}

          {setup ? (
            <div className="flex flex-col gap-4 rounded-md border border-border p-4">
              <Field>
                <FieldLabel htmlFor="totpUri">URI TOTP</FieldLabel>
                <Textarea id="totpUri" readOnly rows={4} value={setup.totpURI} />
                <FieldDescription>
                  Cole este URI num autenticador compativel se o app nao conseguir ler QR code.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="backupCodes">Codigos de backup</FieldLabel>
                <Textarea id="backupCodes" readOnly rows={6} value={setup.backupCodes.join("\n")} />
                <FieldDescription>
                  Guarde estes codigos agora; eles sao exibidos apenas durante o enrollment.
                </FieldDescription>
              </Field>
              <form className="flex flex-col gap-4" onSubmit={handleVerify}>
                <Field>
                  <FieldLabel htmlFor="verifyMfaCode">Codigo TOTP</FieldLabel>
                  <Input
                    autoComplete="one-time-code"
                    id="verifyMfaCode"
                    inputMode="numeric"
                    minLength={6}
                    name="code"
                    required
                  />
                </Field>
                <Button disabled={isSubmitting} type="submit">
                  {isSubmitting ? "A validar..." : "Confirmar MFA"}
                </Button>
              </form>
            </div>
          ) : null}
        </FieldGroup>
      </CardContent>
      <CardFooter>
        <FieldDescription>
          Regra de producao: obrigatorio para tenant.admin, tenant.security_admin e donos de service
          accounts.
        </FieldDescription>
      </CardFooter>
    </Card>
  );
}
