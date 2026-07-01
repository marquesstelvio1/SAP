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

import type { CargoDeliveryExceptionRecordFormState } from "../../app/(platform)/app/cargo/form-state";

export type CargoDeliveryExceptionRecordFormProps = {
  canRecordDeliveryException: boolean;
  initialState: CargoDeliveryExceptionRecordFormState;
  action: (
    previousState: CargoDeliveryExceptionRecordFormState,
    formData: FormData,
  ) => Promise<CargoDeliveryExceptionRecordFormState>;
};

export function CargoDeliveryExceptionRecordForm({
  canRecordDeliveryException,
  initialState,
  action,
}: CargoDeliveryExceptionRecordFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [idempotencyKey, setIdempotencyKey] = useState(() => createIdempotencyKey("cargo_dex"));
  const defaultOccurredAt = useMemo(() => createDatetimeLocalValue(new Date()), []);
  const isDisabled = isPending || !canRecordDeliveryException;

  useEffect(() => {
    if (state.status === "success") {
      setIdempotencyKey(createIdempotencyKey("cargo_dex"));
    }
  }, [state.status]);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canRecordDeliveryException ? "success" : "warning"}>
            {canRecordDeliveryException ? "Excecao autorizada" : "Indisponível"}
          </Badge>
          <Badge variant="outline">cargo.delivery.exception.record</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Registar excecao de entrega</CardTitle>
          <CardDescription className="leading-6">
            Quando a entrega nao esta sound, abre excecao, move cargo para held e tracking para
            exception antes de qualquer handover final.
          </CardDescription>
        </div>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <FieldGroup>
            <input name="idempotencyKey" type="hidden" value={idempotencyKey} />

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canRecordDeliveryException}>
                <FieldLabel htmlFor="deliveryExceptionCargoId">Cargo ID</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="deliveryExceptionCargoId"
                  name="cargoId"
                  placeholder="ID da carga chegada"
                  required
                />
                <FieldDescription>Requer carga chegada e shipment em arrived.</FieldDescription>
              </Field>
              <Field data-disabled={!canRecordDeliveryException}>
                <FieldLabel htmlFor="deliveryExceptionOccurredAt">Ocorrida em</FieldLabel>
                <Input
                  defaultValue={defaultOccurredAt}
                  disabled={isDisabled}
                  id="deliveryExceptionOccurredAt"
                  name="occurredAt"
                  required
                  type="datetime-local"
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canRecordDeliveryException}>
                <FieldLabel htmlFor="deliveryExceptionType">Tipo</FieldLabel>
                <SelectNative
                  defaultValue="damage"
                  disabled={isDisabled}
                  id="deliveryExceptionType"
                  name="exceptionType"
                >
                  <option value="damage">Dano</option>
                  <option value="shortage">Falta de volumes</option>
                  <option value="temperature_excursion">Temperatura</option>
                  <option value="documentation_mismatch">Documentacao</option>
                  <option value="security_seal_breach">Selo violado</option>
                  <option value="other">Outra</option>
                </SelectNative>
              </Field>
              <Field data-disabled={!canRecordDeliveryException}>
                <FieldLabel htmlFor="deliveryExceptionCondition">Condicao</FieldLabel>
                <SelectNative
                  defaultValue="damaged"
                  disabled={isDisabled}
                  id="deliveryExceptionCondition"
                  name="deliveryConditionStatus"
                >
                  <option value="damaged">Danificada</option>
                  <option value="requires_inspection">Requer inspecao</option>
                </SelectNative>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canRecordDeliveryException}>
                <FieldLabel htmlFor="deliveryExceptionReporter">Reportado por</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="deliveryExceptionReporter"
                  name="reportedByName"
                  placeholder="Operador ou inspetor"
                  required
                />
              </Field>
              <Field data-disabled={!canRecordDeliveryException}>
                <FieldLabel htmlFor="deliveryExceptionEvidence">Evidencia</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="deliveryExceptionEvidence"
                  name="evidenceReference"
                  placeholder="Foto, laudo, sensor ou documento"
                  required
                />
              </Field>
            </div>

            <Field data-disabled={!canRecordDeliveryException}>
              <FieldLabel htmlFor="deliveryExceptionSummary">Resumo</FieldLabel>
              <Textarea
                disabled={isDisabled}
                id="deliveryExceptionSummary"
                name="exceptionSummary"
                placeholder="Descreva o dano, falta, divergencia ou evidencia operacional"
                required
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canRecordDeliveryException}>
                <FieldLabel htmlFor="deliveryExceptionClaim">Claim opcional</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="deliveryExceptionClaim"
                  name="claimReference"
                  placeholder="CLM-2026-0001"
                />
              </Field>
              <Field data-disabled={!canRecordDeliveryException}>
                <FieldLabel htmlFor="deliveryExceptionSource">Sistema origem</FieldLabel>
                <Input
                  defaultValue="saptm"
                  disabled={isDisabled}
                  id="deliveryExceptionSource"
                  name="sourceSystem"
                />
              </Field>
            </div>

            <div className="rounded-lg border bg-muted/30 px-3 py-2 text-muted-foreground text-xs">
              Idempotency key: <span className="font-mono text-foreground">{idempotencyKey}</span>
            </div>

            <Field data-invalid={state.status === "error"}>
              {state.status === "error" ? (
                <FieldError>{state.message}</FieldError>
              ) : (
                <FieldDescription>
                  {state.status === "success"
                    ? `${state.message} Excecao: ${state.exceptionId ?? state.eventId ?? "sem-ref"}`
                    : state.message}
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-between">
          <span className="text-muted-foreground text-xs">
            {canRecordDeliveryException
              ? "Cria excecao de entrega com registo de auditoria."
              : "Requer registo de excecao."}
          </span>
          <Button disabled={isDisabled} type="submit">
            {isPending ? "A registar..." : "Registar excecao"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
