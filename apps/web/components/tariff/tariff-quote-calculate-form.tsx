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
import { useActionState, useEffect, useState } from "react";

import type { TariffQuoteCalculateFormState } from "../../app/(platform)/app/tariffs/form-state";

export type TariffQuoteCalculateFormProps = {
  canCalculateQuotes: boolean;
  initialState: TariffQuoteCalculateFormState;
  action: (
    previousState: TariffQuoteCalculateFormState,
    formData: FormData,
  ) => Promise<TariffQuoteCalculateFormState>;
};

export function TariffQuoteCalculateForm({
  canCalculateQuotes,
  initialState,
  action,
}: TariffQuoteCalculateFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [idempotencyKey, setIdempotencyKey] = useState(createIdempotencyKey);
  const isDisabled = isPending || !canCalculateQuotes;

  useEffect(() => {
    if (state.status === "success") {
      setIdempotencyKey(createIdempotencyKey());
    }
  }, [state.status]);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canCalculateQuotes ? "success" : "warning"}>
            {canCalculateQuotes ? "Cotacao governada" : "Sem permissao"}
          </Badge>
          <Badge variant="outline">tariff.quote.calculate</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Calcular cotacao</CardTitle>
          <CardDescription className="leading-6">
            Calcula tarifa para carga elegivel usando rate card ativo, regras aplicaveis e metricas
            obrigatorias.
          </CardDescription>
        </div>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <FieldGroup>
            <input name="idempotencyKey" type="hidden" value={idempotencyKey} />
            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canCalculateQuotes}>
                <FieldLabel htmlFor="cargoId">Cargo ID</FieldLabel>
                <Input disabled={isDisabled} id="cargoId" name="cargoId" required />
              </Field>
              <Field data-disabled={!canCalculateQuotes}>
                <FieldLabel htmlFor="quoteRateCardId">Rate card ID</FieldLabel>
                <Input disabled={isDisabled} id="quoteRateCardId" name="rateCardId" required />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <Field data-disabled={!canCalculateQuotes}>
                <FieldLabel htmlFor="quoteReference">Referencia</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="quoteReference"
                  name="quoteReference"
                  placeholder="QUOTE-001"
                  required
                />
              </Field>
              <Field data-disabled={!canCalculateQuotes}>
                <FieldLabel htmlFor="distanceKm">Distancia km</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="distanceKm"
                  min="0"
                  name="distanceKm"
                  step="0.01"
                  type="number"
                />
              </Field>
              <Field data-disabled={!canCalculateQuotes}>
                <FieldLabel htmlFor="taxRatePercentage">Imposto %</FieldLabel>
                <Input
                  defaultValue="0"
                  disabled={isDisabled}
                  id="taxRatePercentage"
                  max="100"
                  min="0"
                  name="taxRatePercentage"
                  step="0.01"
                  type="number"
                />
              </Field>
              <Field data-disabled={!canCalculateQuotes}>
                <FieldLabel htmlFor="calculatedAt">Calculado em</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="calculatedAt"
                  name="calculatedAt"
                  required
                  type="datetime-local"
                />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canCalculateQuotes}>
                <FieldLabel htmlFor="calculatedByName">Operador pricing</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="calculatedByName"
                  name="calculatedByName"
                  placeholder="Pricing Operator"
                  required
                />
              </Field>
              <Field data-disabled={!canCalculateQuotes}>
                <FieldLabel htmlFor="quoteSourceSystem">Sistema origem</FieldLabel>
                <Input
                  defaultValue="saptm"
                  disabled={isDisabled}
                  id="quoteSourceSystem"
                  name="sourceSystem"
                />
              </Field>
            </div>
            <div className="rounded-lg border bg-muted/30 px-3 py-2 text-muted-foreground text-xs">
              Idempotency key: <span className="font-mono text-foreground">{idempotencyKey}</span>
            </div>
            <Field data-invalid={state.status === "error"}>
              {state.status === "error" ? (
                <FieldError>{state.message}</FieldError>
              ) : (
                <FieldDescription>
                  {state.status === "success"
                    ? `${state.message} Imposto: ${formatOptionalAmount(
                        state.taxAmount,
                      )}. Total: ${formatOptionalAmount(state.quotedAmount)}`
                    : state.message}
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-between">
          <span className="text-muted-foreground text-xs">
            {canCalculateQuotes ? "Nao aprova automaticamente." : "Requer tariff.quote.calculate."}
          </span>
          <Button disabled={isDisabled} type="submit">
            {isPending ? "A calcular..." : "Calcular cotacao"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function createIdempotencyKey(): string {
  const randomValue =
    typeof crypto === "undefined" ? Math.random().toString(36).slice(2) : crypto.randomUUID();

  return `tariff_quote_${randomValue}`;
}

function formatOptionalAmount(value: number | undefined): string {
  return value === undefined ? "-" : value.toFixed(2);
}
