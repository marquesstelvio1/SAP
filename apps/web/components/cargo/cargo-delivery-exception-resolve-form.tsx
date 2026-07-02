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

import type { CargoDeliveryExceptionResolveFormState } from "../../app/(platform)/app/cargo/form-state";

export type CargoDeliveryExceptionResolveFormProps = {
  canResolveDeliveryException: boolean;
  initialState: CargoDeliveryExceptionResolveFormState;
  action: (
    previousState: CargoDeliveryExceptionResolveFormState,
    formData: FormData,
  ) => Promise<CargoDeliveryExceptionResolveFormState>;
};

export function CargoDeliveryExceptionResolveForm({
  canResolveDeliveryException,
  initialState,
  action,
}: CargoDeliveryExceptionResolveFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [idempotencyKey, setIdempotencyKey] = useState(() => createIdempotencyKey("cargo_der"));
  const defaultResolvedAt = useMemo(() => createDatetimeLocalValue(new Date()), []);
  const isDisabled = isPending || !canResolveDeliveryException;

  useEffect(() => {
    if (state.status === "success") {
      setIdempotencyKey(createIdempotencyKey("cargo_der"));
    }
  }, [state.status]);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canResolveDeliveryException ? "success" : "warning"}>
            {canResolveDeliveryException ? "Resolucao autorizada" : "Indisponível"}
          </Badge>
          <Badge variant="outline">cargo.delivery.exception.resolve</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Resolver excecao de entrega</CardTitle>
          <CardDescription className="leading-6">
            Fecha a excecao apos inspeccao ou claim, restaura cargo para in_transport e tracking
            para arrived, permitindo a entrega final.
          </CardDescription>
        </div>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <FieldGroup>
            <input name="idempotencyKey" type="hidden" value={idempotencyKey} />

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canResolveDeliveryException}>
                <FieldLabel htmlFor="deliveryExceptionId">Exception ID</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="deliveryExceptionId"
                  name="exceptionId"
                  placeholder="ID da excecao aberta"
                  required
                />
                <FieldDescription>
                  Requer excecao aberta, cargo held e tracking exception.
                </FieldDescription>
              </Field>
              <Field data-disabled={!canResolveDeliveryException}>
                <FieldLabel htmlFor="deliveryExceptionResolvedAt">Resolvida em</FieldLabel>
                <Input
                  defaultValue={defaultResolvedAt}
                  disabled={isDisabled}
                  id="deliveryExceptionResolvedAt"
                  name="resolvedAt"
                  required
                  type="datetime-local"
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canResolveDeliveryException}>
                <FieldLabel htmlFor="deliveryExceptionResolutionCode">Resolucao</FieldLabel>
                <SelectNative
                  defaultValue="inspection_passed"
                  disabled={isDisabled}
                  id="deliveryExceptionResolutionCode"
                  name="resolutionCode"
                >
                  <option value="inspection_passed">Inspecao aprovada</option>
                  <option value="claim_accepted">Claim aceite</option>
                  <option value="waiver_approved">Waiver aprovado</option>
                  <option value="recovered">Carga recuperada</option>
                  <option value="other">Outra</option>
                </SelectNative>
              </Field>
              <Field data-disabled={!canResolveDeliveryException}>
                <FieldLabel htmlFor="deliveryExceptionResolver">Resolvido por</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="deliveryExceptionResolver"
                  name="resolverName"
                  placeholder="Supervisor, QA ou claims"
                  required
                />
              </Field>
            </div>

            <Field data-disabled={!canResolveDeliveryException}>
              <FieldLabel htmlFor="deliveryExceptionResolutionReference">
                Referencia de resolucao
              </FieldLabel>
              <Input
                disabled={isDisabled}
                id="deliveryExceptionResolutionReference"
                name="resolutionReference"
                placeholder="INSP-2026-0001 / CLM-2026-0001"
                required
              />
            </Field>

            <Field data-disabled={!canResolveDeliveryException}>
              <FieldLabel htmlFor="deliveryExceptionResolutionSummary">Resumo</FieldLabel>
              <Textarea
                disabled={isDisabled}
                id="deliveryExceptionResolutionSummary"
                name="resolutionSummary"
                placeholder="Explique a decisao, evidencia e criterio de liberacao"
                required
              />
            </Field>

            <Field data-disabled={!canResolveDeliveryException}>
              <FieldLabel htmlFor="deliveryExceptionResolveSource">Sistema origem</FieldLabel>
              <Input
                defaultValue="saptm"
                disabled={isDisabled}
                id="deliveryExceptionResolveSource"
                name="sourceSystem"
              />
            </Field>

            <Field data-invalid={state.status === "error"}>
              {state.status === "error" ? (
                <FieldError>{state.message}</FieldError>
              ) : (
                <FieldDescription>{state.message}</FieldDescription>
              )}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-between">
          <span className="text-muted-foreground text-xs">
            {canResolveDeliveryException
              ? "Restaura cargo e tracking para permitir cargo.delivery.complete."
              : "Requer resolucao de excecao."}
          </span>
          <Button disabled={isDisabled} type="submit">
            {isPending ? "A resolver..." : "Resolver excecao"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
