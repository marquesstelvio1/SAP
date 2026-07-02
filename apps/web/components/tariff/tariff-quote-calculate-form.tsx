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
import { useCaptureEvent } from "@/hooks/use-capture-event";
import { createIdempotencyKey } from "@/lib/idempotency";
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
  const capture = useCaptureEvent();
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [idempotencyKey, setIdempotencyKey] = useState(() => createIdempotencyKey("tariff_quote"));
  const isDisabled = isPending || !canCalculateQuotes;

  useEffect(() => {
    if (state.status === "success") {
      setIdempotencyKey(createIdempotencyKey("tariff_quote"));
      capture("tariff:quote_calculated", {
        quote_id: state.quoteId,
        quote_reference: state.quoteReference,
        cargo_id: state.cargoId,
        rate_card_id: state.rateCardId,
        quoted_amount: state.quotedAmount,
        taxable_amount: state.taxableAmount,
        tax_amount: state.taxAmount,
        tax_rate: state.taxRatePercentage,
      });
    }
  }, [state.status]);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canCalculateQuotes ? "success" : "warning"}>
            {canCalculateQuotes ? "Cotação autorizada" : "Indisponível"}
          </Badge>
          <Badge variant="outline">Calcular cotação</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Calcular cotação</CardTitle>
          <CardDescription className="leading-6">
            Calcula tarifa para carga elegível usando rate card ativo, regras aplicáveis e métricas
            obrigatórias.
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
                <FieldLabel htmlFor="quoteReference">Referência</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="quoteReference"
                  name="quoteReference"
                  placeholder="QUOTE-001"
                  required
                />
              </Field>
              <Field data-disabled={!canCalculateQuotes}>
                <FieldLabel htmlFor="distanceKm">Distância km</FieldLabel>
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
            {canCalculateQuotes ? "Não aprova automaticamente." : "Indisponível"}
          </span>
          <Button disabled={isDisabled} type="submit">
            {isPending ? "A calcular..." : "Calcular cotação"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function formatOptionalAmount(value: number | undefined): string {
  return value === undefined ? "-" : value.toFixed(2);
}
