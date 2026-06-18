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

import type { CargoComplianceEvidenceVerifyFormState } from "../app/(platform)/app/cargo/form-state";

export type CargoComplianceEvidenceVerifyFormProps = {
  canVerifyComplianceEvidence: boolean;
  initialState: CargoComplianceEvidenceVerifyFormState;
  action: (
    previousState: CargoComplianceEvidenceVerifyFormState,
    formData: FormData,
  ) => Promise<CargoComplianceEvidenceVerifyFormState>;
};

const evidenceReviewStatusOptions = [
  { value: "approved", label: "Aprovar" },
  { value: "rejected", label: "Rejeitar" },
] as const;

export function CargoComplianceEvidenceVerifyForm({
  canVerifyComplianceEvidence,
  initialState,
  action,
}: CargoComplianceEvidenceVerifyFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [idempotencyKey, setIdempotencyKey] = useState(createIdempotencyKey);
  const defaultReviewedAt = useMemo(() => createDatetimeLocalValue(new Date()), []);
  const isDisabled = isPending || !canVerifyComplianceEvidence;

  useEffect(() => {
    if (state.status === "success") {
      setIdempotencyKey(createIdempotencyKey());
    }
  }, [state.status]);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canVerifyComplianceEvidence ? "success" : "warning"}>
            {canVerifyComplianceEvidence ? "Revisao governada" : "Sem permissao"}
          </Badge>
          <Badge variant="outline">cargo.compliance.verify</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Verificar evidencia de compliance</CardTitle>
          <CardDescription className="leading-6">
            Aprova ou rejeita evidencia pendente. A aprovacao bloqueia documentos expirados e
            qualquer revisao gera audit trail, idempotencia e evento de dominio.
          </CardDescription>
        </div>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <FieldGroup>
            <input name="idempotencyKey" type="hidden" value={idempotencyKey} />

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canVerifyComplianceEvidence}>
                <FieldLabel htmlFor="evidenceId">Evidence ID</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="evidenceId"
                  name="evidenceId"
                  placeholder="ID interno da evidencia"
                  required
                />
                <FieldDescription>
                  Apenas evidencias em pending_review podem ser verificadas.
                </FieldDescription>
              </Field>
              <Field data-disabled={!canVerifyComplianceEvidence}>
                <FieldLabel htmlFor="reviewStatus">Decisao</FieldLabel>
                <SelectNative
                  defaultValue="approved"
                  disabled={isDisabled}
                  id="reviewStatus"
                  name="status"
                  required
                >
                  {evidenceReviewStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectNative>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field data-disabled={!canVerifyComplianceEvidence}>
                <FieldLabel htmlFor="reviewerName">Revisor</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="reviewerName"
                  name="reviewerName"
                  placeholder="Nome do revisor"
                  required
                />
              </Field>
              <Field data-disabled={!canVerifyComplianceEvidence}>
                <FieldLabel htmlFor="reviewReference">Referencia da revisao</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="reviewReference"
                  name="reviewReference"
                  placeholder="REV-2026-0001"
                  required
                />
              </Field>
              <Field data-disabled={!canVerifyComplianceEvidence}>
                <FieldLabel htmlFor="reviewedAt">Revisado em</FieldLabel>
                <Input
                  defaultValue={defaultReviewedAt}
                  disabled={isDisabled}
                  id="reviewedAt"
                  name="reviewedAt"
                  type="datetime-local"
                />
              </Field>
            </div>

            <Field data-disabled={!canVerifyComplianceEvidence}>
              <FieldLabel htmlFor="reviewSummary">Resumo da revisao</FieldLabel>
              <Textarea
                disabled={isDisabled}
                id="reviewSummary"
                name="reviewSummary"
                placeholder="Documento conferido contra manifesto, alfandega e dados operacionais."
                required
                rows={4}
              />
            </Field>

            <Field data-disabled={!canVerifyComplianceEvidence}>
              <FieldLabel htmlFor="rejectionReason">Motivo de rejeicao</FieldLabel>
              <Textarea
                disabled={isDisabled}
                id="rejectionReason"
                name="rejectionReason"
                placeholder="Obrigatorio apenas quando a decisao for rejeitar."
                rows={3}
              />
            </Field>

            <Field data-disabled={!canVerifyComplianceEvidence}>
              <FieldLabel htmlFor="verifySourceSystem">Sistema origem</FieldLabel>
              <Input
                defaultValue="saptm"
                disabled={isDisabled}
                id="verifySourceSystem"
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
                    ? `${state.message} Estado: ${state.statusValue ?? "sem-estado"}`
                    : state.message}
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-between">
          <span className="text-muted-foreground text-xs">
            {canVerifyComplianceEvidence
              ? "Revisao cria decisao terminal, audit trail e outbox."
              : "Requer cargo.compliance.verify."}
          </span>
          <Button disabled={isDisabled} type="submit">
            {isPending ? "A verificar..." : "Verificar evidencia"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function createIdempotencyKey(): string {
  const randomValue =
    typeof crypto === "undefined" ? Math.random().toString(36).slice(2) : crypto.randomUUID();

  return `cargo_ver_${randomValue}`;
}

function createDatetimeLocalValue(date: Date): string {
  const timezoneOffsetMs = date.getTimezoneOffset() * 60_000;

  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
}
