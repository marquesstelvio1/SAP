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
import { useCaptureEvent } from "@/hooks/use-capture-event";
import { createIdempotencyKey } from "@/lib/idempotency";

import type { CargoComplianceEvidenceRecordFormState } from "../../app/(platform)/app/cargo/form-state";

export type CargoComplianceEvidenceRecordFormProps = {
  canRecordComplianceEvidence: boolean;
  initialState: CargoComplianceEvidenceRecordFormState;
  action: (
    previousState: CargoComplianceEvidenceRecordFormState,
    formData: FormData,
  ) => Promise<CargoComplianceEvidenceRecordFormState>;
};

const evidenceTypeOptions = [
  { value: "bill_of_lading", label: "Bill of lading" },
  { value: "customs_declaration", label: "Declaracao aduaneira" },
  { value: "inspection_certificate", label: "Certificado de inspecao" },
  { value: "hazardous_goods_declaration", label: "Declaracao carga perigosa" },
  { value: "packing_list", label: "Packing list" },
  { value: "insurance_certificate", label: "Certificado de seguro" },
  { value: "release_authorization", label: "Autorizacao de liberacao" },
  { value: "other", label: "Outra evidencia" },
] as const;

export function CargoComplianceEvidenceRecordForm({
  canRecordComplianceEvidence,
  initialState,
  action,
}: CargoComplianceEvidenceRecordFormProps) {
  const capture = useCaptureEvent();
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [idempotencyKey, setIdempotencyKey] = useState(() => createIdempotencyKey("cargo_ev"));
  const isDisabled = isPending || !canRecordComplianceEvidence;

  useEffect(() => {
    if (state.status === "success") {
      setIdempotencyKey(createIdempotencyKey("cargo_ev"));
      capture("cargo:status_changed", {
        cargo_id: state.cargoId,
        to_status: "compliance_evidence_recorded",
        evidence_id: state.evidenceId,
        evidence_type: state.evidenceType,
      });
    }
  }, [state.status]);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canRecordComplianceEvidence ? "success" : "warning"}>
            {canRecordComplianceEvidence ? "Evidencia autorizada" : "Indisponível"}
          </Badge>
          <Badge variant="outline">Registar conformidade</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Registar evidencia de compliance</CardTitle>
          <CardDescription className="leading-6">
            Regista evidencia documental para uma carga. O sistema bloqueia evidencia expirada,
            duplicada, inconsistente com carga perigosa ou carga cancelada.
          </CardDescription>
        </div>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <FieldGroup>
            <input name="idempotencyKey" type="hidden" value={idempotencyKey} />

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canRecordComplianceEvidence}>
                <FieldLabel htmlFor="complianceCargoId">Cargo ID</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="complianceCargoId"
                  name="cargoId"
                  placeholder="ID interno da carga"
                  required
                />
                <FieldDescription>
                  A evidência fica ligada a uma única carga dentro da organização.
                </FieldDescription>
              </Field>
              <Field data-disabled={!canRecordComplianceEvidence}>
                <FieldLabel htmlFor="evidenceType">Tipo de evidencia</FieldLabel>
                <SelectNative
                  defaultValue="bill_of_lading"
                  disabled={isDisabled}
                  id="evidenceType"
                  name="evidenceType"
                  required
                >
                  {evidenceTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectNative>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canRecordComplianceEvidence}>
                <FieldLabel htmlFor="documentReference">Referencia documental</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="documentReference"
                  name="documentReference"
                  placeholder="DOC-2026-0001"
                  required
                />
              </Field>
              <Field data-disabled={!canRecordComplianceEvidence}>
                <FieldLabel htmlFor="documentTitle">Titulo do documento</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="documentTitle"
                  name="documentTitle"
                  placeholder="Conhecimento de embarque principal"
                  required
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canRecordComplianceEvidence}>
                <FieldLabel htmlFor="issuerName">Emissor</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="issuerName"
                  name="issuerName"
                  placeholder="Autoridade / armador / seguradora"
                  required
                />
              </Field>
              <Field data-disabled={!canRecordComplianceEvidence}>
                <FieldLabel htmlFor="documentUri">URI documental</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="documentUri"
                  name="documentUri"
                  placeholder="https://... ou referencia interna"
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canRecordComplianceEvidence}>
                <FieldLabel htmlFor="issuedAt">Emitido em</FieldLabel>
                <Input disabled={isDisabled} id="issuedAt" name="issuedAt" type="datetime-local" />
              </Field>
              <Field data-disabled={!canRecordComplianceEvidence}>
                <FieldLabel htmlFor="expiresAt">Expira em</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="expiresAt"
                  name="expiresAt"
                  type="datetime-local"
                />
              </Field>
            </div>

            <Field data-disabled={!canRecordComplianceEvidence}>
              <FieldLabel htmlFor="complianceSourceSystem">Sistema origem</FieldLabel>
              <Input
                defaultValue="saptm"
                disabled={isDisabled}
                id="complianceSourceSystem"
                name="sourceSystem"
              />
            </Field>

            <Field data-invalid={state.status === "error"}>
              {state.status === "error" ? (
                <FieldError>{state.message}</FieldError>
              ) : (
                <FieldDescription>
                  {state.status === "success"
                    ? `${state.message} Evidencia: ${
                        state.documentReference ?? state.evidenceId ?? "sem-ref"
                      }`
                    : state.message}
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-between">
          <span className="text-muted-foreground text-xs">
            {canRecordComplianceEvidence
              ? "Cria evidencia pendente de revisao com auditoria."
              : "Requer registo de evidencias."}
          </span>
          <Button disabled={isDisabled} type="submit">
            {isPending ? "A registar..." : "Registar evidencia"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
