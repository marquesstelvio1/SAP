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

import type { IntegrationPortTosMovementFormState } from "../../app/(platform)/app/integrations/form-state";

export type IntegrationPortTosServiceAccountOption = {
  id: string;
  name: string;
  active: boolean;
  scopes: readonly string[];
};

export type IntegrationPortTosMovementFormProps = {
  canProcessPortTos: boolean;
  initialState: IntegrationPortTosMovementFormState;
  serviceAccounts: readonly IntegrationPortTosServiceAccountOption[];
  action: (
    previousState: IntegrationPortTosMovementFormState,
    formData: FormData,
  ) => Promise<IntegrationPortTosMovementFormState>;
};

export function IntegrationPortTosMovementForm({
  action,
  canProcessPortTos,
  initialState,
  serviceAccounts,
}: IntegrationPortTosMovementFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const eligibleServiceAccounts = serviceAccounts.filter(
    (serviceAccount) =>
      serviceAccount.active &&
      serviceAccount.scopes.includes("integration.event.ingest") &&
      serviceAccount.scopes.includes("tracking.event.record"),
  );
  const isDisabled = isPending || !canProcessPortTos || eligibleServiceAccounts.length === 0;

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canProcessPortTos ? "success" : "warning"}>
            {canProcessPortTos ? "Movimento autorizado" : "Indisponível"}
          </Badge>
          <Badge variant="outline">Port TOS</Badge>
          <Badge variant="outline">Registo de tracking</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Processar movimento Port TOS</CardTitle>
          <CardDescription className="leading-6">
            Converte um movimento TOS local em evento operacional de tracking. A operacao valida
            processamento de movimento Port TOS com registo de evento.
          </CardDescription>
        </div>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <FieldGroup>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="portTosServiceAccountId">Conta de integração</FieldLabel>
              <SelectNative
                disabled={isDisabled}
                id="portTosServiceAccountId"
                name="serviceAccountId"
                required
              >
                {eligibleServiceAccounts.map((serviceAccount) => (
                  <option key={serviceAccount.id} value={serviceAccount.id}>
                    {serviceAccount.name}
                  </option>
                ))}
              </SelectNative>
              <FieldDescription>Requer recepção de eventos e registo de tracking.</FieldDescription>
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="portTosSourceSystem">Origem</FieldLabel>
              <Input
                defaultValue="port-tos"
                disabled={isDisabled}
                id="portTosSourceSystem"
                name="sourceSystem"
                required
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="portTosExternalId">External ID</FieldLabel>
              <Input
                disabled={isDisabled}
                id="portTosExternalId"
                name="externalId"
                placeholder="TOS-MOVE-2026-001"
                required
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="portTosShipmentReference">Shipment reference</FieldLabel>
              <Input
                disabled={isDisabled}
                id="portTosShipmentReference"
                name="shipmentReference"
                placeholder="TRK-LOCAL-PORT-002"
                required
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="portTosMovementType">Movement type</FieldLabel>
              <SelectNative
                disabled={isDisabled}
                id="portTosMovementType"
                name="movementType"
                required
              >
                <option value="gate_in">Gate in / location update</option>
                <option value="loaded">Loaded / location update</option>
                <option value="departed">Departed</option>
                <option value="arrived">Arrived</option>
                <option value="delayed">Delayed</option>
                <option value="customs_hold">Customs hold</option>
                <option value="handover_completed">Handover completed</option>
              </SelectNative>
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="portTosOccurredAt">Occurred at</FieldLabel>
              <Input
                disabled={isDisabled}
                id="portTosOccurredAt"
                name="occurredAt"
                required
                type="datetime-local"
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="portTosLocationName">Location</FieldLabel>
              <Input
                disabled={isDisabled}
                id="portTosLocationName"
                name="locationName"
                placeholder="Terminal B2"
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="portTosNotes">Notes</FieldLabel>
              <Input
                disabled={isDisabled}
                id="portTosNotes"
                name="notes"
                placeholder="Local adapter validation"
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="portTosPayload">Payload JSON</FieldLabel>
              <Textarea
                defaultValue={'{"berth":"B2","containers":12,"operatorConfirmed":true}'}
                disabled={isDisabled}
                id="portTosPayload"
                name="payload"
              />
              <FieldDescription>
                Opcional. Objeto JSON simples anexado ao evento de integracao e ao evento de
                tracking.
              </FieldDescription>
            </Field>
            <Field>
              <FieldDescription>
                {state.status === "success" && state.trackingEventId !== undefined
                  ? `${state.message} Tracking event: ${state.trackingEventId} Â· Integracao: ${
                      state.integrationEventId ?? "sem-evento"
                    } Â· Replay: ${state.replayed ? "sim" : "nao"}`
                  : state.message}
              </FieldDescription>
              {state.status === "error" ? <FieldError>{state.message}</FieldError> : null}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter>
          <Button disabled={isDisabled} type="submit">
            {isPending ? "A processar..." : "Processar Port TOS"}
          </Button>
          <span className="text-muted-foreground text-xs">
            {eligibleServiceAccounts.length === 0
              ? "Crie uma conta de servico com permissoes de tracking."
              : "Adapter local sem chamada externa."}
          </span>
        </CardFooter>
      </form>
    </Card>
  );
}
