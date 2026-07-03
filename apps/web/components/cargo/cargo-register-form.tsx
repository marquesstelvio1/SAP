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
  Checkbox,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  SelectNative,
} from "@saptm/ui";
import { useActionState, useEffect, useMemo, useState } from "react";
import { useCaptureEvent } from "@/hooks/use-capture-event";
import { addHours, createDatetimeLocalValue } from "@/lib/format";
import { createIdempotencyKey } from "@/lib/idempotency";

import type { CargoRegisterFormState } from "../../app/(platform)/app/cargo/form-state";

export type CargoRegisterFormProps = {
  canRegisterCargo: boolean;
  initialState: CargoRegisterFormState;
  action: (
    previousState: CargoRegisterFormState,
    formData: FormData,
  ) => Promise<CargoRegisterFormState>;
};

const inspectionOutcomeOptions = [
  { value: "not_required", label: "Não requerido" },
  { value: "passed", label: "Inspecao aprovada" },
] as const;

const releaseReasonOptions = [
  { value: "customs_cleared", label: "Alfandega liberada" },
  { value: "inspection_passed", label: "Inspecao aprovada" },
  { value: "compliance_ok", label: "Compliance OK" },
  { value: "expedited_release", label: "Liberação expedita" },
  { value: "other", label: "Outra justificativa" },
] as const;

const cargoTypeOptions = [
  { value: "container", label: "Contentor" },
  { value: "bulk", label: "Granel" },
  { value: "break_bulk", label: "Carga solta" },
  { value: "liquid_bulk", label: "Granel líquido" },
  { value: "refrigerated", label: "Refrigerada" },
  { value: "hazardous", label: "Perigosa" },
  { value: "vehicle", label: "Veiculo" },
  { value: "other", label: "Outra" },
] as const;

const customsStatusOptions = [
  { value: "pending", label: "Pendente" },
  { value: "cleared", label: "Liberada" },
  { value: "held", label: "Retida" },
  { value: "not_required", label: "Não requerido" },
] as const;

const conditionStatusOptions = [
  { value: "sound", label: "Integra" },
  { value: "requires_inspection", label: "Requer inspeção" },
  { value: "damaged", label: "Danificada" },
] as const;

export function CargoRegisterForm({
  canRegisterCargo,
  initialState,
  action,
}: CargoRegisterFormProps) {
  const capture = useCaptureEvent();
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [idempotencyKey, setIdempotencyKey] = useState(() => createIdempotencyKey("cargo_reg"));
  const [releaseImmediately, setReleaseImmediately] = useState(true);
  const defaultExpectedReadyAt = useMemo(
    () => createDatetimeLocalValue(addHours(new Date(), 24)),
    [],
  );
  const isDisabled = isPending || !canRegisterCargo;
  const releaseDisabled = isDisabled || !releaseImmediately;

  useEffect(() => {
    if (state.status === "success") {
      setIdempotencyKey(createIdempotencyKey("cargo_reg"));
      capture("cargo:created", {
        cargo_id: state.cargoId,
        cargo_reference: state.cargoReference,
        movement_blocked: state.movementBlocked,
        release_status: state.releaseStatus,
      });
    }
  }, [state.status]);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canRegisterCargo ? "success" : "warning"}>
            {canRegisterCargo ? "Registo autorizado" : "Indisponível"}
          </Badge>
          <Badge variant="outline">Registo de carga</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Registar carga</CardTitle>
          <CardDescription className="leading-6">
            Aplica regras de negócio antes do transporte: identidade única, custódia, peso, volumes,
            compliance aduaneiro, perigosidade, inspecao e registo de auditoria. Opcionalmente
            liberta a carga imediatamente apos o registo.
          </CardDescription>
        </div>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <FieldGroup>
            <input name="idempotencyKey" type="hidden" value={idempotencyKey} />

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canRegisterCargo}>
                <FieldLabel htmlFor="cargoReference">Referência da carga</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="cargoReference"
                  name="cargoReference"
                  placeholder="CGO-2026-0001"
                  required
                />
              </Field>
              <Field data-disabled={!canRegisterCargo}>
                <FieldLabel htmlFor="externalReference">Referência externa</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="externalReference"
                  name="externalReference"
                  placeholder="BL, manifesto ou ordem externa"
                />
              </Field>
            </div>

            <Field data-disabled={!canRegisterCargo}>
              <FieldLabel htmlFor="cargoDescription">Descrição</FieldLabel>
              <Input
                disabled={isDisabled}
                id="cargoDescription"
                name="cargoDescription"
                placeholder="Ex.: 20 contentores de componentes industriais"
                required
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-3">
              <Field data-disabled={!canRegisterCargo}>
                <FieldLabel htmlFor="cargoType">Tipo</FieldLabel>
                <SelectNative disabled={isDisabled} id="cargoType" name="cargoType" required>
                  {cargoTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectNative>
              </Field>
              <Field data-disabled={!canRegisterCargo}>
                <FieldLabel htmlFor="grossWeightKg">Peso bruto kg</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="grossWeightKg"
                  min="0.001"
                  name="grossWeightKg"
                  placeholder="12000"
                  required
                  step="0.001"
                  type="number"
                />
              </Field>
              <Field data-disabled={!canRegisterCargo}>
                <FieldLabel htmlFor="packageCount">Volumes</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="packageCount"
                  min="1"
                  name="packageCount"
                  placeholder="20"
                  required
                  type="number"
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canRegisterCargo}>
                <FieldLabel htmlFor="shipperName">Expedidor</FieldLabel>
                <Input disabled={isDisabled} id="shipperName" name="shipperName" required />
              </Field>
              <Field data-disabled={!canRegisterCargo}>
                <FieldLabel htmlFor="consigneeName">Consignatário</FieldLabel>
                <Input disabled={isDisabled} id="consigneeName" name="consigneeName" required />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-disabled={!canRegisterCargo}>
                <FieldLabel htmlFor="originName">Origem</FieldLabel>
                <Input disabled={isDisabled} id="originName" name="originName" required />
              </Field>
              <Field data-disabled={!canRegisterCargo}>
                <FieldLabel htmlFor="destinationName">Destino</FieldLabel>
                <Input disabled={isDisabled} id="destinationName" name="destinationName" required />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field data-disabled={!canRegisterCargo}>
                <FieldLabel htmlFor="custodyOwnerName">Responsável custódia</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="custodyOwnerName"
                  name="custodyOwnerName"
                  required
                />
              </Field>
              <Field data-disabled={!canRegisterCargo}>
                <FieldLabel htmlFor="priority">Prioridade</FieldLabel>
                <Input
                  defaultValue="3"
                  disabled={isDisabled}
                  id="priority"
                  max="5"
                  min="1"
                  name="priority"
                  required
                  type="number"
                />
              </Field>
              <Field data-disabled={!canRegisterCargo}>
                <FieldLabel htmlFor="expectedReadyAt">Pronto em</FieldLabel>
                <Input
                  defaultValue={defaultExpectedReadyAt}
                  disabled={isDisabled}
                  id="expectedReadyAt"
                  name="expectedReadyAt"
                  type="datetime-local"
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field data-disabled={!canRegisterCargo}>
                <FieldLabel htmlFor="customsStatus">Estado aduaneiro</FieldLabel>
                <SelectNative
                  defaultValue="pending"
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
              <Field data-disabled={!canRegisterCargo}>
                <FieldLabel htmlFor="customsReference">Referência aduaneira</FieldLabel>
                <Input disabled={isDisabled} id="customsReference" name="customsReference" />
              </Field>
              <Field data-disabled={!canRegisterCargo}>
                <FieldLabel htmlFor="conditionStatus">Condição</FieldLabel>
                <SelectNative
                  defaultValue="sound"
                  disabled={isDisabled}
                  id="conditionStatus"
                  name="conditionStatus"
                  required
                >
                  {conditionStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectNative>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field data-disabled={!canRegisterCargo} orientation="horizontal">
                <Checkbox
                  className="mt-0.5"
                  disabled={isDisabled}
                  id="hazardous"
                  name="hazardous"
                />
                <div className="flex flex-col gap-1">
                  <FieldLabel htmlFor="hazardous">Carga perigosa</FieldLabel>
                  <FieldDescription>Exige UN number e classe de risco.</FieldDescription>
                </div>
              </Field>
              <Field data-disabled={!canRegisterCargo}>
                <FieldLabel htmlFor="unNumber">UN number</FieldLabel>
                <Input disabled={isDisabled} id="unNumber" name="unNumber" placeholder="UN1203" />
              </Field>
              <Field data-disabled={!canRegisterCargo}>
                <FieldLabel htmlFor="hazardClass">Classe de risco</FieldLabel>
                <Input disabled={isDisabled} id="hazardClass" name="hazardClass" placeholder="3" />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field data-disabled={!canRegisterCargo} orientation="horizontal">
                <Checkbox
                  className="mt-0.5"
                  disabled={isDisabled}
                  id="requiresInspection"
                  name="requiresInspection"
                />
                <div className="flex flex-col gap-1">
                  <FieldLabel htmlFor="requiresInspection">Requer inspeção</FieldLabel>
                  <FieldDescription>Bloqueia movimento até validação operacional.</FieldDescription>
                </div>
              </Field>
              <Field data-disabled={!canRegisterCargo}>
                <FieldLabel htmlFor="volumeM3">Volume m3</FieldLabel>
                <Input
                  disabled={isDisabled}
                  id="volumeM3"
                  min="0.001"
                  name="volumeM3"
                  step="0.001"
                  type="number"
                />
              </Field>
              <Field data-disabled={!canRegisterCargo}>
                <FieldLabel htmlFor="sourceSystem">Sistema origem</FieldLabel>
                <Input
                  defaultValue="saptm"
                  disabled={isDisabled}
                  id="sourceSystem"
                  name="sourceSystem"
                />
              </Field>
            </div>

            {/* Release immediately section */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <Field orientation="horizontal">
                <Checkbox
                  checked={releaseImmediately}
                  className="mt-0.5"
                  id="releaseImmediately"
                  name="releaseImmediately"
                  onCheckedChange={(checked) => setReleaseImmediately(checked === true)}
                />
                <div className="flex flex-col gap-1">
                  <FieldLabel htmlFor="releaseImmediately">Libertar apos registo</FieldLabel>
                  <FieldDescription>
                    Se marcado, a carga e libertada automaticamente para transporte apos o registo
                    bem-sucedido.
                  </FieldDescription>
                </div>
              </Field>

              {releaseImmediately && (
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <Field data-disabled={!canRegisterCargo}>
                    <FieldLabel htmlFor="releaseReason">Justificativa operacional</FieldLabel>
                    <SelectNative
                      disabled={releaseDisabled}
                      id="releaseReason"
                      name="releaseReason"
                      required
                    >
                      <option value="">Selecionar...</option>
                      {releaseReasonOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </SelectNative>
                  </Field>
                  <Field data-disabled={!canRegisterCargo}>
                    <FieldLabel htmlFor="releaseReference">Referencia de liberação</FieldLabel>
                    <Input
                      disabled={releaseDisabled}
                      id="releaseReference"
                      name="releaseReference"
                      placeholder="DU, inspecao, manifesto"
                    />
                  </Field>
                  <Field data-disabled={!canRegisterCargo}>
                    <FieldLabel htmlFor="inspectionOutcome">Resultado da inspecao</FieldLabel>
                    <SelectNative
                      defaultValue="not_required"
                      disabled={releaseDisabled}
                      id="inspectionOutcome"
                      name="inspectionOutcome"
                    >
                      {inspectionOutcomeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </SelectNative>
                  </Field>
                </div>
              )}
            </div>

            <Field data-invalid={state.status === "error"}>
              {state.status === "error" ? (
                <FieldError>{state.message}</FieldError>
              ) : (
                <FieldDescription>
                  {state.status === "success"
                    ? `${state.message} Ref.: ${state.cargoReference ?? "sem-ref"} · Bloqueio: ${
                        state.movementBlocked ? "sim" : "não"
                      }${state.releaseStatus === "released" ? " · Liberta: sim" : ""}`
                    : state.message}
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-between">
          <span className="text-muted-foreground text-xs">
            {canRegisterCargo
              ? releaseImmediately
                ? "Registo com libertação cria auditoria em ambos os passos."
                : "Registo cria registo de auditoria."
              : "Requer registo de cargas."}
          </span>
          <Button disabled={isDisabled} type="submit">
            {isPending
              ? releaseImmediately
                ? "A registar e libertar..."
                : "A registar..."
              : releaseImmediately
                ? "Registar e libertar"
                : "Registar carga"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
