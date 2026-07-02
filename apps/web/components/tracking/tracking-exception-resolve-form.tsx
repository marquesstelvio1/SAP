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
import type { TrackingExceptionResolveFormState } from "../../app/(platform)/app/tracking/form-state";

export type TrackingExceptionResolutionShipment = {
  id: string;
  referenceCode: string;
  cargoDescription: string;
  status: string;
};

export type TrackingExceptionResolveFormProps = {
  shipment: TrackingExceptionResolutionShipment;
  canResolveExceptions: boolean;
  isResolutionAllowed: boolean;
  initialState: TrackingExceptionResolveFormState;
  action: (
    previousState: TrackingExceptionResolveFormState,
    formData: FormData,
  ) => Promise<TrackingExceptionResolveFormState>;
};

const resolutionCodeOptions = [
  { value: "documentation_fixed", label: "Documentação corrigida" },
  { value: "customs_released", label: "Alfandega liberou" },
  { value: "capacity_reallocated", label: "Capacidade realocada" },
  { value: "infrastructure_restored", label: "Infraestrutura restaurada" },
  { value: "cargo_recovered", label: "Carga recuperada" },
  { value: "weather_cleared", label: "Meteorologia normalizada" },
  { value: "manual_override", label: "Override operacional" },
  { value: "other", label: "Outra" },
] as const;

const nextStatusOptions = [
  { value: "in_transit", label: "Retomar em transito" },
  { value: "arrived", label: "Marcar como chegou" },
  { value: "completed", label: "Marcar como concluído" },
] as const;

const evidenceTypeOptions = [
  { value: "operator_note", label: "Nota do operador" },
  { value: "photo", label: "Foto" },
  { value: "document", label: "Documento" },
  { value: "sensor", label: "Sensor" },
  { value: "inspection", label: "Inspeção" },
  { value: "external_reference", label: "Referencia externa" },
] as const;

export function TrackingExceptionResolveForm({
  shipment,
  canResolveExceptions,
  isResolutionAllowed,
  initialState,
  action,
}: TrackingExceptionResolveFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [idempotencyKey, setIdempotencyKey] = useState(() => createIdempotencyKey("trk_res"));
  const defaultOccurredAt = useMemo(() => createDatetimeLocalValue(new Date()), []);
  const isDisabled = isPending || !canResolveExceptions || !isResolutionAllowed;

  useEffect(() => {
    if (state.status === "success") {
      setIdempotencyKey(createIdempotencyKey("trk_res"));
    }
  }, [state.status]);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canResolveExceptions && isResolutionAllowed ? "success" : "outline"}>
            {canResolveExceptions && isResolutionAllowed ? "Resolucao autorizada" : "Indisponível"}
          </Badge>
          <Badge variant="outline">Resolucao</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Resolver excecao operacional</CardTitle>
          <CardDescription className="leading-6">
            Fecha uma excecao ativa com registo de auditoria e recuperacao de status.
          </CardDescription>
        </div>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <FieldGroup>
            <input name="shipmentId" type="hidden" value={shipment.id} />
            <input name="idempotencyKey" type="hidden" value={idempotencyKey} />

            <Field data-disabled={isDisabled}>
              <FieldLabel>Carga afetada</FieldLabel>
              <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                <span className="font-medium">{shipment.referenceCode}</span>
                <span className="text-muted-foreground"> - {shipment.cargoDescription}</span>
              </div>
              <FieldDescription>Status atual: {shipment.status}</FieldDescription>
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={isDisabled}>
                <FieldLabel htmlFor="resolutionCode">Codigo de resolucao</FieldLabel>
                <SelectNative
                  defaultValue="customs_released"
                  disabled={isDisabled}
                  id="resolutionCode"
                  name="resolutionCode"
                  required
                >
                  {resolutionCodeOptions.map((resolutionCode) => (
                    <option key={resolutionCode.value} value={resolutionCode.value}>
                      {resolutionCode.label}
                    </option>
                  ))}
                </SelectNative>
              </Field>

              <Field data-disabled={isDisabled}>
                <FieldLabel htmlFor="nextStatus">Status apos resolucao</FieldLabel>
                <SelectNative
                  defaultValue="in_transit"
                  disabled={isDisabled}
                  id="nextStatus"
                  name="nextStatus"
                  required
                >
                  {nextStatusOptions.map((nextStatus) => (
                    <option key={nextStatus.value} value={nextStatus.value}>
                      {nextStatus.label}
                    </option>
                  ))}
                </SelectNative>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={isDisabled}>
                <FieldLabel htmlFor="resolveOccurredAt">Resolvida em</FieldLabel>
                <Input
                  defaultValue={defaultOccurredAt}
                  disabled={isDisabled}
                  id="resolveOccurredAt"
                  name="occurredAt"
                  required
                  type="datetime-local"
                />
              </Field>

              <Field data-disabled={isDisabled}>
                <FieldLabel htmlFor="resolveLocationName">Local de liberacao</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="resolveLocationName"
                  name="locationName"
                  placeholder="Ex.: Port Terminal B"
                />
              </Field>
            </div>

            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="resolveOwnerTeam">Equipa responsavel</FieldLabel>
              <Input
                disabled={isDisabled}
                id="resolveOwnerTeam"
                name="ownerTeam"
                placeholder="Ex.: Port operations"
              />
            </Field>

            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="resolveSummary">Resumo da resolucao</FieldLabel>
              <Textarea
                disabled={isDisabled}
                id="resolveSummary"
                name="summary"
                placeholder="Ex.: Manifesto corrigido e carga liberada para retomar o percurso."
                required
              />
            </Field>

            <Field data-disabled={isDisabled}>
              <FieldLabel>Evidencia e aprovacao</FieldLabel>
              <FieldDescription>
                Resolver uma excecao exige evidencia operacional e aprovacao explicita antes do
                status ser recuperado.
              </FieldDescription>
            </Field>

            <input name="approvalStatus" type="hidden" value="approved" />

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={isDisabled}>
                <FieldLabel htmlFor="resolveOperatorName">Operador responsavel</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="resolveOperatorName"
                  name="operatorName"
                  placeholder="Ex.: Joao Silva"
                  required
                />
              </Field>

              <Field data-disabled={isDisabled}>
                <FieldLabel htmlFor="resolveEvidenceType">Tipo de evidencia</FieldLabel>
                <SelectNative
                  defaultValue="document"
                  disabled={isDisabled}
                  id="resolveEvidenceType"
                  name="evidenceType"
                  required
                >
                  {evidenceTypeOptions.map((evidenceType) => (
                    <option key={evidenceType.value} value={evidenceType.value}>
                      {evidenceType.label}
                    </option>
                  ))}
                </SelectNative>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={isDisabled}>
                <FieldLabel htmlFor="resolveEvidenceReference">Referencia da evidencia</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="resolveEvidenceReference"
                  name="evidenceReference"
                  placeholder="Ex.: REL-900"
                  required
                />
              </Field>

              <Field data-disabled={isDisabled}>
                <FieldLabel htmlFor="resolveApprovalReference">Referencia da aprovacao</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="resolveApprovalReference"
                  name="approvalReference"
                  placeholder="Ex.: APR-OPS-2026-019"
                  required
                />
              </Field>
            </div>

            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="resolveEvidenceSummary">Resumo da evidencia</FieldLabel>
              <Textarea
                disabled={isDisabled}
                id="resolveEvidenceSummary"
                name="evidenceSummary"
                placeholder="Descreva a prova usada para libertar a carga."
                required
              />
            </Field>

            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="resolveApproverName">Aprovador</FieldLabel>
              <Input
                disabled={isDisabled}
                id="resolveApproverName"
                name="approverName"
                placeholder="Ex.: Supervisor de Operações"
                required
              />
              <FieldDescription>Resolucao so aceita aprovacao aprovada.</FieldDescription>
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={isDisabled}>
                <FieldLabel htmlFor="resolveSourceSystem">Sistema origem</FieldLabel>
                <Input
                  defaultValue="saptm"
                  disabled={isDisabled}
                  id="resolveSourceSystem"
                  name="sourceSystem"
                />
              </Field>

              <Field data-disabled={isDisabled}>
                <FieldLabel htmlFor="resolvePayload">Payload JSON opcional</FieldLabel>
                <Textarea
                  disabled={isDisabled}
                  id="resolvePayload"
                  name="payload"
                  placeholder='{"releaseReference":"REL-900","approver":"ops"}'
                  spellCheck={false}
                />
              </Field>
            </div>

            <Field data-invalid={state.status === "error"}>
              {state.status === "error" ? (
                <FieldError>{state.message}</FieldError>
              ) : (
                <FieldDescription>
                  {state.message}
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-between">
          <span className="text-muted-foreground text-xs">
            {resolveFooterMessage(canResolveExceptions, isResolutionAllowed)}
          </span>
          <Button disabled={isDisabled} type="submit">
            {isPending ? "A resolver..." : "Resolver excecao"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function resolveFooterMessage(canResolveExceptions: boolean, isResolutionAllowed: boolean): string {
  if (!canResolveExceptions) {
    return "Requer resolucao de excecoes.";
  }

  if (!isResolutionAllowed) {
    return "Requer status atrasado ou em excecao.";
  }

  return "Resolucao grava recuperacao de status com auditoria.";
}
