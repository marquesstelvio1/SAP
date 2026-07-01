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
import type { TrackingExceptionManageFormState } from "../../app/(platform)/app/tracking/form-state";

export type TrackingExceptionShipment = {
  id: string;
  referenceCode: string;
  cargoDescription: string;
  status: string;
};

export type TrackingExceptionManageFormProps = {
  shipment: TrackingExceptionShipment;
  canManageExceptions: boolean;
  initialState: TrackingExceptionManageFormState;
  action: (
    previousState: TrackingExceptionManageFormState,
    formData: FormData,
  ) => Promise<TrackingExceptionManageFormState>;
};

const exceptionCategoryOptions = [
  { value: "delay", label: "Atraso" },
  { value: "damage", label: "Dano de carga" },
  { value: "customs_hold", label: "Retenção aduaneira" },
  { value: "security", label: "Segurança" },
  { value: "capacity", label: "Capacidade" },
  { value: "documentation", label: "Documentação" },
  { value: "weather", label: "Meteorologia" },
  { value: "infrastructure", label: "Infraestrutura" },
  { value: "other", label: "Outra" },
] as const;

const severityOptions = [
  { value: "medium", label: "Media" },
  { value: "high", label: "Alta" },
  { value: "critical", label: "Critica" },
] as const;

const evidenceTypeOptions = [
  { value: "operator_note", label: "Nota do operador" },
  { value: "photo", label: "Foto" },
  { value: "document", label: "Documento" },
  { value: "sensor", label: "Sensor" },
  { value: "inspection", label: "Inspeção" },
  { value: "external_reference", label: "Referencia externa" },
] as const;

const approvalStatusOptions = [
  { value: "pending_review", label: "Pendente de revisão" },
  { value: "approved", label: "Aprovado" },
] as const;

export function TrackingExceptionManageForm({
  shipment,
  canManageExceptions,
  initialState,
  action,
}: TrackingExceptionManageFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [idempotencyKey, setIdempotencyKey] = useState(() => createIdempotencyKey("trk_exc"));
  const defaultOccurredAt = useMemo(() => createDatetimeLocalValue(new Date()), []);
  const defaultExpectedResolutionAt = useMemo(
    () => createDatetimeLocalValue(new Date(Date.now() + 24 * 60 * 60 * 1000)),
    [],
  );
  const isDisabled = isPending || !canManageExceptions;

  useEffect(() => {
    if (state.status === "success") {
      setIdempotencyKey(createIdempotencyKey("trk_exc"));
    }
  }, [state.status]);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canManageExceptions ? "warning" : "outline"}>
            {canManageExceptions ? "Exceção autorizada" : "Indisponível"}
          </Badge>
          <Badge variant="outline">tracking.exception.manage</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Gerir exceção operacional</CardTitle>
          <CardDescription className="leading-6">
            Abre uma exceção com plano de recuperação e registo de auditoria. A UI executa apenas o
            comando autorizado do backend.
          </CardDescription>
        </div>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <FieldGroup>
            <input name="shipmentId" type="hidden" value={shipment.id} />
            <input name="idempotencyKey" type="hidden" value={idempotencyKey} />

            <Field data-disabled={!canManageExceptions}>
              <FieldLabel>Carga afetada</FieldLabel>
              <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                <span className="font-medium">{shipment.referenceCode}</span>
                <span className="text-muted-foreground"> - {shipment.cargoDescription}</span>
              </div>
              <FieldDescription>Status atual: {shipment.status}</FieldDescription>
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canManageExceptions}>
                <FieldLabel htmlFor="category">Categoria</FieldLabel>
                <SelectNative
                  defaultValue="delay"
                  disabled={isDisabled}
                  id="category"
                  name="category"
                  required
                >
                  {exceptionCategoryOptions.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </SelectNative>
              </Field>

              <Field data-disabled={!canManageExceptions}>
                <FieldLabel htmlFor="severity">Severidade</FieldLabel>
                <SelectNative
                  defaultValue="high"
                  disabled={isDisabled}
                  id="severity"
                  name="severity"
                  required
                >
                  {severityOptions.map((severity) => (
                    <option key={severity.value} value={severity.value}>
                      {severity.label}
                    </option>
                  ))}
                </SelectNative>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canManageExceptions}>
                <FieldLabel htmlFor="occurredAt">Ocorrida em</FieldLabel>
                <Input
                  defaultValue={defaultOccurredAt}
                  disabled={isDisabled}
                  id="occurredAt"
                  name="occurredAt"
                  required
                  type="datetime-local"
                />
              </Field>

              <Field data-disabled={!canManageExceptions}>
                <FieldLabel htmlFor="expectedResolutionAt">Previsao de resolucao</FieldLabel>
                <Input
                  defaultValue={defaultExpectedResolutionAt}
                  disabled={isDisabled}
                  id="expectedResolutionAt"
                  name="expectedResolutionAt"
                  type="datetime-local"
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canManageExceptions}>
                <FieldLabel htmlFor="locationName">Local afetado</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="locationName"
                  name="locationName"
                  placeholder="Ex.: Port Terminal B"
                />
              </Field>

              <Field data-disabled={!canManageExceptions}>
                <FieldLabel htmlFor="ownerTeam">Equipa responsavel</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="ownerTeam"
                  name="ownerTeam"
                  placeholder="Ex.: Port operations"
                />
              </Field>
            </div>

            <Field data-disabled={!canManageExceptions}>
              <FieldLabel htmlFor="summary">Resumo da excecao</FieldLabel>
              <Input
                disabled={isDisabled}
                id="summary"
                name="summary"
                placeholder="Ex.: Carga retida por revisão documental."
                required
              />
            </Field>

            <Field data-disabled={!canManageExceptions}>
              <FieldLabel htmlFor="recoveryPlan">Plano de recuperacao</FieldLabel>
              <Textarea
                disabled={isDisabled}
                id="recoveryPlan"
                name="recoveryPlan"
                placeholder="Defina responsavel, proxima acao, prazo e criterio de encerramento."
                required
              />
            </Field>

            <Field data-disabled={!canManageExceptions}>
              <FieldLabel>Evidência e aprovação</FieldLabel>
              <FieldDescription>
                Toda mudança de ciclo da exceção deve apontar operador, evidência verificável e
                estado de aprovação.
              </FieldDescription>
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canManageExceptions}>
                <FieldLabel htmlFor="operatorName">Operador responsavel</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="operatorName"
                  name="operatorName"
                  placeholder="Ex.: Joao Silva"
                  required
                />
              </Field>

              <Field data-disabled={!canManageExceptions}>
                <FieldLabel htmlFor="evidenceType">Tipo de evidencia</FieldLabel>
                <SelectNative
                  defaultValue="operator_note"
                  disabled={isDisabled}
                  id="evidenceType"
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
              <Field data-disabled={!canManageExceptions}>
                <FieldLabel htmlFor="evidenceReference">Referencia da evidencia</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="evidenceReference"
                  name="evidenceReference"
                  placeholder="Ex.: DOC-REV-2026-0042"
                  required
                />
              </Field>

              <Field data-disabled={!canManageExceptions}>
                <FieldLabel htmlFor="approvalStatus">Estado de aprovacao</FieldLabel>
                <SelectNative
                  defaultValue="pending_review"
                  disabled={isDisabled}
                  id="approvalStatus"
                  name="approvalStatus"
                  required
                >
                  {approvalStatusOptions.map((approvalStatus) => (
                    <option key={approvalStatus.value} value={approvalStatus.value}>
                      {approvalStatus.label}
                    </option>
                  ))}
                </SelectNative>
              </Field>
            </div>

            <Field data-disabled={!canManageExceptions}>
              <FieldLabel htmlFor="evidenceSummary">Resumo da evidencia</FieldLabel>
              <Textarea
                disabled={isDisabled}
                id="evidenceSummary"
                name="evidenceSummary"
                placeholder="Descreva o que foi observado, anexado ou confirmado."
                required
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canManageExceptions}>
                <FieldLabel htmlFor="approvalReference">Referencia da aprovacao</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="approvalReference"
                  name="approvalReference"
                  placeholder="Ex.: APR-OPS-2026-019"
                />
                <FieldDescription>Obrigatorio quando o estado for aprovado.</FieldDescription>
              </Field>

              <Field data-disabled={!canManageExceptions}>
                <FieldLabel htmlFor="approverName">Aprovador</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="approverName"
                  name="approverName"
                  placeholder="Ex.: Supervisor de Operações"
                />
                <FieldDescription>Obrigatorio quando o estado for aprovado.</FieldDescription>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canManageExceptions}>
                <FieldLabel htmlFor="sourceSystem">Sistema origem</FieldLabel>
                <Input
                  defaultValue="saptm"
                  disabled={isDisabled}
                  id="sourceSystem"
                  name="sourceSystem"
                />
              </Field>

              <Field data-disabled={!canManageExceptions}>
                <FieldLabel htmlFor="payload">Payload JSON opcional</FieldLabel>
                <Textarea
                  disabled={isDisabled}
                  id="payload"
                  name="payload"
                  placeholder='{"holdCode":"DOC_REVIEW","terminal":"PT-B"}'
                  spellCheck={false}
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
                    ? `${state.message} Evento: ${state.eventId ?? "sem-id"} Status: ${
                        state.currentStatus ?? "sem-status"
                      } Evidência: ${state.evidenceReference ?? "sem-evidencia"} Aprovação: ${
                        state.approvalStatus ?? "sem-status"
                      } Workflow: ${state.workflowState ?? "sem-workflow"}`
                    : state.message}
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-between">
          <span className="text-muted-foreground text-xs">
            {canManageExceptions
              ? "Excecao gravada com registo de auditoria."
              : "Requer gestao de excecoes."}
          </span>
          <Button disabled={isDisabled} type="submit">
            {isPending ? "A gerir..." : "Gerir exceção"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
