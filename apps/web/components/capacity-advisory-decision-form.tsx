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

import type { CapacityAdvisoryDecisionFormState } from "../app/(platform)/app/capacity/form-state";

export type CapacityAdvisoryDecisionFormProps = {
  canDecideCapacityAdvisory: boolean;
  initialState: CapacityAdvisoryDecisionFormState;
  action: (
    previousState: CapacityAdvisoryDecisionFormState,
    formData: FormData,
  ) => Promise<CapacityAdvisoryDecisionFormState>;
};

const recommendationTypeOptions = [
  { value: "slot_saturation", label: "Saturacao de slot" },
  { value: "expiring_slot", label: "Janela a expirar" },
  { value: "unused_capacity", label: "Baixa utilizacao" },
  { value: "reservation_imbalance", label: "Desequilibrio de reservas" },
  { value: "cancellation_review", label: "Revisao de cancelamentos" },
] as const;

const requiredPermissionOptions = [
  { value: "capacity.manage", label: "capacity.manage" },
  { value: "capacity.slot.reserve", label: "capacity.slot.reserve" },
  { value: "capacity.slot.cancel", label: "capacity.slot.cancel" },
] as const;

export function CapacityAdvisoryDecisionForm({
  canDecideCapacityAdvisory,
  initialState,
  action,
}: CapacityAdvisoryDecisionFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [idempotencyKey, setIdempotencyKey] = useState(createIdempotencyKey);
  const defaultDecidedAt = useMemo(() => createDatetimeLocalValue(new Date()), []);
  const isDisabled = isPending || !canDecideCapacityAdvisory;

  useEffect(() => {
    if (state.status === "success") {
      setIdempotencyKey(createIdempotencyKey());
    }
  }, [state.status]);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canDecideCapacityAdvisory ? "success" : "warning"}>
            {canDecideCapacityAdvisory ? "Decisao governada" : "Sem permissao"}
          </Badge>
          <Badge variant="outline">capacity.advisory.decide</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Registar decisao de advisory</CardTitle>
          <CardDescription className="leading-6">
            Regista aprovacao ou rejeicao humana da recomendacao. Esta acao nao executa abertura,
            reserva, cancelamento ou despacho automaticamente.
          </CardDescription>
        </div>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <FieldGroup>
            <input name="idempotencyKey" type="hidden" value={idempotencyKey} />

            <Field data-disabled={!canDecideCapacityAdvisory}>
              <FieldLabel htmlFor="advisoryRecommendationId">Recommendation ID</FieldLabel>
              <Input
                disabled={isDisabled}
                id="advisoryRecommendationId"
                name="recommendationId"
                placeholder="capacity-advisory:slot_saturation:slot_..."
                required
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-3">
              <Field data-disabled={!canDecideCapacityAdvisory}>
                <FieldLabel htmlFor="advisoryRecommendationType">Tipo</FieldLabel>
                <SelectNative
                  defaultValue="slot_saturation"
                  disabled={isDisabled}
                  id="advisoryRecommendationType"
                  name="recommendationType"
                  required
                >
                  {recommendationTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectNative>
              </Field>
              <Field data-disabled={!canDecideCapacityAdvisory}>
                <FieldLabel htmlFor="advisoryDecisionStatus">Decisao</FieldLabel>
                <SelectNative
                  defaultValue="approved"
                  disabled={isDisabled}
                  id="advisoryDecisionStatus"
                  name="decisionStatus"
                  required
                >
                  <option value="approved">Aprovada</option>
                  <option value="rejected">Rejeitada</option>
                </SelectNative>
              </Field>
              <Field data-disabled={!canDecideCapacityAdvisory}>
                <FieldLabel htmlFor="advisoryRequiredPermission">Permissao de follow-up</FieldLabel>
                <SelectNative
                  defaultValue="capacity.manage"
                  disabled={isDisabled}
                  id="advisoryRequiredPermission"
                  name="requiredPermission"
                  required
                >
                  {requiredPermissionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectNative>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field data-disabled={!canDecideCapacityAdvisory}>
                <FieldLabel htmlFor="advisorySlotId">Slot ID</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="advisorySlotId"
                  name="slotId"
                  placeholder="Obrigatorio se nao houver reserva"
                />
              </Field>
              <Field data-disabled={!canDecideCapacityAdvisory}>
                <FieldLabel htmlFor="advisoryReservationId">Reservation ID</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="advisoryReservationId"
                  name="reservationId"
                  placeholder="Opcional"
                />
              </Field>
              <Field data-disabled={!canDecideCapacityAdvisory}>
                <FieldLabel htmlFor="advisoryApprovalReference">Referencia aprovacao</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="advisoryApprovalReference"
                  name="approvalReference"
                  placeholder="APR-CAP-2026-0001"
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field data-disabled={!canDecideCapacityAdvisory}>
                <FieldLabel htmlFor="advisoryDecidedByName">Decisor</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="advisoryDecidedByName"
                  name="decidedByName"
                  required
                />
              </Field>
              <Field data-disabled={!canDecideCapacityAdvisory}>
                <FieldLabel htmlFor="advisoryDecidedAt">Decidido em</FieldLabel>
                <Input
                  defaultValue={defaultDecidedAt}
                  disabled={isDisabled}
                  id="advisoryDecidedAt"
                  name="decidedAt"
                  required
                  type="datetime-local"
                />
              </Field>
              <Field data-disabled={!canDecideCapacityAdvisory}>
                <FieldLabel htmlFor="advisorySourceSystem">Sistema origem</FieldLabel>
                <Input
                  defaultValue="saptm"
                  disabled={isDisabled}
                  id="advisorySourceSystem"
                  name="sourceSystem"
                />
              </Field>
            </div>

            <Field data-disabled={!canDecideCapacityAdvisory}>
              <FieldLabel htmlFor="advisoryDecisionReason">Justificativa</FieldLabel>
              <Textarea
                disabled={isDisabled}
                id="advisoryDecisionReason"
                name="decisionReason"
                placeholder="Explique a decisao operacional e a evidencia humana usada."
                required
                rows={4}
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
                    ? `${state.message} Decisao: ${state.decisionId}`
                    : state.message}
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-between">
          <span className="text-muted-foreground text-xs">
            {canDecideCapacityAdvisory
              ? "Regista decisao; nao executa comandos operacionais."
              : "Requer capacity.advisory.decide."}
          </span>
          <Button disabled={isDisabled} type="submit">
            {isPending ? "A registar..." : "Registar decisao"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function createIdempotencyKey(): string {
  const randomValue =
    typeof crypto === "undefined" ? Math.random().toString(36).slice(2) : crypto.randomUUID();

  return `capacity_advisory_decision_${randomValue}`;
}

function createDatetimeLocalValue(date: Date): string {
  const timezoneOffsetMs = date.getTimezoneOffset() * 60_000;

  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
}
