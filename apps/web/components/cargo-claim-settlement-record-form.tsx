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
  Textarea,
} from "@saptm/ui";
import { useActionState, useEffect, useMemo, useState } from "react";

import type { CargoClaimSettlementRecordFormState } from "../app/(platform)/app/cargo/form-state";

export type CargoClaimSettlementRecordFormProps = {
  canRecordClaimSettlement: boolean;
  initialState: CargoClaimSettlementRecordFormState;
  action: (
    previousState: CargoClaimSettlementRecordFormState,
    formData: FormData,
  ) => Promise<CargoClaimSettlementRecordFormState>;
};

export function CargoClaimSettlementRecordForm({
  canRecordClaimSettlement,
  initialState,
  action,
}: CargoClaimSettlementRecordFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [idempotencyKey, setIdempotencyKey] = useState(createIdempotencyKey);
  const defaultSettledAt = useMemo(() => createDatetimeLocalValue(new Date()), []);
  const isDisabled = isPending || !canRecordClaimSettlement;

  useEffect(() => {
    if (state.status === "success") {
      setIdempotencyKey(createIdempotencyKey());
    }
  }, [state.status]);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canRecordClaimSettlement ? "success" : "warning"}>
            {canRecordClaimSettlement ? "Settlement governado" : "Sem permissao"}
          </Badge>
          <Badge variant="outline">cargo.claim.settle</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Liquidar claim contabilistica</CardTitle>
          <CardDescription className="leading-6">
            Regista settlement financeiro apenas para excecao resolvida com claim aceite, referencia
            consistente, idempotencia, audit trail e outbox.
          </CardDescription>
        </div>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <FieldGroup>
            <input name="idempotencyKey" type="hidden" value={idempotencyKey} />

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canRecordClaimSettlement}>
                <FieldLabel htmlFor="claimSettlementExceptionId">Exception ID</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="claimSettlementExceptionId"
                  name="exceptionId"
                  placeholder="ID da excecao resolvida"
                  required
                />
                <FieldDescription>
                  Requer status resolved e resolutionCode claim_accepted.
                </FieldDescription>
              </Field>
              <Field data-disabled={!canRecordClaimSettlement}>
                <FieldLabel htmlFor="claimSettlementSettledAt">Liquidada em</FieldLabel>
                <Input
                  defaultValue={defaultSettledAt}
                  disabled={isDisabled}
                  id="claimSettlementSettledAt"
                  name="settledAt"
                  required
                  type="datetime-local"
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canRecordClaimSettlement}>
                <FieldLabel htmlFor="claimReference">Claim reference</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="claimReference"
                  name="claimReference"
                  placeholder="CLM-2026-0001"
                  required
                />
                <FieldDescription>Deve coincidir com a claim da excecao.</FieldDescription>
              </Field>
              <Field data-disabled={!canRecordClaimSettlement}>
                <FieldLabel htmlFor="settlementReference">Settlement reference</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="settlementReference"
                  name="settlementReference"
                  placeholder="SET-2026-0001"
                  required
                />
                <FieldDescription>Unica por tenant.</FieldDescription>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field data-disabled={!canRecordClaimSettlement}>
                <FieldLabel htmlFor="settlementType">Tipo</FieldLabel>
                <SelectNative
                  defaultValue="carrier_liability"
                  disabled={isDisabled}
                  id="settlementType"
                  name="settlementType"
                >
                  <option value="carrier_liability">Responsabilidade carrier</option>
                  <option value="insurance_recovery">Recuperacao seguradora</option>
                  <option value="customer_credit">Credito ao cliente</option>
                  <option value="supplier_recovery">Recuperacao fornecedor</option>
                  <option value="write_off">Write-off</option>
                  <option value="other">Outro</option>
                </SelectNative>
              </Field>
              <Field data-disabled={!canRecordClaimSettlement}>
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
              <Field data-disabled={!canRecordClaimSettlement}>
                <FieldLabel htmlFor="settlementAmount">Valor</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="settlementAmount"
                  min="0.01"
                  name="settlementAmount"
                  placeholder="12500.00"
                  required
                  step="0.01"
                  type="number"
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canRecordClaimSettlement}>
                <FieldLabel htmlFor="settledByName">Liquidado por</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="settledByName"
                  name="settledByName"
                  placeholder="Claims manager"
                  required
                />
              </Field>
              <Field data-disabled={!canRecordClaimSettlement}>
                <FieldLabel htmlFor="counterpartyName">Contraparte</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="counterpartyName"
                  name="counterpartyName"
                  placeholder="Carrier, seguradora ou cliente"
                  required
                />
              </Field>
            </div>

            <Field data-disabled={!canRecordClaimSettlement}>
              <FieldLabel htmlFor="settlementSummary">Resumo contabilistico</FieldLabel>
              <Textarea
                disabled={isDisabled}
                id="settlementSummary"
                name="settlementSummary"
                placeholder="Descreva criterio, aprovacao, valor e impacto contabilistico"
                required
              />
            </Field>

            <Field data-disabled={!canRecordClaimSettlement}>
              <FieldLabel htmlFor="claimSettlementSource">Sistema origem</FieldLabel>
              <Input
                defaultValue="saptm"
                disabled={isDisabled}
                id="claimSettlementSource"
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
                    ? `${state.message} Settlement: ${
                        state.settlementReference ?? state.settlementId ?? "sem-ref"
                      }`
                    : state.message}
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-between">
          <span className="text-muted-foreground text-xs">
            {canRecordClaimSettlement
              ? "Nao altera tracking; apenas contabiliza claim com audit e outbox."
              : "Requer cargo.claim.settle."}
          </span>
          <Button disabled={isDisabled} type="submit">
            {isPending ? "A liquidar..." : "Liquidar claim"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function createIdempotencyKey(): string {
  const randomValue =
    typeof crypto === "undefined" ? Math.random().toString(36).slice(2) : crypto.randomUUID();

  return `cargo_claim_settlement_${randomValue}`;
}

function createDatetimeLocalValue(date: Date): string {
  const timezoneOffsetMs = date.getTimezoneOffset() * 60_000;

  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
}
