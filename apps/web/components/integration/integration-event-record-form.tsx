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
import { useActionState } from "react";

import type { IntegrationEventRecordFormState } from "../../app/(platform)/app/integrations/form-state";

export type IntegrationEventServiceAccountOption = {
  id: string;
  name: string;
  active: boolean;
};

export type IntegrationEventRecordFormProps = {
  canIngestEvents: boolean;
  initialState: IntegrationEventRecordFormState;
  serviceAccounts: readonly IntegrationEventServiceAccountOption[];
  action: (
    previousState: IntegrationEventRecordFormState,
    formData: FormData,
  ) => Promise<IntegrationEventRecordFormState>;
};

export function IntegrationEventRecordForm({
  action,
  canIngestEvents,
  initialState,
  serviceAccounts,
}: IntegrationEventRecordFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const activeServiceAccounts = serviceAccounts.filter((serviceAccount) => serviceAccount.active);
  const isDisabled = isPending || !canIngestEvents || activeServiceAccounts.length === 0;

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canIngestEvents ? "success" : "warning"}>
            {canIngestEvents ? "Ingestão autorizada" : "Indisponível"}
          </Badge>
          <Badge variant="outline">Recepção externa</Badge>
          <Badge variant="outline">Auditoria activa</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Registar evento externo</CardTitle>
          <CardDescription className="leading-6">
            Simula a entrada local de eventos EDI/TOS/ERP antes das integrações externas. A
            referência única combina organização, origem e identificador externo.
          </CardDescription>
        </div>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <FieldGroup>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="integrationServiceAccountId">Conta de integração</FieldLabel>
              <SelectNative
                disabled={isDisabled}
                id="integrationServiceAccountId"
                name="serviceAccountId"
                required
              >
                {activeServiceAccounts.map((serviceAccount) => (
                  <option key={serviceAccount.id} value={serviceAccount.id}>
                    {serviceAccount.name}
                  </option>
                ))}
              </SelectNative>
              <FieldDescription>
                O emissor precisa estar activo e autorizado para recepção de eventos.
              </FieldDescription>
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="integrationSourceSystem">Source system</FieldLabel>
              <Input
                disabled={isDisabled}
                id="integrationSourceSystem"
                name="sourceSystem"
                placeholder="port-tos"
                required
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="integrationExternalId">External ID</FieldLabel>
              <Input
                disabled={isDisabled}
                id="integrationExternalId"
                name="externalId"
                placeholder="MOVE-2026-001"
                required
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="integrationEventType">Event type</FieldLabel>
              <Input
                disabled={isDisabled}
                id="integrationEventType"
                name="eventType"
                placeholder="tracking.location_updated"
                required
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="integrationPayload">Payload JSON</FieldLabel>
              <Textarea
                defaultValue={'{"location":"Terminal A","containers":12,"delayed":false}'}
                disabled={isDisabled}
                id="integrationPayload"
                name="payload"
                required
              />
              <FieldDescription>
                Objeto JSON simples: string, number, boolean ou null no primeiro nivel.
              </FieldDescription>
            </Field>
            <Field>
              <FieldDescription>
                {state.status === "success" && state.eventId !== undefined
                  ? `${state.message} Evento: ${state.eventId} · Idempotencia: ${
                      state.idempotencyKey ?? "sem-chave"
                    } · Replay: ${state.replayed ? "sim" : "nao"}`
                  : state.message}
              </FieldDescription>
              {state.status === "error" ? <FieldError>{state.message}</FieldError> : null}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter>
          <Button disabled={isDisabled} type="submit">
            {isPending ? "A registar..." : "Registar evento externo"}
          </Button>
          <span className="text-muted-foreground text-xs">
            {activeServiceAccounts.length === 0
              ? "Crie uma conta de servico primeiro."
              : "Evento registado com auditoria."}
          </span>
        </CardFooter>
      </form>
    </Card>
  );
}
