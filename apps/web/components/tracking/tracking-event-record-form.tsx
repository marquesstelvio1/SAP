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
import type { TrackingEventRecordFormState } from "../../app/(platform)/app/tracking/form-state";
import { FormToast } from "../form-toast";

export type TrackingEventShipmentOption = {
  id: string;
  referenceCode: string;
  cargoDescription: string;
  originName: string;
  destinationName: string;
};

export type TrackingEventRecordFormProps = {
  shipments: readonly TrackingEventShipmentOption[];
  canRecordEvents: boolean;
  initialState: TrackingEventRecordFormState;
  action: (
    previousState: TrackingEventRecordFormState,
    formData: FormData,
  ) => Promise<TrackingEventRecordFormState>;
};

const eventTypeOptions = [
  { value: "departed", label: "Partida" },
  { value: "arrived", label: "Chegada" },
  { value: "location_updated", label: "Local atualizado" },
  { value: "delayed", label: "Atraso" },
  { value: "exception", label: "Exceção operacional" },
  { value: "customs_hold", label: "Retenção aduaneira" },
  { value: "released", label: "Libertação" },
  { value: "handover_completed", label: "Handover concluído" },
] as const;

export function TrackingEventRecordForm({
  shipments,
  canRecordEvents,
  initialState,
  action,
}: TrackingEventRecordFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [idempotencyKey, setIdempotencyKey] = useState(() => createIdempotencyKey("trk_evt"));
  const defaultOccurredAt = useMemo(() => createDatetimeLocalValue(new Date()), []);
  const selectedShipment = shipments.at(0);
  const isDisabled = isPending || !canRecordEvents || shipments.length === 0;

  useEffect(() => {
    if (state.status === "success") {
      setIdempotencyKey(createIdempotencyKey("trk_evt"));
    }
  }, [state.status]);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canRecordEvents ? "success" : "warning"}>
            {canRecordEvents ? "Evento autorizado" : "Indisponível"}
          </Badge>
          <Badge variant="outline">tracking.event.record</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Registar evento operacional</CardTitle>
          <CardDescription className="leading-6">
            Grava eventos operacionais com protecao contra duplicacao e registo de auditoria.
          </CardDescription>
        </div>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <FieldGroup>
            <input name="idempotencyKey" type="hidden" value={idempotencyKey} />

            <Field data-disabled={!canRecordEvents}>
              <FieldLabel htmlFor="shipmentId">Carga rastreada</FieldLabel>
              <SelectNative
                defaultValue={selectedShipment?.id}
                disabled={isDisabled}
                id="shipmentId"
                name="shipmentId"
                required
              >
                {shipments.map((shipment) => (
                  <option key={shipment.id} value={shipment.id}>
                    {shipment.referenceCode} - {shipment.cargoDescription}
                  </option>
                ))}
              </SelectNative>
              <FieldDescription>
                Apenas cargas recentes do tenant aparecem nesta primeira fatia.
              </FieldDescription>
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canRecordEvents}>
                <FieldLabel htmlFor="eventType">Tipo de evento</FieldLabel>
                <SelectNative
                  defaultValue="departed"
                  disabled={isDisabled}
                  id="eventType"
                  name="eventType"
                  required
                >
                  {eventTypeOptions.map((eventType) => (
                    <option key={eventType.value} value={eventType.value}>
                      {eventType.label}
                    </option>
                  ))}
                </SelectNative>
              </Field>

              <Field data-disabled={!canRecordEvents}>
                <FieldLabel htmlFor="occurredAt">Data/hora operacional</FieldLabel>
                <Input
                  defaultValue={defaultOccurredAt}
                  disabled={isDisabled}
                  id="occurredAt"
                  name="occurredAt"
                  required
                  type="datetime-local"
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canRecordEvents}>
                <FieldLabel htmlFor="locationName">Local operacional</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="locationName"
                  name="locationName"
                  placeholder="Ex.: Terminal Ferroviário Norte"
                />
              </Field>

              <Field data-disabled={!canRecordEvents}>
                <FieldLabel htmlFor="sourceSystem">Sistema origem</FieldLabel>
                <Input
                  defaultValue="saptm"
                  disabled={isDisabled}
                  id="sourceSystem"
                  name="sourceSystem"
                />
              </Field>
            </div>

            <Field data-disabled={!canRecordEvents}>
              <FieldLabel htmlFor="notes">Notas operacionais</FieldLabel>
              <Textarea
                disabled={isDisabled}
                id="notes"
                name="notes"
                placeholder="Resumo da ocorrência, handover, atraso, retenção ou chegada."
              />
            </Field>

            <Field data-disabled={!canRecordEvents}>
              <FieldLabel htmlFor="payload">Payload JSON opcional</FieldLabel>
              <Textarea
                disabled={isDisabled}
                id="payload"
                name="payload"
                placeholder='{"trainNumber":"CF-900","wagons":12}'
                spellCheck={false}
              />
              <FieldDescription>
                Deve ser um objeto JSON. Use apenas dados operacionais necessários.
              </FieldDescription>
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
                    ? `${state.message} Evento: ${state.eventId ?? "sem-id"}`
                    : state.message}
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-between">
          <span className="text-muted-foreground text-xs">
            {canRecordEvents
              ? "Evento gravado com registo de auditoria."
              : "Requer registo de eventos."}
          </span>
          <Button disabled={isDisabled} type="submit">
            {isPending ? "A registar..." : "Registar evento"}
          </Button>
        </CardFooter>
        <FormToast state={state} successTitle="Evento registado com sucesso" />
      </form>
    </Card>
  );
}
