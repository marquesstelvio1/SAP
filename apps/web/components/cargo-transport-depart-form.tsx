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

import type { CargoTransportDepartFormState } from "../app/(platform)/app/cargo/form-state";

export type CargoTransportDepartFormProps = {
  canDepartTransport: boolean;
  initialState: CargoTransportDepartFormState;
  action: (
    previousState: CargoTransportDepartFormState,
    formData: FormData,
  ) => Promise<CargoTransportDepartFormState>;
};

export function CargoTransportDepartForm({
  canDepartTransport,
  initialState,
  action,
}: CargoTransportDepartFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [idempotencyKey, setIdempotencyKey] = useState(createIdempotencyKey);
  const defaultDepartedAt = useMemo(() => createDatetimeLocalValue(new Date()), []);
  const isDisabled = isPending || !canDepartTransport;

  useEffect(() => {
    if (state.status === "success") {
      setIdempotencyKey(createIdempotencyKey());
    }
  }, [state.status]);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canDepartTransport ? "success" : "warning"}>
            {canDepartTransport ? "Partida governada" : "Sem permissao"}
          </Badge>
          <Badge variant="outline">cargo.transport.depart</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Iniciar partida operacional</CardTitle>
          <CardDescription className="leading-6">
            Move carga para in_transport e shipment para in_transit somente quando existe plano de
            tracking e evidencia de compliance aprovada sem revisoes abertas.
          </CardDescription>
        </div>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <FieldGroup>
            <input name="idempotencyKey" type="hidden" value={idempotencyKey} />

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canDepartTransport}>
                <FieldLabel htmlFor="departCargoId">Cargo ID</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="departCargoId"
                  name="cargoId"
                  placeholder="ID interno da carga planeada"
                  required
                />
                <FieldDescription>
                  Requer ready_for_transport, tracking planeado e evidencia aprovada.
                </FieldDescription>
              </Field>
              <Field data-disabled={!canDepartTransport}>
                <FieldLabel htmlFor="departedAt">Partiu em</FieldLabel>
                <Input
                  defaultValue={defaultDepartedAt}
                  disabled={isDisabled}
                  id="departedAt"
                  name="departedAt"
                  required
                  type="datetime-local"
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canDepartTransport}>
                <FieldLabel htmlFor="departureLocationName">Local de partida</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="departureLocationName"
                  name="departureLocationName"
                  placeholder="Patio ferroviario / cais / terminal"
                  required
                />
              </Field>
              <Field data-disabled={!canDepartTransport}>
                <FieldLabel htmlFor="operatorName">Operador responsavel</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="operatorName"
                  name="operatorName"
                  placeholder="Nome do operador"
                  required
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canDepartTransport}>
                <FieldLabel htmlFor="departureReference">Referencia de partida</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="departureReference"
                  name="departureReference"
                  placeholder="DEP-2026-0001"
                />
              </Field>
              <Field data-disabled={!canDepartTransport}>
                <FieldLabel htmlFor="carrierReference">Referencia do transportador</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="carrierReference"
                  name="carrierReference"
                  placeholder="Trem, viagem, navio ou ordem"
                />
              </Field>
            </div>

            <Field data-disabled={!canDepartTransport}>
              <FieldLabel htmlFor="departSourceSystem">Sistema origem</FieldLabel>
              <Input
                defaultValue="saptm"
                disabled={isDisabled}
                id="departSourceSystem"
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
                    ? `${state.message} Evento: ${state.eventId ?? state.shipmentId ?? "sem-ref"}`
                    : state.message}
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-between">
          <span className="text-muted-foreground text-xs">
            {canDepartTransport
              ? "Atualiza Cargo, TrackingEvent, TrackingShipment, audit e outbox."
              : "Requer cargo.transport.depart."}
          </span>
          <Button disabled={isDisabled} type="submit">
            {isPending ? "A iniciar..." : "Iniciar partida"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function createIdempotencyKey(): string {
  const randomValue =
    typeof crypto === "undefined" ? Math.random().toString(36).slice(2) : crypto.randomUUID();

  return `cargo_dep_${randomValue}`;
}

function createDatetimeLocalValue(date: Date): string {
  const timezoneOffsetMs = date.getTimezoneOffset() * 60_000;

  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
}
