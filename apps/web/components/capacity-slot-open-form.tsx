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

import type { CapacitySlotOpenFormState } from "../app/(platform)/app/capacity/form-state";

export type CapacitySlotOpenFormProps = {
  canManageCapacity: boolean;
  initialState: CapacitySlotOpenFormState;
  action: (
    previousState: CapacitySlotOpenFormState,
    formData: FormData,
  ) => Promise<CapacitySlotOpenFormState>;
};

export function CapacitySlotOpenForm({
  canManageCapacity,
  initialState,
  action,
}: CapacitySlotOpenFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [idempotencyKey, setIdempotencyKey] = useState(createIdempotencyKey);
  const defaultWindowStartAt = useMemo(() => createDatetimeLocalValue(addHours(new Date(), 2)), []);
  const defaultWindowEndAt = useMemo(() => createDatetimeLocalValue(addHours(new Date(), 8)), []);
  const isDisabled = isPending || !canManageCapacity;

  useEffect(() => {
    if (state.status === "success") {
      setIdempotencyKey(createIdempotencyKey());
    }
  }, [state.status]);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canManageCapacity ? "success" : "warning"}>
            {canManageCapacity ? "Slot governado" : "Sem permissao"}
          </Badge>
          <Badge variant="outline">capacity.slot.open</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Abrir slot de capacidade</CardTitle>
          <CardDescription className="leading-6">
            Define janela operacional com capacidade maxima inferior ou igual ao limite do recurso.
            A referencia e unica por tenant e a abertura e auditavel.
          </CardDescription>
        </div>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <FieldGroup>
            <input name="idempotencyKey" type="hidden" value={idempotencyKey} />

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canManageCapacity}>
                <FieldLabel htmlFor="capacityResourceId">Resource ID</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="capacityResourceId"
                  name="resourceId"
                  placeholder="ID interno do recurso"
                  required
                />
              </Field>
              <Field data-disabled={!canManageCapacity}>
                <FieldLabel htmlFor="slotReference">Referencia do slot</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="slotReference"
                  name="slotReference"
                  placeholder="SLOT-TER-LAD-01-0605"
                  required
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field data-disabled={!canManageCapacity}>
                <FieldLabel htmlFor="windowStartAt">Inicio da janela</FieldLabel>
                <Input
                  defaultValue={defaultWindowStartAt}
                  disabled={isDisabled}
                  id="windowStartAt"
                  name="windowStartAt"
                  required
                  type="datetime-local"
                />
              </Field>
              <Field data-disabled={!canManageCapacity}>
                <FieldLabel htmlFor="windowEndAt">Fim da janela</FieldLabel>
                <Input
                  defaultValue={defaultWindowEndAt}
                  disabled={isDisabled}
                  id="windowEndAt"
                  name="windowEndAt"
                  required
                  type="datetime-local"
                />
              </Field>
              <Field data-disabled={!canManageCapacity}>
                <FieldLabel htmlFor="capacityUnits">Unidades disponiveis</FieldLabel>
                <Input
                  defaultValue="1"
                  disabled={isDisabled}
                  id="capacityUnits"
                  min="1"
                  name="capacityUnits"
                  required
                  type="number"
                />
              </Field>
            </div>

            <Field data-disabled={!canManageCapacity}>
              <FieldLabel htmlFor="slotSourceSystem">Sistema origem</FieldLabel>
              <Input
                defaultValue="saptm"
                disabled={isDisabled}
                id="slotSourceSystem"
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
                    ? `${state.message} Slot: ${state.slotReference ?? state.slotId}`
                    : state.message}
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-between">
          <span className="text-muted-foreground text-xs">
            {canManageCapacity ? "Impede janela invalida e limite excessivo." : "Requer manage."}
          </span>
          <Button disabled={isDisabled} type="submit">
            {isPending ? "A abrir..." : "Abrir slot"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function createIdempotencyKey(): string {
  const randomValue =
    typeof crypto === "undefined" ? Math.random().toString(36).slice(2) : crypto.randomUUID();

  return `capacity_slot_${randomValue}`;
}

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function createDatetimeLocalValue(date: Date): string {
  const timezoneOffsetMs = date.getTimezoneOffset() * 60_000;

  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
}
