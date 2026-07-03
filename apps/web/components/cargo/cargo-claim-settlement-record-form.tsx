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
import { useCaptureEvent } from "@/hooks/use-capture-event";
import { createDatetimeLocalValue } from "@/lib/format";
import { createIdempotencyKey } from "@/lib/idempotency";

import type { CargoClaimSettlementRecordFormState } from "../../app/(platform)/app/cargo/form-state";

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
  const capture = useCaptureEvent();
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    createIdempotencyKey("cargo_claim_settlement"),
  );
  const defaultSettledAt = useMemo(() => createDatetimeLocalValue(new Date()), []);
  const isDisabled = isPending || !canRecordClaimSettlement;

  useEffect(() => {
    if (state.status === "success") {
      setIdempotencyKey(createIdempotencyKey("cargo_claim_settlement"));
      capture("cargo:claim_resolved", {
        cargo_id: state.cargoId,
        exception_id: state.exceptionId,
        settlement_id: state.settlementId,
        settlement_reference: state.settlementReference,
      });
    }
  }, [state.status]);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canRecordClaimSettlement ? "success" : "warning"}>
            {canRecordClaimSettlement ? "Liquidação autorizada" : "Indisponível"}
          </Badge>
          <Badge variant="outline">Liquidar reclamação</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Liquidar claim contabilística</CardTitle>
          <CardDescription className="leading-6">
            Regista settlement financeiro apenas para exceção resolvida com claim aceite, referencia
            consistente e registo de auditoria.
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
                  placeholder="ID da exceção resolvida"
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
                <FieldDescription>Deve coincidir com a claim da exceção.</FieldDescription>
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
                placeholder="Descreva criterio, aprovação, valor e impacto contabilistico"
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
              ? "Não altera tracking; apenas contabiliza claim com auditoria."
              : "Requer liquidação de claims."}
          </span>
          <Button disabled={isDisabled} type="submit">
            {isPending ? "A liquidar..." : "Liquidar claim"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
