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
import type { TransportOrderDispatchFormState } from "../../app/(platform)/app/planning/form-state";

export type TransportOrderDispatchFormProps = {
  canDispatchTransportOrder: boolean;
  initialState: TransportOrderDispatchFormState;
  action: (
    previousState: TransportOrderDispatchFormState,
    formData: FormData,
  ) => Promise<TransportOrderDispatchFormState>;
};

export function TransportOrderDispatchForm({
  canDispatchTransportOrder,
  initialState,
  action,
}: TransportOrderDispatchFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    createIdempotencyKey("planning_dispatch"),
  );
  const defaultDispatchedAt = useMemo(() => createDatetimeLocalValue(new Date()), []);
  const isDisabled = isPending || !canDispatchTransportOrder;

  useEffect(() => {
    if (state.status === "success") {
      setIdempotencyKey(createIdempotencyKey("planning_dispatch"));
    }
  }, [state.status]);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canDispatchTransportOrder ? "success" : "outline"}>
            {canDispatchTransportOrder ? "Expedição autorizada" : "Indisponível"}
          </Badge>
          <Badge variant="outline">planning.order.dispatch</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Despachar transport order</CardTitle>
          <CardDescription className="leading-6">
            Entrega a ordem confirmada para execução operacional, exigindo referência única,
            responsavel, instrucoes e registo de auditoria.
          </CardDescription>
        </div>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <FieldGroup>
            <input name="idempotencyKey" type="hidden" value={idempotencyKey} />

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canDispatchTransportOrder}>
                <FieldLabel htmlFor="dispatchTransportOrderId">Transport order ID</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="dispatchTransportOrderId"
                  name="orderId"
                  placeholder="ID interno da transport order"
                  required
                />
              </Field>
              <Field data-disabled={!canDispatchTransportOrder}>
                <FieldLabel htmlFor="dispatchReference">Referencia de dispatch</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="dispatchReference"
                  name="dispatchReference"
                  placeholder="DSP-TO-2026-0001"
                  required
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field data-disabled={!canDispatchTransportOrder}>
                <FieldLabel htmlFor="dispatchedByName">Responsavel</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="dispatchedByName"
                  name="dispatchedByName"
                  required
                />
              </Field>
              <Field data-disabled={!canDispatchTransportOrder}>
                <FieldLabel htmlFor="dispatchedAt">Despachado em</FieldLabel>
                <Input
                  defaultValue={defaultDispatchedAt}
                  disabled={isDisabled}
                  id="dispatchedAt"
                  name="dispatchedAt"
                  required
                  type="datetime-local"
                />
              </Field>
              <Field data-disabled={!canDispatchTransportOrder}>
                <FieldLabel htmlFor="dispatchSourceSystem">Sistema origem</FieldLabel>
                <Input
                  defaultValue="saptm"
                  disabled={isDisabled}
                  id="dispatchSourceSystem"
                  name="sourceSystem"
                />
              </Field>
            </div>

            <Field data-disabled={!canDispatchTransportOrder}>
              <FieldLabel htmlFor="dispatchInstructions">Instruções operacionais</FieldLabel>
              <Textarea
                disabled={isDisabled}
                id="dispatchInstructions"
                name="dispatchInstructions"
                placeholder="Ex.: Entregar ordem ao terminal ferroviario e confirmar janela de carregamento."
                required
              />
            </Field>

            <Field data-invalid={state.status === "error"}>
              {state.status === "error" ? (
                <FieldError>{state.message}</FieldError>
              ) : (
                <FieldDescription>
                  {state.status === "success"
                    ? `${state.message} Dispatch: ${state.dispatchReference ?? state.dispatchId}`
                    : state.message}
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-between">
          <span className="text-muted-foreground text-xs">
            {canDispatchTransportOrder
              ? "Dispatch bloqueia duplicidade e sinaliza tracking quando ligado."
              : "Requer dispatch de transporte."}
          </span>
          <Button disabled={isDisabled} type="submit">
            {isPending ? "A despachar..." : "Despachar transport order"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
