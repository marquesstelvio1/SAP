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
import { addHours, createDatetimeLocalValue } from "@/lib/format";
import { createIdempotencyKey } from "@/lib/idempotency";
import type { TransportOrderRescheduleFormState } from "../../app/(platform)/app/planning/form-state";

export type TransportOrderRescheduleFormProps = {
  canRescheduleTransportOrder: boolean;
  initialState: TransportOrderRescheduleFormState;
  action: (
    previousState: TransportOrderRescheduleFormState,
    formData: FormData,
  ) => Promise<TransportOrderRescheduleFormState>;
};

const transportModeOptions = [
  { value: "rail", label: "Ferrovia" },
  { value: "road", label: "Rodoviario" },
  { value: "sea", label: "Maritimo" },
  { value: "barge", label: "Barca" },
  { value: "multimodal", label: "Multimodal" },
] as const;

export function TransportOrderRescheduleForm({
  canRescheduleTransportOrder,
  initialState,
  action,
}: TransportOrderRescheduleFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    createIdempotencyKey("planning_reschedule"),
  );
  const defaultRescheduledAt = useMemo(() => createDatetimeLocalValue(new Date()), []);
  const defaultDepartureAt = useMemo(() => createDatetimeLocalValue(addHours(new Date(), 8)), []);
  const defaultArrivalAt = useMemo(() => createDatetimeLocalValue(addHours(new Date(), 20)), []);
  const isDisabled = isPending || !canRescheduleTransportOrder;

  useEffect(() => {
    if (state.status === "success") {
      setIdempotencyKey(createIdempotencyKey("planning_reschedule"));
    }
  }, [state.status]);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canRescheduleTransportOrder ? "success" : "outline"}>
            {canRescheduleTransportOrder ? "Replaneamento autorizado" : "Indisponível"}
          </Badge>
          <Badge variant="outline">planning.order.reschedule</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Replanear transport order</CardTitle>
          <CardDescription className="leading-6">
            Atualiza rota, modo, carrier e janela de uma ordem confirmada antes da partida,
            preservando a revisao com registo de auditoria.
          </CardDescription>
        </div>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <FieldGroup>
            <input name="idempotencyKey" type="hidden" value={idempotencyKey} />

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canRescheduleTransportOrder}>
                <FieldLabel htmlFor="rescheduleTransportOrderId">Transport order ID</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="rescheduleTransportOrderId"
                  name="orderId"
                  placeholder="ID interno da transport order"
                  required
                />
              </Field>
              <Field data-disabled={!canRescheduleTransportOrder}>
                <FieldLabel htmlFor="revisionReference">Referencia da revisao</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="revisionReference"
                  name="revisionReference"
                  placeholder="REV-TO-2026-0001"
                  required
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field data-disabled={!canRescheduleTransportOrder}>
                <FieldLabel htmlFor="rescheduleMode">Modo</FieldLabel>
                <SelectNative disabled={isDisabled} id="rescheduleMode" name="mode" required>
                  {transportModeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectNative>
              </Field>
              <Field data-disabled={!canRescheduleTransportOrder}>
                <FieldLabel htmlFor="rescheduleCarrierName">Transportador</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="rescheduleCarrierName"
                  name="carrierName"
                  required
                />
              </Field>
              <Field data-disabled={!canRescheduleTransportOrder}>
                <FieldLabel htmlFor="rescheduledByName">Responsavel</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="rescheduledByName"
                  name="rescheduledByName"
                  required
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canRescheduleTransportOrder}>
                <FieldLabel htmlFor="rescheduleOriginName">Origem</FieldLabel>
                <Input disabled={isDisabled} id="rescheduleOriginName" name="originName" required />
              </Field>
              <Field data-disabled={!canRescheduleTransportOrder}>
                <FieldLabel htmlFor="rescheduleDestinationName">Destino</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="rescheduleDestinationName"
                  name="destinationName"
                  required
                />
              </Field>
            </div>

            <Field data-disabled={!canRescheduleTransportOrder}>
              <FieldLabel htmlFor="rescheduleRouteSummary">Nova rota</FieldLabel>
              <Textarea
                disabled={isDisabled}
                id="rescheduleRouteSummary"
                name="routeSummary"
                placeholder="Ex.: Patio ferroviario -> terminal portuario alternativo -> cliente final"
                required
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-3">
              <Field data-disabled={!canRescheduleTransportOrder}>
                <FieldLabel htmlFor="rescheduledAt">Replaneado em</FieldLabel>
                <Input
                  defaultValue={defaultRescheduledAt}
                  disabled={isDisabled}
                  id="rescheduledAt"
                  name="rescheduledAt"
                  required
                  type="datetime-local"
                />
              </Field>
              <Field data-disabled={!canRescheduleTransportOrder}>
                <FieldLabel htmlFor="reschedulePlannedDepartureAt">Nova partida</FieldLabel>
                <Input
                  defaultValue={defaultDepartureAt}
                  disabled={isDisabled}
                  id="reschedulePlannedDepartureAt"
                  name="plannedDepartureAt"
                  required
                  type="datetime-local"
                />
              </Field>
              <Field data-disabled={!canRescheduleTransportOrder}>
                <FieldLabel htmlFor="reschedulePlannedArrivalAt">Nova chegada</FieldLabel>
                <Input
                  defaultValue={defaultArrivalAt}
                  disabled={isDisabled}
                  id="reschedulePlannedArrivalAt"
                  name="plannedArrivalAt"
                  required
                  type="datetime-local"
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_0.45fr]">
              <Field data-disabled={!canRescheduleTransportOrder}>
                <FieldLabel htmlFor="rescheduleReason">Motivo operacional</FieldLabel>
                <Textarea
                  disabled={isDisabled}
                  id="rescheduleReason"
                  name="rescheduleReason"
                  placeholder="Ex.: Janela ferroviaria alterada por congestionamento no terminal."
                  required
                />
              </Field>
              <Field data-disabled={!canRescheduleTransportOrder}>
                <FieldLabel htmlFor="rescheduleSourceSystem">Sistema origem</FieldLabel>
                <Input
                  defaultValue="saptm"
                  disabled={isDisabled}
                  id="rescheduleSourceSystem"
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
                    ? `${state.message} Revisao: ${state.revisionReference ?? state.revisionId}`
                    : state.message}
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-between">
          <span className="text-muted-foreground text-xs">
            {canRescheduleTransportOrder
              ? "Replaneamento exige mudança real, timing válido e referência única."
              : "Requer replaneamento de transporte."}
          </span>
          <Button disabled={isDisabled} type="submit" variant="secondary">
            {isPending ? "A replanear..." : "Replanear transport order"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
