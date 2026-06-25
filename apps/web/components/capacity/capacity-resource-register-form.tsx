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
  { value: "rail_track", label: "Linha ferroviaria" },
  { value: "yard", label: "Patio" },
  { value: "carrier_slot", label: "Slot de transportador" },
] as const;

export function CapacityResourceRegisterForm({
  canManageCapacity,
  initialState,
  action,
}: CapacityResourceRegisterFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [idempotencyKey, setIdempotencyKey] = useState(createIdempotencyKey);
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
            {canManageCapacity ? "Capacity governada" : "Sem permissao"}
          </Badge>
          <Badge variant="outline">capacity.manage</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Registar recurso operacional</CardTitle>
          <CardDescription className="leading-6">
            Cria capacidade base por tenant: terminal, gate, cais, linha, patio ou slot de
            transportador. O codigo e unico e o comando e idempotente.
          </CardDescription>
        </div>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <FieldGroup>
            <input name="idempotencyKey" type="hidden" value={idempotencyKey} />

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canManageCapacity}>
                <FieldLabel htmlFor="resourceCode">Codigo do recurso</FieldLabel>
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
                  placeholder="Porto / Patio / Estacao"
                  required
                />
              </Field>
              <Field data-disabled={!canManageCapacity}>
                <FieldLabel htmlFor="maxConcurrentBookings">Limite simultaneo</FieldLabel>
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

            <div className="rounded-lg border bg-muted/30 px-3 py-2 text-muted-foreground text-xs">
              Idempotency key: <span className="font-mono text-foreground">{idempotencyKey}</span>
            </div>

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
            {canManageCapacity ? "Cria audit trail e outbox." : "Requer capacity.manage."}
          </span>
          <Button disabled={isDisabled} type="submit">
            {isPending ? "A registar..." : "Registar recurso"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function createIdempotencyKey(): string {
  const randomValue =
    typeof crypto === "undefined" ? Math.random().toString(36).slice(2) : crypto.randomUUID();

  return `capacity_resource_${randomValue}`;
}
