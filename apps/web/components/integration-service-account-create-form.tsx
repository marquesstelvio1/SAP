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
  SelectNative,
} from "@saptm/ui";
import { useActionState, useEffect, useState } from "react";

import type { IntegrationServiceAccountCreateFormState } from "../app/(platform)/app/integrations/form-state";

export type IntegrationServiceAccountCreateFormProps = {
  canManageApiKeys: boolean;
  initialState: IntegrationServiceAccountCreateFormState;
  action: (
    previousState: IntegrationServiceAccountCreateFormState,
    formData: FormData,
  ) => Promise<IntegrationServiceAccountCreateFormState>;
};

export function IntegrationServiceAccountCreateForm({
  action,
  canManageApiKeys,
  initialState,
}: IntegrationServiceAccountCreateFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [idempotencyKey, setIdempotencyKey] = useState(createIdempotencyKey);
  const isDisabled = isPending || !canManageApiKeys;

  useEffect(() => {
    if (state.status === "success") {
      setIdempotencyKey(createIdempotencyKey());
    }
  }, [state.status]);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canManageApiKeys ? "success" : "warning"}>
            {canManageApiKeys ? "Credencial governada" : "Sem permissao"}
          </Badge>
          <Badge variant="outline">integration.api_key.manage</Badge>
          <Badge variant="outline">hash-only</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Criar service account</CardTitle>
          <CardDescription className="leading-6">
            Provisiona identidade tecnica para EDI/TOS/ERP com API key exibida uma unica vez. O
            backend guarda apenas hash SHA-256, prefixo, audit trail e outbox.
          </CardDescription>
        </div>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <FieldGroup>
            <input name="idempotencyKey" type="hidden" value={idempotencyKey} />
            <Field data-disabled={!canManageApiKeys}>
              <FieldLabel htmlFor="integrationServiceAccountName">Nome</FieldLabel>
              <Input
                disabled={isDisabled}
                id="integrationServiceAccountName"
                name="name"
                placeholder="Ex.: Port TOS Bridge"
                required
              />
            </Field>
            <Field data-disabled={!canManageApiKeys}>
              <FieldLabel htmlFor="integrationExtraScope">Escopo adicional opcional</FieldLabel>
              <SelectNative disabled={isDisabled} id="integrationExtraScope" name="extraScope">
                <option value="">Apenas integration.event.ingest</option>
                <option value="tracking.event.record">tracking.event.record</option>
                <option value="cargo.register">cargo.register</option>
                <option value="cargo.transport.arrive">cargo.transport.arrive</option>
              </SelectNative>
              <FieldDescription>
                O escopo `integration.event.ingest` e obrigatorio e sempre incluido.
              </FieldDescription>
            </Field>
            <Field data-disabled={!canManageApiKeys}>
              <FieldLabel htmlFor="integrationExpiresAt">Expira em</FieldLabel>
              <Input
                disabled={isDisabled}
                id="integrationExpiresAt"
                name="expiresAt"
                type="datetime-local"
              />
              <FieldDescription>
                Opcional. Em producao deve seguir rotacao de secrets.
              </FieldDescription>
            </Field>
            <Field>
              <FieldDescription>
                {state.status === "success" && state.serviceAccountId !== undefined
                  ? `${state.message} Service account: ${state.serviceAccountId} · Prefixo: ${
                      state.apiKeyPrefix ?? "sem-prefixo"
                    } · Replay: ${state.replayed ? "sim" : "nao"}`
                  : state.message}
              </FieldDescription>
              {state.plaintextApiKey ? (
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 font-mono text-xs">
                  {state.plaintextApiKey}
                </div>
              ) : null}
              {state.status === "error" ? <FieldError>{state.message}</FieldError> : null}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter>
          <Button disabled={isDisabled} type="submit">
            {isPending ? "A provisionar..." : "Criar service account"}
          </Button>
          <span className="text-muted-foreground text-xs">
            {canManageApiKeys ? "Segredo aparece apenas no sucesso inicial." : "Requer permissao."}
          </span>
        </CardFooter>
      </form>
    </Card>
  );
}

function createIdempotencyKey(): string {
  const randomValue =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return `integration_service_account_${randomValue}`;
}
