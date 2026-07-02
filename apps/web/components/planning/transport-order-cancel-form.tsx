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
import type { TransportOrderCancelFormState } from "../../app/(platform)/app/planning/form-state";

export type TransportOrderCancelFormProps = {
  canCancelTransportOrder: boolean;
  initialState: TransportOrderCancelFormState;
  action: (
    previousState: TransportOrderCancelFormState,
    formData: FormData,
  ) => Promise<TransportOrderCancelFormState>;
};

export function TransportOrderCancelForm({
  canCancelTransportOrder,
  initialState,
  action,
}: TransportOrderCancelFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    createIdempotencyKey("planning_cancel"),
  );
  const defaultCancelledAt = useMemo(() => createDatetimeLocalValue(new Date()), []);
  const isDisabled = isPending || !canCancelTransportOrder;

  useEffect(() => {
    if (state.status === "success") {
      setIdempotencyKey(createIdempotencyKey("planning_cancel"));
    }
  }, [state.status]);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canCancelTransportOrder ? "warning" : "outline"}>
            {canCancelTransportOrder ? "Cancelamento autorizado" : "Indisponível"}
          </Badge>
          <Badge variant="outline">planning.order.cancel</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Cancelar transport order</CardTitle>
          <CardDescription className="leading-6">
            Cancela somente ordens confirmadas antes da partida planeada, exigindo motivo
            operacional, referencia unica e registo de auditoria.
          </CardDescription>
        </div>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <FieldGroup>
            <input name="idempotencyKey" type="hidden" value={idempotencyKey} />

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canCancelTransportOrder}>
                <FieldLabel htmlFor="cancelTransportOrderId">Transport order ID</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="cancelTransportOrderId"
                  name="orderId"
                  placeholder="ID interno da transport order"
                  required
                />
              </Field>
              <Field data-disabled={!canCancelTransportOrder}>
                <FieldLabel htmlFor="cancellationReference">Referencia de cancelamento</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="cancellationReference"
                  name="cancellationReference"
                  placeholder="CXL-TO-2026-0001"
                  required
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field data-disabled={!canCancelTransportOrder}>
                <FieldLabel htmlFor="cancelledByName">Responsavel</FieldLabel>
                <Input disabled={isDisabled} id="cancelledByName" name="cancelledByName" required />
              </Field>
              <Field data-disabled={!canCancelTransportOrder}>
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
              <Field data-disabled={!canCancelTransportOrder}>
                <FieldLabel htmlFor="cancelSourceSystem">Sistema origem</FieldLabel>
                <Input
                  defaultValue="saptm"
                  disabled={isDisabled}
                  id="cancelSourceSystem"
                  name="sourceSystem"
                />
              </Field>
            </div>

            <Field data-disabled={!canCancelTransportOrder}>
              <FieldLabel htmlFor="cancellationReason">Motivo operacional</FieldLabel>
              <Textarea
                disabled={isDisabled}
                id="cancellationReason"
                name="cancellationReason"
                placeholder="Ex.: Janela ferroviaria cancelada por indisponibilidade operacional."
                required
              />
            </Field>

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
            {canCancelTransportOrder
              ? "Cancelamento gravado com registo de auditoria."
              : "Requer cancelamento de transporte."}
          </span>
          <Button disabled={isDisabled} type="submit" variant="outline">
            {isPending ? "A cancelar..." : "Cancelar transport order"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
