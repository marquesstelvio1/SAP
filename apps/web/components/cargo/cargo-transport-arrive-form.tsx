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
import { useActionState, useEffect, useMemo, useState } from "react";
import { createDatetimeLocalValue } from "@/lib/format";
import { createIdempotencyKey } from "@/lib/idempotency";

import type { CargoTransportArriveFormState } from "../../app/(platform)/app/cargo/form-state";

export type CargoTransportArriveFormProps = {
  canArriveTransport: boolean;
  initialState: CargoTransportArriveFormState;
  action: (
    previousState: CargoTransportArriveFormState,
    formData: FormData,
  ) => Promise<CargoTransportArriveFormState>;
};

export function CargoTransportArriveForm({
  canArriveTransport,
  initialState,
  action,
}: CargoTransportArriveFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [idempotencyKey, setIdempotencyKey] = useState(() => createIdempotencyKey("cargo_arr"));
  const defaultArrivedAt = useMemo(() => createDatetimeLocalValue(new Date()), []);
  const isDisabled = isPending || !canArriveTransport;

  useEffect(() => {
    if (state.status === "success") {
      setIdempotencyKey(createIdempotencyKey("cargo_arr"));
    }
  }, [state.status]);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canArriveTransport ? "success" : "warning"}>
            {canArriveTransport ? "Chegada autorizada" : "Indisponível"}
          </Badge>
          <Badge variant="outline">cargo.transport.arrive</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Confirmar chegada operacional</CardTitle>
          <CardDescription className="leading-6">
            Move o shipment para arrived somente quando a carga ja esta in_transport e o tracking
            esta in_transit.
          </CardDescription>
        </div>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <FieldGroup>
            <input name="idempotencyKey" type="hidden" value={idempotencyKey} />

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canArriveTransport}>
                <FieldLabel htmlFor="arriveCargoId">Cargo ID</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="arriveCargoId"
                  name="cargoId"
                  placeholder="ID interno da carga em transporte"
                  required
                />
                <FieldDescription>
                  Requer partida P4 concluida e shipment in_transit.
                </FieldDescription>
              </Field>
              <Field data-disabled={!canArriveTransport}>
                <FieldLabel htmlFor="arrivedAt">Chegou em</FieldLabel>
                <Input
                  defaultValue={defaultArrivedAt}
                  disabled={isDisabled}
                  id="arrivedAt"
                  name="arrivedAt"
                  required
                  type="datetime-local"
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canArriveTransport}>
                <FieldLabel htmlFor="arrivalLocationName">Local de chegada</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="arrivalLocationName"
                  name="arrivalLocationName"
                  placeholder="Terminal destino / patio / cais"
                  required
                />
              </Field>
              <Field data-disabled={!canArriveTransport}>
                <FieldLabel htmlFor="arrivalOperatorName">Operador responsavel</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="arrivalOperatorName"
                  name="operatorName"
                  placeholder="Nome do operador"
                  required
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canArriveTransport}>
                <FieldLabel htmlFor="arrivalReference">Referencia de chegada</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="arrivalReference"
                  name="arrivalReference"
                  placeholder="ARR-2026-0001"
                />
              </Field>
              <Field data-disabled={!canArriveTransport}>
                <FieldLabel htmlFor="arrivalSourceSystem">Sistema origem</FieldLabel>
                <Input
                  defaultValue="saptm"
                  disabled={isDisabled}
                  id="arrivalSourceSystem"
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
                    ? `${state.message} Evento: ${state.eventId ?? state.shipmentId ?? "sem-ref"}`
                    : state.message}
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-between">
          <span className="text-muted-foreground text-xs">
            {canArriveTransport
              ? "Atualiza chegada com registo de auditoria."
              : "Requer chegada de transporte."}
          </span>
          <Button disabled={isDisabled} type="submit">
            {isPending ? "A confirmar..." : "Confirmar chegada"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
