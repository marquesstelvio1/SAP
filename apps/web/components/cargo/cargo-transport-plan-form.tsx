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
import { addHours, createDatetimeLocalValue } from "@/lib/format";
import { createIdempotencyKey } from "@/lib/idempotency";

import type { CargoTransportPlanFormState } from "../../app/(platform)/app/cargo/form-state";

export type CargoTransportPlanFormProps = {
  canPlanTransport: boolean;
  initialState: CargoTransportPlanFormState;
  action: (
    previousState: CargoTransportPlanFormState,
    formData: FormData,
  ) => Promise<CargoTransportPlanFormState>;
};

const transportModeOptions = [
  { value: "rail", label: "Ferrovia" },
  { value: "port", label: "Porto" },
  { value: "road", label: "Rodovia" },
  { value: "multimodal", label: "Multimodal" },
] as const;

export function CargoTransportPlanForm({
  canPlanTransport,
  initialState,
  action,
}: CargoTransportPlanFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [idempotencyKey, setIdempotencyKey] = useState(() => createIdempotencyKey("cargo_plan"));
  const defaultDepartureAt = useMemo(() => createDatetimeLocalValue(addHours(new Date(), 2)), []);
  const defaultArrivalAt = useMemo(() => createDatetimeLocalValue(addHours(new Date(), 26)), []);
  const isDisabled = isPending || !canPlanTransport;

  useEffect(() => {
    if (state.status === "success") {
      setIdempotencyKey(createIdempotencyKey("cargo_plan"));
    }
  }, [state.status]);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canPlanTransport ? "success" : "warning"}>
            {canPlanTransport ? "Tracking autorizado" : "Indisponível"}
          </Badge>
          <Badge variant="outline">cargo.transport.plan</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Planear transporte e criar tracking</CardTitle>
          <CardDescription className="leading-6">
            Liga uma carga liberada ao Operational Tracking criando shipment, evento inicial, audit
            e registo de auditoria. A carga precisa estar em ready_for_transport.
          </CardDescription>
        </div>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <FieldGroup>
            <input name="idempotencyKey" type="hidden" value={idempotencyKey} />

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canPlanTransport}>
                <FieldLabel htmlFor="transportCargoId">Cargo ID</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="transportCargoId"
                  name="cargoId"
                  placeholder="ID interno da carga liberada"
                  required
                />
                <FieldDescription>
                  Apenas cargas liberadas sem tracking existente podem ser planeadas.
                </FieldDescription>
              </Field>
              <Field data-disabled={!canPlanTransport}>
                <FieldLabel htmlFor="referenceCode">Referencia de tracking</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="referenceCode"
                  name="referenceCode"
                  placeholder="Usa cargoReference se vazio"
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field data-disabled={!canPlanTransport}>
                <FieldLabel htmlFor="transportMode">Modal</FieldLabel>
                <SelectNative
                  defaultValue="rail"
                  disabled={isDisabled}
                  id="transportMode"
                  name="transportMode"
                  required
                >
                  {transportModeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectNative>
              </Field>
              <Field data-disabled={!canPlanTransport}>
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
              <Field data-disabled={!canPlanTransport}>
                <FieldLabel htmlFor="estimatedArrivalAt">ETA</FieldLabel>
                <Input
                  defaultValue={defaultArrivalAt}
                  disabled={isDisabled}
                  id="estimatedArrivalAt"
                  name="estimatedArrivalAt"
                  required
                  type="datetime-local"
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field data-disabled={!canPlanTransport}>
                <FieldLabel htmlFor="operationsOwnerTeam">Equipa responsavel</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="operationsOwnerTeam"
                  name="operationsOwnerTeam"
                  placeholder="Rail Ops / Port Ops"
                  required
                />
              </Field>
              <Field data-disabled={!canPlanTransport}>
                <FieldLabel htmlFor="planningReference">Referencia do plano</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="planningReference"
                  name="planningReference"
                  placeholder="PLAN-2026-0001"
                />
              </Field>
              <Field data-disabled={!canPlanTransport}>
                <FieldLabel htmlFor="firstCheckpointName">Checkpoint inicial</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="firstCheckpointName"
                  name="firstCheckpointName"
                  placeholder="Terminal / Patio / Cais"
                />
              </Field>
            </div>

            <Field data-disabled={!canPlanTransport}>
              <FieldLabel htmlFor="transportSourceSystem">Sistema origem</FieldLabel>
              <Input
                defaultValue="saptm"
                disabled={isDisabled}
                id="transportSourceSystem"
                name="sourceSystem"
              />
            </Field>

            <Field data-invalid={state.status === "error"}>
              {state.status === "error" ? (
                <FieldError>{state.message}</FieldError>
              ) : (
                <FieldDescription>
                  {state.status === "success"
                    ? `${state.message} Shipment: ${
                        state.shipmentReferenceCode ?? state.shipmentId ?? "sem-ref"
                      }`
                    : state.message}
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-between">
          <span className="text-muted-foreground text-xs">
            {canPlanTransport
              ? "Cria shipment e evento inicial com auditoria."
              : "Requer plano de transporte."}
          </span>
          <Button disabled={isDisabled} type="submit">
            {isPending ? "A planear..." : "Criar tracking"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
