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

import { createIdempotencyKey } from "@/lib/idempotency";
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
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    createIdempotencyKey("tariff_approve"),
  );
  const isDisabled = isPending || !canApproveQuotes;

  useEffect(() => {
    if (state.status === "success") {
      setIdempotencyKey(createIdempotencyKey("tariff_approve"));
    }
  }, [state.status]);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canApproveQuotes ? "success" : "warning"}>
            {canApproveQuotes ? "Aprovação financeira" : "Sem permissão"}
          </Badge>
          <Badge variant="outline">tariff.quote.approve</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Aprovar cotação</CardTitle>
          <CardDescription className="leading-6">
            Aprova somente cotações calculadas e exige referência, responsável e justificativa.
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
                <FieldLabel htmlFor="approvalReference">Referência aprovação</FieldLabel>
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
              <FieldLabel htmlFor="approvalNotes">Notas de aprovação</FieldLabel>
              <Textarea
                disabled={isDisabled}
                id="approvalNotes"
                name="approvalNotes"
                placeholder="Approved for contracted customer rate."
                required
              />
            </Field>
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
            {canApproveQuotes ? "Exige estado calculado." : "Requer aprovacao de cotacao."}
          </span>
          <Button disabled={isDisabled} type="submit">
            {isPending ? "A aprovar..." : "Aprovar cotação"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
