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
import type { TariffRateCardRegisterFormState } from "../../app/(platform)/app/tariffs/form-state";

export type TariffRateCardRegisterFormProps = {
  canManageTariffs: boolean;
  initialState: TariffRateCardRegisterFormState;
  action: (
    previousState: TariffRateCardRegisterFormState,
    formData: FormData,
  ) => Promise<TariffRateCardRegisterFormState>;
};

export function TariffRateCardRegisterForm({
  canManageTariffs,
  initialState,
  action,
}: TariffRateCardRegisterFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    createIdempotencyKey("tariff_rate_card"),
  );
  const isDisabled = isPending || !canManageTariffs;

  useEffect(() => {
    if (state.status === "success") {
      setIdempotencyKey(createIdempotencyKey("tariff_rate_card"));
    }
  }, [state.status]);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canManageTariffs ? "success" : "warning"}>
            {canManageTariffs ? "Tarifa autorizada" : "Indisponível"}
          </Badge>
          <Badge variant="outline">tariff.manage</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Registar rate card</CardTitle>
          <CardDescription className="leading-6">
            Define tabela tarifária por tenant com moeda, validade e código único antes de qualquer
            cotação operacional.
          </CardDescription>
        </div>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <FieldGroup>
            <input name="idempotencyKey" type="hidden" value={idempotencyKey} />
            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canManageTariffs}>
                <FieldLabel htmlFor="rateCardCode">Código</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="rateCardCode"
                  name="rateCardCode"
                  placeholder="TAR-PORT-001"
                  required
                />
              </Field>
              <Field data-disabled={!canManageTariffs}>
                <FieldLabel htmlFor="rateCardName">Nome</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="rateCardName"
                  name="rateCardName"
                  placeholder="Port and rail tariff"
                  required
                />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <Field data-disabled={!canManageTariffs}>
                <FieldLabel htmlFor="status">Estado</FieldLabel>
                <SelectNative disabled={isDisabled} id="status" name="status" required>
                  <option value="active">Ativo</option>
                  <option value="draft">Draft</option>
                  <option value="retired">Retirado</option>
                </SelectNative>
              </Field>
              <Field data-disabled={!canManageTariffs}>
                <FieldLabel htmlFor="currencyCode">Moeda</FieldLabel>
                <Input
                  defaultValue="USD"
                  disabled={isDisabled}
                  id="currencyCode"
                  maxLength={3}
                  minLength={3}
                  name="currencyCode"
                  required
                />
              </Field>
              <Field data-disabled={!canManageTariffs}>
                <FieldLabel htmlFor="validFrom">Válido desde</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="validFrom"
                  name="validFrom"
                  required
                  type="datetime-local"
                />
              </Field>
              <Field data-disabled={!canManageTariffs}>
                <FieldLabel htmlFor="validUntil">Válido até</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="validUntil"
                  name="validUntil"
                  type="datetime-local"
                />
              </Field>
            </div>
            <Field data-disabled={!canManageTariffs}>
              <FieldLabel htmlFor="rateCardSourceSystem">Sistema origem</FieldLabel>
              <Input
                defaultValue="saptm"
                disabled={isDisabled}
                id="rateCardSourceSystem"
                name="sourceSystem"
              />
            </Field>
            <div className="rounded-lg border bg-muted/30 px-3 py-2 text-muted-foreground text-xs">
              Idempotency key: <span className="font-mono text-foreground">{idempotencyKey}</span>
            </div>
            <Field data-invalid={state.status === "error"}>
              {state.status === "error" ? (
                <FieldError>{state.message}</FieldError>
              ) : (
                <FieldDescription>
                  {state.status === "success"
                    ? `${state.message} Rate card: ${state.rateCardCode ?? state.rateCardId}`
                    : state.message}
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-between">
          <span className="text-muted-foreground text-xs">
            {canManageTariffs ? "Registo cria auditoria." : "Requer gestao tarifaria."}
          </span>
          <Button disabled={isDisabled} type="submit">
            {isPending ? "A registar..." : "Registar rate card"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
