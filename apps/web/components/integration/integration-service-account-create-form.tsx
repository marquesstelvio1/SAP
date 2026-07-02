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

import { createIdempotencyKey } from "@/lib/idempotency";
import type { IntegrationServiceAccountCreateFormState } from "../../app/(platform)/app/integrations/form-state";

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
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    createIdempotencyKey("integration_service_account"),
  );
  const isDisabled = isPending || !canManageApiKeys;

  useEffect(() => {
    if (state.status === "success") {
      setIdempotencyKey(createIdempotencyKey("integration_service_account"));
    }
  }, [state.status]);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canManageApiKeys ? "success" : "warning"}>
            {canManageApiKeys ? "Conta autorizada" : "Indisponível"}
          </Badge>
          <Badge variant="outline">integration.api_key.manage</Badge>
          <Badge variant="outline">hash-only</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Criar conta de servico</CardTitle>
          <CardDescription className="leading-6">
            Provisiona identidade técnica para EDI/TOS/ERP com API key exibida uma única vez. O
            backend guarda apenas hash da chave e prefixo.
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
              <FieldLabel htmlFor="integrationExtraScope">Permissão adicional opcional</FieldLabel>
              <SelectNative disabled={isDisabled} id="integrationExtraScope" name="extraScope">
                <option value="">Apenas recepção de eventos</option>
                <option value="tracking.event.record">Registo de tracking</option>
                <option value="cargo.register">Registo de cargas</option>
                <option value="cargo.transport.arrive">Chegada de transporte</option>
              </SelectNative>
              <FieldDescription>
                A recepção de eventos é obrigatória e sempre incluída.
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
                Opcional. Em produção deve seguir rotação de segredos.
              </FieldDescription>
            </Field>
            <Field>
              <FieldDescription>{state.message}</FieldDescription>
              {state.plaintextApiKey ? (
                <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 font-mono text-xs">
                  {state.plaintextApiKey}
                </div>
              ) : null}
              {state.status === "error" ? <FieldError>{state.message}</FieldError> : null}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter>
          <Button disabled={isDisabled} type="submit">
            {isPending ? "A provisionar..." : "Criar conta de serviço"}
          </Button>
          <span className="text-muted-foreground text-xs">
            {canManageApiKeys ? "Segredo aparece apenas no sucesso inicial." : "Sem autorização."}
          </span>
        </CardFooter>
      </form>
    </Card>
  );
}
