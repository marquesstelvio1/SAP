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

import type { CargoDeliveryCompleteFormState } from "../app/(platform)/app/cargo/form-state";

export type CargoDeliveryCompleteFormProps = {
  canCompleteDelivery: boolean;
  initialState: CargoDeliveryCompleteFormState;
  action: (
    previousState: CargoDeliveryCompleteFormState,
    formData: FormData,
  ) => Promise<CargoDeliveryCompleteFormState>;
};

export function CargoDeliveryCompleteForm({
  canCompleteDelivery,
  initialState,
  action,
}: CargoDeliveryCompleteFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [idempotencyKey, setIdempotencyKey] = useState(createIdempotencyKey);
  const defaultDeliveredAt = useMemo(() => createDatetimeLocalValue(new Date()), []);
  const isDisabled = isPending || !canCompleteDelivery;

  useEffect(() => {
    if (state.status === "success") {
      setIdempotencyKey(createIdempotencyKey());
    }
  }, [state.status]);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canCompleteDelivery ? "success" : "warning"}>
            {canCompleteDelivery ? "Entrega governada" : "Sem permissao"}
          </Badge>
          <Badge variant="outline">cargo.delivery.complete</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Concluir entrega final</CardTitle>
          <CardDescription className="leading-6">
            Fecha o ciclo operacional apenas depois da chegada governada, movendo cargo para
            delivered e shipment para completed.
          </CardDescription>
        </div>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <FieldGroup>
            <input name="idempotencyKey" type="hidden" value={idempotencyKey} />

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canCompleteDelivery}>
                <FieldLabel htmlFor="deliveryCargoId">Cargo ID</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="deliveryCargoId"
                  name="cargoId"
                  placeholder="ID interno da carga chegada"
                  required
                />
                <FieldDescription>Requer chegada P5 e shipment em arrived.</FieldDescription>
              </Field>
              <Field data-disabled={!canCompleteDelivery}>
                <FieldLabel htmlFor="deliveredAt">Entregue em</FieldLabel>
                <Input
                  defaultValue={defaultDeliveredAt}
                  disabled={isDisabled}
                  id="deliveredAt"
                  name="deliveredAt"
                  required
                  type="datetime-local"
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canCompleteDelivery}>
                <FieldLabel htmlFor="receivedByName">Recebido por</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="receivedByName"
                  name="receivedByName"
                  placeholder="Responsavel no destino"
                  required
                />
              </Field>
              <Field data-disabled={!canCompleteDelivery}>
                <FieldLabel htmlFor="deliveryReference">Referencia de entrega</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="deliveryReference"
                  name="deliveryReference"
                  placeholder="DLV-2026-0001"
                  required
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canCompleteDelivery}>
                <FieldLabel htmlFor="deliveryConditionStatus">Condicao final</FieldLabel>
                <SelectNative
                  defaultValue="sound"
                  disabled={isDisabled}
                  id="deliveryConditionStatus"
                  name="deliveryConditionStatus"
                >
                  <option value="sound">Sem danos</option>
                  <option value="damaged">Danificada</option>
                  <option value="requires_inspection">Requer inspecao</option>
                </SelectNative>
                <FieldDescription>
                  Condicao diferente de sound exige fluxo de excecao antes de concluir.
                </FieldDescription>
              </Field>
              <Field data-disabled={!canCompleteDelivery}>
                <FieldLabel htmlFor="deliverySourceSystem">Sistema origem</FieldLabel>
                <Input
                  defaultValue="saptm"
                  disabled={isDisabled}
                  id="deliverySourceSystem"
                  name="sourceSystem"
                />
              </Field>
            </div>

            <Field data-disabled={!canCompleteDelivery}>
              <FieldLabel htmlFor="deliveryNotes">Notas de entrega</FieldLabel>
              <Textarea
                disabled={isDisabled}
                id="deliveryNotes"
                name="deliveryNotes"
                placeholder="Obrigatorio quando a condicao final nao esta sound"
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
            {canCompleteDelivery
              ? "Atualiza Cargo, TrackingShipment, handover event, audit e outbox."
              : "Requer cargo.delivery.complete."}
          </span>
          <Button disabled={isDisabled} type="submit">
            {isPending ? "A concluir..." : "Concluir entrega"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function createIdempotencyKey(): string {
  const randomValue =
    typeof crypto === "undefined" ? Math.random().toString(36).slice(2) : crypto.randomUUID();

  return `cargo_dlv_${randomValue}`;
}

function createDatetimeLocalValue(date: Date): string {
  const timezoneOffsetMs = date.getTimezoneOffset() * 60_000;

  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
}
