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
  Textarea,
} from "@saptm/ui";
import { useActionState, useEffect, useMemo, useState } from "react";
import { createDatetimeLocalValue } from "@/lib/format";
import { createIdempotencyKey } from "@/lib/idempotency";

import type { CapacitySlotCancelFormState } from "../../app/(platform)/app/capacity/form-state";

export type CapacitySlotCancelFormProps = {
  canCancelCapacity: boolean;
  initialState: CapacitySlotCancelFormState;
  action: (
    previousState: CapacitySlotCancelFormState,
    formData: FormData,
  ) => Promise<CapacitySlotCancelFormState>;
};

export function CapacitySlotCancelForm({
  canCancelCapacity,
  initialState,
  action,
}: CapacitySlotCancelFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    createIdempotencyKey("capacity_cancel"),
  );
  const defaultCancelledAt = useMemo(() => createDatetimeLocalValue(new Date()), []);
  const isDisabled = isPending || !canCancelCapacity;

  useEffect(() => {
    if (state.status === "success") {
      setIdempotencyKey(createIdempotencyKey("capacity_cancel"));
    }
  }, [state.status]);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canCancelCapacity ? "success" : "warning"}>
            {canCancelCapacity ? "Cancelamento autorizado" : "Indisponível"}
          </Badge>
          <Badge variant="outline">capacity.slot.cancel</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Cancelar reserva de capacidade</CardTitle>
          <CardDescription className="leading-6">
            Cancela reserva ativa, liberta unidades do slot e preserva trilha de auditoria. O
            cancelamento é idempotente e não remove histórico operacional.
          </CardDescription>
        </div>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <FieldGroup>
            <input name="idempotencyKey" type="hidden" value={idempotencyKey} />

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canCancelCapacity}>
                <FieldLabel htmlFor="reservationId">Reservation ID</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="reservationId"
                  name="reservationId"
                  placeholder="ID interno da reserva ativa"
                  required
                />
              </Field>
              <Field data-disabled={!canCancelCapacity}>
                <FieldLabel htmlFor="cancellationReference">Referência do cancelamento</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="cancellationReference"
                  name="cancellationReference"
                  placeholder="CXL-2026-0001"
                  required
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canCancelCapacity}>
                <FieldLabel htmlFor="cancelledByName">Responsável</FieldLabel>
                <Input disabled={isDisabled} id="cancelledByName" name="cancelledByName" required />
              </Field>
              <Field data-disabled={!canCancelCapacity}>
                <FieldLabel htmlFor="cancelledAt">Cancelado em</FieldLabel>
                <Input
                  defaultValue={defaultCancelledAt}
                  disabled={isDisabled}
                  id="cancelledAt"
                  name="cancelledAt"
                  required
                  type="datetime-local"
                />
              </Field>
            </div>

            <Field data-disabled={!canCancelCapacity}>
              <FieldLabel htmlFor="cancellationReason">Motivo</FieldLabel>
              <Textarea
                disabled={isDisabled}
                id="cancellationReason"
                name="cancellationReason"
                placeholder="Explique o motivo operacional do cancelamento."
                required
              />
            </Field>

            <Field data-disabled={!canCancelCapacity}>
              <FieldLabel htmlFor="cancelSourceSystem">Sistema origem</FieldLabel>
              <Input
                defaultValue="saptm"
                disabled={isDisabled}
                id="cancelSourceSystem"
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
                    ? `${state.message} Ref.: ${state.cancellationReference ?? state.reservationId}`
                    : state.message}
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-between">
          <span className="text-muted-foreground text-xs">
            {canCancelCapacity ? "Não apaga histórico; apenas cancela." : "Requer cancel."}
          </span>
          <Button disabled={isDisabled} type="submit">
            {isPending ? "A cancelar..." : "Cancelar reserva"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
