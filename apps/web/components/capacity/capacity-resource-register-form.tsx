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
import { useActionState, useEffect, useState } from "react";
import { useCaptureEvent } from "@/hooks/use-capture-event";
import { createIdempotencyKey } from "@/lib/idempotency";

import type { CapacityResourceRegisterFormState } from "../../app/(platform)/app/capacity/form-state";

export type CapacityResourceRegisterFormProps = {
  canManageCapacity: boolean;
  initialState: CapacityResourceRegisterFormState;
  action: (
    previousState: CapacityResourceRegisterFormState,
    formData: FormData,
  ) => Promise<CapacityResourceRegisterFormState>;
};

const resourceTypeOptions = [
  { value: "terminal", label: "Terminal" },
  { value: "gate", label: "Gate" },
  { value: "berth", label: "Berth / cais" },
  { value: "rail_track", label: "Linha ferroviária" },
  { value: "yard", label: "Pátio" },
  { value: "carrier_slot", label: "Slot de transportador" },
] as const;

export function CapacityResourceRegisterForm({
  canManageCapacity,
  initialState,
  action,
}: CapacityResourceRegisterFormProps) {
  const capture = useCaptureEvent();
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    createIdempotencyKey("capacity_resource"),
  );
  const isDisabled = isPending || !canManageCapacity;

  useEffect(() => {
    if (state.status === "success") {
      setIdempotencyKey(createIdempotencyKey("capacity_resource"));
      capture("capacity:resource_created", {
        resource_id: state.resourceId,
        resource_code: state.resourceCode,
      });
    }
  }, [state.status]);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canManageCapacity ? "success" : "warning"}>
            {canManageCapacity ? "Recurso autorizado" : "Indisponível"}
          </Badge>
          <Badge variant="outline">Gerir capacidade</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Registar recurso operacional</CardTitle>
          <CardDescription className="leading-6">
            Cria capacidade base por tenant: terminal, gate, cais, linha, pátio ou slot de
            transportador. O código é único e o comando é idempotente.
          </CardDescription>
        </div>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <FieldGroup>
            <input name="idempotencyKey" type="hidden" value={idempotencyKey} />

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canManageCapacity}>
                <FieldLabel htmlFor="resourceCode">Código do recurso</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="resourceCode"
                  name="resourceCode"
                  placeholder="TER-LAD-01"
                  required
                />
              </Field>
              <Field data-disabled={!canManageCapacity}>
                <FieldLabel htmlFor="resourceName">Nome operacional</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="resourceName"
                  name="resourceName"
                  placeholder="Terminal Luanda gate principal"
                  required
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field data-disabled={!canManageCapacity}>
                <FieldLabel htmlFor="resourceType">Tipo</FieldLabel>
                <SelectNative disabled={isDisabled} id="resourceType" name="resourceType" required>
                  {resourceTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectNative>
              </Field>
              <Field data-disabled={!canManageCapacity}>
                <FieldLabel htmlFor="locationName">Local</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="locationName"
                  name="locationName"
                  placeholder="Porto / Pátio / Estação"
                  required
                />
              </Field>
              <Field data-disabled={!canManageCapacity}>
                <FieldLabel htmlFor="maxConcurrentBookings">Limite simultâneo</FieldLabel>
                <Input
                  defaultValue="10"
                  disabled={isDisabled}
                  id="maxConcurrentBookings"
                  min="1"
                  name="maxConcurrentBookings"
                  required
                  type="number"
                />
              </Field>
            </div>

            <Field data-disabled={!canManageCapacity}>
              <FieldLabel htmlFor="resourceSourceSystem">Sistema origem</FieldLabel>
              <Input
                defaultValue="saptm"
                disabled={isDisabled}
                id="resourceSourceSystem"
                name="sourceSystem"
              />
            </Field>

            <Field data-invalid={state.status === "error"}>
              {state.status === "error" ? (
                <FieldError>{state.message}</FieldError>
              ) : (
                <FieldDescription>
                  {state.status === "success"
                    ? `${state.message} Recurso: ${state.resourceCode ?? state.resourceId}`
                    : state.message}
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-between">
          <span className="text-muted-foreground text-xs">
            {canManageCapacity ? "Registo cria auditoria." : "Indisponível"}
          </span>
          <Button disabled={isDisabled} type="submit">
            {isPending ? "A registar..." : "Registar recurso"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
