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
import type { TransportOrderConfirmFormState } from "../../app/(platform)/app/planning/form-state";

export type TransportOrderConfirmFormProps = {
  canConfirmTransportOrder: boolean;
  initialState: TransportOrderConfirmFormState;
  action: (
    previousState: TransportOrderConfirmFormState,
    formData: FormData,
  ) => Promise<TransportOrderConfirmFormState>;
};

const transportModeOptions = [
  { value: "rail", label: "Ferrovia" },
  { value: "road", label: "Rodoviario" },
  { value: "sea", label: "Maritimo" },
  { value: "barge", label: "Barca" },
  { value: "multimodal", label: "Multimodal" },
] as const;

export function TransportOrderConfirmForm({
  canConfirmTransportOrder,
  initialState,
  action,
}: TransportOrderConfirmFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    createIdempotencyKey("planning_confirm"),
  );
  const defaultConfirmedAt = useMemo(() => createDatetimeLocalValue(new Date()), []);
  const defaultDepartureAt = useMemo(() => createDatetimeLocalValue(addHours(new Date(), 6)), []);
  const defaultArrivalAt = useMemo(() => createDatetimeLocalValue(addHours(new Date(), 18)), []);
  const isDisabled = isPending || !canConfirmTransportOrder;

  useEffect(() => {
    if (state.status === "success") {
      setIdempotencyKey(createIdempotencyKey("planning_confirm"));
    }
  }, [state.status]);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canConfirmTransportOrder ? "success" : "warning"}>
            {canConfirmTransportOrder ? "Confirmação autorizada" : "Indisponível"}
          </Badge>
          <Badge variant="outline">planning.order.confirm</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Confirmar transport order</CardTitle>
          <CardDescription className="leading-6">
            Confirma a ordem de transporte depois de carga elegivel, rota distinta, horario valido,
            responsavel, transportador e links opcionais de tracking/capacidade.
          </CardDescription>
        </div>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <FieldGroup>
            <input name="idempotencyKey" type="hidden" value={idempotencyKey} />

            <div className="grid gap-4 md:grid-cols-3">
              <Field data-disabled={!canConfirmTransportOrder}>
                <FieldLabel htmlFor="planningCargoId">Cargo ID</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="planningCargoId"
                  name="cargoId"
                  placeholder="ID interno da carga pronta"
                  required
                />
              </Field>
              <Field data-disabled={!canConfirmTransportOrder}>
                <FieldLabel htmlFor="trackingShipmentId">Tracking shipment ID</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="trackingShipmentId"
                  name="trackingShipmentId"
                  placeholder="Opcional"
                />
              </Field>
              <Field data-disabled={!canConfirmTransportOrder}>
                <FieldLabel htmlFor="capacityReservationId">Capacity reservation ID</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="capacityReservationId"
                  name="capacityReservationId"
                  placeholder="Opcional"
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field data-disabled={!canConfirmTransportOrder}>
                <FieldLabel htmlFor="orderReference">Referencia da ordem</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="orderReference"
                  name="orderReference"
                  placeholder="TO-2026-0001"
                  required
                />
              </Field>
              <Field data-disabled={!canConfirmTransportOrder}>
                <FieldLabel htmlFor="confirmationReference">Referencia de confirmacao</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="confirmationReference"
                  name="confirmationReference"
                  placeholder="CNF-TO-2026-0001"
                  required
                />
              </Field>
              <Field data-disabled={!canConfirmTransportOrder}>
                <FieldLabel htmlFor="mode">Modo</FieldLabel>
                <SelectNative disabled={isDisabled} id="mode" name="mode" required>
                  {transportModeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectNative>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field data-disabled={!canConfirmTransportOrder}>
                <FieldLabel htmlFor="carrierName">Transportador</FieldLabel>
                <Input disabled={isDisabled} id="carrierName" name="carrierName" required />
              </Field>
              <Field data-disabled={!canConfirmTransportOrder}>
                <FieldLabel htmlFor="responsiblePlannerName">Planner responsavel</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="responsiblePlannerName"
                  name="responsiblePlannerName"
                  required
                />
              </Field>
              <Field data-disabled={!canConfirmTransportOrder}>
                <FieldLabel htmlFor="sourceSystem">Sistema origem</FieldLabel>
                <Input
                  defaultValue="saptm"
                  disabled={isDisabled}
                  id="sourceSystem"
                  name="sourceSystem"
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canConfirmTransportOrder}>
                <FieldLabel htmlFor="originName">Origem</FieldLabel>
                <Input disabled={isDisabled} id="originName" name="originName" required />
              </Field>
              <Field data-disabled={!canConfirmTransportOrder}>
                <FieldLabel htmlFor="destinationName">Destino</FieldLabel>
                <Input disabled={isDisabled} id="destinationName" name="destinationName" required />
              </Field>
            </div>

            <Field data-disabled={!canConfirmTransportOrder}>
              <FieldLabel htmlFor="routeSummary">Resumo da rota</FieldLabel>
              <Textarea
                disabled={isDisabled}
                id="routeSummary"
                name="routeSummary"
                placeholder="Ex.: Luanda rail yard -> terminal portuario -> cliente final"
                required
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-3">
              <Field data-disabled={!canConfirmTransportOrder}>
                <FieldLabel htmlFor="confirmedAt">Confirmado em</FieldLabel>
                <Input
                  defaultValue={defaultConfirmedAt}
                  disabled={isDisabled}
                  id="confirmedAt"
                  name="confirmedAt"
                  required
                  type="datetime-local"
                />
              </Field>
              <Field data-disabled={!canConfirmTransportOrder}>
                <FieldLabel htmlFor="plannedDepartureAt">Partida planeada</FieldLabel>
                <Input
                  defaultValue={defaultDepartureAt}
                  disabled={isDisabled}
                  id="plannedDepartureAt"
                  name="plannedDepartureAt"
                  required
                  type="datetime-local"
                />
              </Field>
              <Field data-disabled={!canConfirmTransportOrder}>
                <FieldLabel htmlFor="plannedArrivalAt">Chegada planeada</FieldLabel>
                <Input
                  defaultValue={defaultArrivalAt}
                  disabled={isDisabled}
                  id="plannedArrivalAt"
                  name="plannedArrivalAt"
                  required
                  type="datetime-local"
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
                    ? `${state.message} Ordem: ${state.orderReference ?? state.orderId}`
                    : state.message}
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-between">
          <span className="text-muted-foreground text-xs">
            {canConfirmTransportOrder
              ? "Confirmacao gravada com registo de auditoria."
              : "Requer confirmacao de transporte."}
          </span>
          <Button disabled={isDisabled} type="submit">
            {isPending ? "A confirmar..." : "Confirmar transport order"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
