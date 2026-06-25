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
  Textarea,
} from "@saptm/ui";
import { useActionState, useEffect, useState } from "react";

import type { TariffQuoteApproveFormState } from "../../app/(platform)/app/tariffs/form-state";

export type TariffQuoteApproveFormProps = {
  canApproveQuotes: boolean;
  initialState: TariffQuoteApproveFormState;
  action: (
    previousState: TariffQuoteApproveFormState,
    formData: FormData,
  ) => Promise<TariffQuoteApproveFormState>;
};

export function TariffQuoteApproveForm({
  canApproveQuotes,
  initialState,
  action,
}: TariffQuoteApproveFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [idempotencyKey, setIdempotencyKey] = useState(createIdempotencyKey);
  const isDisabled = isPending || !canApproveQuotes;

  useEffect(() => {
    if (state.status === "success") {
      setIdempotencyKey(createIdempotencyKey());
    }
  }, [state.status]);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canApproveQuotes ? "success" : "warning"}>
            {canApproveQuotes ? "Aprovacao financeira" : "Sem permissao"}
          </Badge>
          <Badge variant="outline">tariff.quote.approve</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Aprovar cotacao</CardTitle>
          <CardDescription className="leading-6">
            Aprova somente cotacoes calculadas e exige referencia, responsavel e justificativa.
          </CardDescription>
        </div>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <FieldGroup>
            <input name="idempotencyKey" type="hidden" value={idempotencyKey} />
            <div className="grid gap-4 md:grid-cols-3">
              <Field data-disabled={!canApproveQuotes}>
                <FieldLabel htmlFor="quoteId">Quote ID</FieldLabel>
                <Input disabled={isDisabled} id="quoteId" name="quoteId" required />
              </Field>
              <Field data-disabled={!canApproveQuotes}>
                <FieldLabel htmlFor="approvalReference">Referencia aprovacao</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="approvalReference"
                  name="approvalReference"
                  placeholder="APPROVAL-001"
                  required
                />
              </Field>
              <Field data-disabled={!canApproveQuotes}>
                <FieldLabel htmlFor="approvedAt">Aprovado em</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="approvedAt"
                  name="approvedAt"
                  required
                  type="datetime-local"
                />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canApproveQuotes}>
                <FieldLabel htmlFor="approvedByName">Aprovador</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="approvedByName"
                  name="approvedByName"
                  placeholder="Finance Controller"
                  required
                />
              </Field>
              <Field data-disabled={!canApproveQuotes}>
                <FieldLabel htmlFor="approvalSourceSystem">Sistema origem</FieldLabel>
                <Input
                  defaultValue="saptm"
                  disabled={isDisabled}
                  id="approvalSourceSystem"
                  name="sourceSystem"
                />
              </Field>
            </div>
            <Field data-disabled={!canApproveQuotes}>
              <FieldLabel htmlFor="approvalNotes">Notas de aprovacao</FieldLabel>
              <Textarea
                disabled={isDisabled}
                id="approvalNotes"
                name="approvalNotes"
                placeholder="Approved for contracted customer rate."
                required
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
                    ? `${state.message} Ref: ${state.approvalReference ?? state.quoteId}`
                    : state.message}
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-between">
          <span className="text-muted-foreground text-xs">
            {canApproveQuotes ? "Exige estado calculated." : "Requer tariff.quote.approve."}
          </span>
          <Button disabled={isDisabled} type="submit">
            {isPending ? "A aprovar..." : "Aprovar cotacao"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function createIdempotencyKey(): string {
  const randomValue =
    typeof crypto === "undefined" ? Math.random().toString(36).slice(2) : crypto.randomUUID();

  return `tariff_approve_${randomValue}`;
}
