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

import type { CargoOperationalHandoffRecordFormState } from "../../app/(platform)/app/cargo/form-state";

export type CargoOperationalHandoffRecordFormProps = {
  canRecordOperationalHandoff: boolean;
  initialState: CargoOperationalHandoffRecordFormState;
  action: (
    previousState: CargoOperationalHandoffRecordFormState,
    formData: FormData,
  ) => Promise<CargoOperationalHandoffRecordFormState>;
};

export function CargoOperationalHandoffRecordForm({
  canRecordOperationalHandoff,
  initialState,
  action,
}: CargoOperationalHandoffRecordFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [idempotencyKey, setIdempotencyKey] = useState(() => createIdempotencyKey("cargo_handoff"));
  const defaultHandoffAt = useMemo(() => createDatetimeLocalValue(new Date()), []);
  const isDisabled = isPending || !canRecordOperationalHandoff;

  useEffect(() => {
    if (state.status === "success") {
      setIdempotencyKey(createIdempotencyKey("cargo_handoff"));
    }
  }, [state.status]);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canRecordOperationalHandoff ? "success" : "warning"}>
            {canRecordOperationalHandoff ? "Transferencia autorizada" : "Indisponível"}
          </Badge>
          <Badge variant="outline">cargo.handoff.record</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Registar handoff porto/ferrovia</CardTitle>
          <CardDescription className="leading-6">
            Transfere custodia operacional em carga in-transit, cria tracking location_updated e
            preserva o shipment em movimento.
          </CardDescription>
        </div>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <FieldGroup>
            <input name="idempotencyKey" type="hidden" value={idempotencyKey} />

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canRecordOperationalHandoff}>
                <FieldLabel htmlFor="handoffCargoId">Cargo ID</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="handoffCargoId"
                  name="cargoId"
                  placeholder="ID da carga em transporte"
                  required
                />
                <FieldDescription>
                  Requer cargo in_transport e shipment in_transit.
                </FieldDescription>
              </Field>
              <Field data-disabled={!canRecordOperationalHandoff}>
                <FieldLabel htmlFor="handoffAt">Data/hora do handoff</FieldLabel>
                <Input
                  defaultValue={defaultHandoffAt}
                  disabled={isDisabled}
                  id="handoffAt"
                  name="handoffAt"
                  required
                  type="datetime-local"
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canRecordOperationalHandoff}>
                <FieldLabel htmlFor="handoffType">Tipo de handoff</FieldLabel>
                <SelectNative
                  defaultValue="rail_to_port"
                  disabled={isDisabled}
                  id="handoffType"
                  name="handoffType"
                >
                  <option value="rail_to_port">Ferrovia para porto</option>
                  <option value="port_to_rail">Porto para ferrovia</option>
                  <option value="terminal_to_carrier">Terminal para transportador</option>
                  <option value="carrier_to_terminal">Transportador para terminal</option>
                  <option value="yard_transfer">Transferencia de patio</option>
                  <option value="customs_to_operations">Alfandega para operacoes</option>
                  <option value="other">Outro</option>
                </SelectNative>
              </Field>
              <Field data-disabled={!canRecordOperationalHandoff}>
                <FieldLabel htmlFor="handoffReference">Referencia</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="handoffReference"
                  name="handoffReference"
                  placeholder="HND-2026-0001"
                  required
                />
                <FieldDescription>
                  Unica por tenant para evitar duplicidade operacional.
                </FieldDescription>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canRecordOperationalHandoff}>
                <FieldLabel htmlFor="fromCustodyOwnerName">Custodia atual</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="fromCustodyOwnerName"
                  name="fromCustodyOwnerName"
                  placeholder="Operador ferroviario"
                  required
                />
              </Field>
              <Field data-disabled={!canRecordOperationalHandoff}>
                <FieldLabel htmlFor="toCustodyOwnerName">Nova custodia</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="toCustodyOwnerName"
                  name="toCustodyOwnerName"
                  placeholder="Operador portuario"
                  required
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canRecordOperationalHandoff}>
                <FieldLabel htmlFor="handoffLocationName">Local</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="handoffLocationName"
                  name="handoffLocationName"
                  placeholder="Terminal, porto, patio ou gate"
                  required
                />
              </Field>
              <Field data-disabled={!canRecordOperationalHandoff}>
                <FieldLabel htmlFor="handoffOperatorName">Operador</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="handoffOperatorName"
                  name="operatorName"
                  placeholder="Operador responsavel"
                  required
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canRecordOperationalHandoff}>
                <FieldLabel htmlFor="sealReference">Selo opcional</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="sealReference"
                  name="sealReference"
                  placeholder="SEAL-12345"
                />
              </Field>
              <Field data-disabled={!canRecordOperationalHandoff}>
                <FieldLabel htmlFor="handoffSource">Sistema origem</FieldLabel>
                <Input
                  defaultValue="saptm"
                  disabled={isDisabled}
                  id="handoffSource"
                  name="sourceSystem"
                />
              </Field>
            </div>

            <Field data-disabled={!canRecordOperationalHandoff}>
              <FieldLabel htmlFor="handoffNotes">Notas opcionais</FieldLabel>
              <Textarea
                disabled={isDisabled}
                id="handoffNotes"
                name="handoffNotes"
                placeholder="Observacoes de gate, patio, ferrovia, porto ou terminal"
              />
              <FieldDescription>
                Condicao P7 aceita apenas sound; excecoes usam fluxo proprio.
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
                    ? `${state.message} Handoff: ${state.handoffId ?? state.eventId ?? "sem-ref"}`
                    : state.message}
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-between">
          <span className="text-muted-foreground text-xs">
            {canRecordOperationalHandoff
              ? "Atualiza custodia e cria evento de tracking com auditoria."
              : "Requer registo de handoff."}
          </span>
          <Button disabled={isDisabled} type="submit">
            {isPending ? "A registar..." : "Registar handoff"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
