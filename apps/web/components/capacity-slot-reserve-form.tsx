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
} from "@saptm/ui";
import { useActionState, useEffect, useMemo, useState } from "react";

import type { CapacitySlotReserveFormState } from "../app/(platform)/app/capacity/form-state";

export type CapacitySlotReserveFormProps = {
  canReserveCapacity: boolean;
  initialState: CapacitySlotReserveFormState;
  action: (
    previousState: CapacitySlotReserveFormState,
    formData: FormData,
  ) => Promise<CapacitySlotReserveFormState>;
};

const reservationPurposeOptions = [
  { value: "departure", label: "Partida" },
  { value: "arrival", label: "Chegada" },
  { value: "handoff", label: "Handoff" },
  { value: "delivery", label: "Entrega" },
  { value: "storage", label: "Armazenagem" },
  { value: "other", label: "Outro" },
] as const;

export function CapacitySlotReserveForm({
  canReserveCapacity,
  initialState,
  action,
}: CapacitySlotReserveFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [idempotencyKey, setIdempotencyKey] = useState(createIdempotencyKey);
  const defaultReservedAt = useMemo(() => createDatetimeLocalValue(addHours(new Date(), 3)), []);
  const isDisabled = isPending || !canReserveCapacity;

  useEffect(() => {
    if (state.status === "success") {
      setIdempotencyKey(createIdempotencyKey());
    }
  }, [state.status]);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canReserveCapacity ? "success" : "warning"}>
            {canReserveCapacity ? "Reserva governada" : "Sem permissao"}
          </Badge>
          <Badge variant="outline">capacity.slot.reserve</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Reservar slot para carga</CardTitle>
          <CardDescription className="leading-6">
            Reserva unidades de capacidade para carga elegivel. O backend bloqueia overbooking, slot
            fechado, janela invalida e duplicidades.
          </CardDescription>
        </div>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <FieldGroup>
            <input name="idempotencyKey" type="hidden" value={idempotencyKey} />

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canReserveCapacity}>
                <FieldLabel htmlFor="reserveCargoId">Cargo ID</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="reserveCargoId"
                  name="cargoId"
                  placeholder="ID interno da carga"
                  required
                />
              </Field>
              <Field data-disabled={!canReserveCapacity}>
                <FieldLabel htmlFor="reserveSlotId">Slot ID</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="reserveSlotId"
                  name="slotId"
                  placeholder="ID interno do slot aberto"
                  required
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field data-disabled={!canReserveCapacity}>
                <FieldLabel htmlFor="reservationReference">Referencia da reserva</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="reservationReference"
                  name="reservationReference"
                  placeholder="RSV-2026-0001"
                  required
                />
              </Field>
              <Field data-disabled={!canReserveCapacity}>
                <FieldLabel htmlFor="reservationPurpose">Finalidade</FieldLabel>
                <SelectNative
                  defaultValue="departure"
                  disabled={isDisabled}
                  id="reservationPurpose"
                  name="reservationPurpose"
                  required
                >
                  {reservationPurposeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectNative>
              </Field>
              <Field data-disabled={!canReserveCapacity}>
                <FieldLabel htmlFor="reservedUnits">Unidades</FieldLabel>
                <Input
                  defaultValue="1"
                  disabled={isDisabled}
                  id="reservedUnits"
                  min="1"
                  name="reservedUnits"
                  required
                  type="number"
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field data-disabled={!canReserveCapacity}>
                <FieldLabel htmlFor="reservedByName">Responsavel</FieldLabel>
                <Input disabled={isDisabled} id="reservedByName" name="reservedByName" required />
              </Field>
              <Field data-disabled={!canReserveCapacity}>
                <FieldLabel htmlFor="reservedAt">Reservado em</FieldLabel>
                <Input
                  defaultValue={defaultReservedAt}
                  disabled={isDisabled}
                  id="reservedAt"
                  name="reservedAt"
                  required
                  type="datetime-local"
                />
              </Field>
              <Field data-disabled={!canReserveCapacity}>
                <FieldLabel htmlFor="reserveSourceSystem">Sistema origem</FieldLabel>
                <Input
                  defaultValue="saptm"
                  disabled={isDisabled}
                  id="reserveSourceSystem"
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
                    ? `${state.message} Reserva: ${
                        state.reservationReference ?? state.reservationId
                      }`
                    : state.message}
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-between">
          <span className="text-muted-foreground text-xs">
            {canReserveCapacity ? "Reserva atualiza unidades atomicamente." : "Requer reserve."}
          </span>
          <Button disabled={isDisabled} type="submit">
            {isPending ? "A reservar..." : "Reservar capacidade"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function createIdempotencyKey(): string {
  const randomValue =
    typeof crypto === "undefined" ? Math.random().toString(36).slice(2) : crypto.randomUUID();

  return `capacity_reserve_${randomValue}`;
}

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function createDatetimeLocalValue(date: Date): string {
  const timezoneOffsetMs = date.getTimezoneOffset() * 60_000;

  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
}
