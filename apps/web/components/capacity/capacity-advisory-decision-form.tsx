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
import { createDatetimeLocalValue } from "@/lib/format";
import { createIdempotencyKey } from "@/lib/idempotency";

import type { CapacityAdvisoryDecisionFormState } from "../../app/(platform)/app/capacity/form-state";

export type CapacityAdvisoryDecisionFormProps = {
  canDecideCapacityAdvisory: boolean;
  initialState: CapacityAdvisoryDecisionFormState;
  action: (
    previousState: CapacityAdvisoryDecisionFormState,
    formData: FormData,
  ) => Promise<CapacityAdvisoryDecisionFormState>;
};

const recommendationTypeOptions = [
  { value: "slot_saturation", label: "Saturação de slot" },
  { value: "expiring_slot", label: "Janela a expirar" },
  { value: "unused_capacity", label: "Baixa utilização" },
  { value: "reservation_imbalance", label: "Desequilíbrio de reservas" },
  { value: "cancellation_review", label: "Revisão de cancelamentos" },
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
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    createIdempotencyKey("capacity_advisory_decision"),
  );
  const defaultDecidedAt = useMemo(() => createDatetimeLocalValue(new Date()), []);
  const isDisabled = isPending || !canDecideCapacityAdvisory;

  useEffect(() => {
    if (state.status === "success") {
      setIdempotencyKey(createIdempotencyKey("capacity_advisory_decision"));
    }
  }, [state.status]);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canDecideCapacityAdvisory ? "success" : "warning"}>
            {canDecideCapacityAdvisory ? "Decisão autorizada" : "Indisponível"}
          </Badge>
          <Badge variant="outline">capacity.advisory.decide</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Registar decisão de advisory</CardTitle>
          <CardDescription className="leading-6">
            Regista aprovação ou rejeição humana da recomendação. Esta ação não executa abertura,
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
                <FieldLabel htmlFor="advisoryDecisionStatus">Decisão</FieldLabel>
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
                <FieldLabel htmlFor="advisoryRequiredPermission">Permissão de follow-up</FieldLabel>
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
                <FieldLabel htmlFor="advisoryApprovalReference">Referência aprovação</FieldLabel>
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
                placeholder="                Explique a decisão operacional e a evidência humana usada."
                required
                rows={4}
              />
            </Field>

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
              ? "Regista decisão; não executa comandos operacionais."
              : "Requer decisao de advisory."}
          </span>
          <Button disabled={isDisabled} type="submit">
            {isPending ? "A registar..." : "Registar decisão"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
