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

import type { CargoReleaseFormState } from "../app/(platform)/app/cargo/form-state";

export type CargoReleaseFormProps = {
  canReleaseCargo: boolean;
  initialState: CargoReleaseFormState;
  action: (
    previousState: CargoReleaseFormState,
    formData: FormData,
  ) => Promise<CargoReleaseFormState>;
};

const customsStatusOptions = [
  { value: "cleared", label: "Liberada" },
  { value: "not_required", label: "Nao requerido" },
] as const;

const inspectionOutcomeOptions = [
  { value: "not_required", label: "Nao requerido" },
  { value: "passed", label: "Inspecao aprovada" },
] as const;

export function CargoReleaseForm({ canReleaseCargo, initialState, action }: CargoReleaseFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [idempotencyKey, setIdempotencyKey] = useState(createIdempotencyKey);
  const defaultReleasedAt = useMemo(() => createDatetimeLocalValue(new Date()), []);
  const isDisabled = isPending || !canReleaseCargo;

  useEffect(() => {
    if (state.status === "success") {
      setIdempotencyKey(createIdempotencyKey());
    }
  }, [state.status]);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canReleaseCargo ? "success" : "warning"}>
            {canReleaseCargo ? "Liberacao governada" : "Sem permissao"}
          </Badge>
          <Badge variant="outline">cargo.release</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Liberar carga para transporte</CardTitle>
          <CardDescription className="leading-6">
            Aplica regras P1: estado liberavel, alfandega resolvida, inspecao aprovada quando
            obrigatoria, compliance de carga perigosa, idempotencia, audit trail e outbox.
          </CardDescription>
        </div>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <FieldGroup>
            <input name="idempotencyKey" type="hidden" value={idempotencyKey} />

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canReleaseCargo}>
                <FieldLabel htmlFor="cargoId">Cargo ID</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="cargoId"
                  name="cargoId"
                  placeholder="ID interno da carga"
                  required
                />
                <FieldDescription>
                  Use o ID exibido ou retornado no registo governado da carga.
                </FieldDescription>
              </Field>
              <Field data-disabled={!canReleaseCargo}>
                <FieldLabel htmlFor="releasedAt">Liberada em</FieldLabel>
                <Input
                  defaultValue={defaultReleasedAt}
                  disabled={isDisabled}
                  id="releasedAt"
                  name="releasedAt"
                  type="datetime-local"
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field data-disabled={!canReleaseCargo}>
                <FieldLabel htmlFor="customsStatus">Estado aduaneiro final</FieldLabel>
                <SelectNative
                  defaultValue="cleared"
                  disabled={isDisabled}
                  id="customsStatus"
                  name="customsStatus"
                  required
                >
                  {customsStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectNative>
              </Field>
              <Field data-disabled={!canReleaseCargo}>
                <FieldLabel htmlFor="inspectionOutcome">Resultado da inspecao</FieldLabel>
                <SelectNative
                  defaultValue="not_required"
                  disabled={isDisabled}
                  id="inspectionOutcome"
                  name="inspectionOutcome"
                  required
                >
                  {inspectionOutcomeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectNative>
              </Field>
              <Field data-disabled={!canReleaseCargo}>
                <FieldLabel htmlFor="releaseReference">Referencia de liberacao</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="releaseReference"
                  name="releaseReference"
                  placeholder="DU, inspecao, manifesto"
                />
              </Field>
            </div>

            <Field data-disabled={!canReleaseCargo}>
              <FieldLabel htmlFor="releaseReason">Justificativa operacional</FieldLabel>
              <Input
                disabled={isDisabled}
                id="releaseReason"
                name="releaseReason"
                placeholder="Alfandega liberada e inspecao operacional concluida"
                required
              />
            </Field>

            <Field data-disabled={!canReleaseCargo}>
              <FieldLabel htmlFor="sourceSystem">Sistema origem</FieldLabel>
              <Input
                defaultValue="saptm"
                disabled={isDisabled}
                id="sourceSystem"
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
                    ? `${state.message} Ref.: ${state.cargoReference ?? state.cargoId ?? "sem-ref"}`
                    : state.message}
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-between">
          <span className="text-muted-foreground text-xs">
            {canReleaseCargo ? "Liberacao cria audit trail e outbox." : "Requer cargo.release."}
          </span>
          <Button disabled={isDisabled} type="submit">
            {isPending ? "A liberar..." : "Liberar carga"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function createIdempotencyKey(): string {
  const randomValue =
    typeof crypto === "undefined" ? Math.random().toString(36).slice(2) : crypto.randomUUID();

  return `cargo_rel_${randomValue}`;
}

function createDatetimeLocalValue(date: Date): string {
  const timezoneOffsetMs = date.getTimezoneOffset() * 60_000;

  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
}
