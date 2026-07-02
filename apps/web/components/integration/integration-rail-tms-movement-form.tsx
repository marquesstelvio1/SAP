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

import type { IntegrationRailTmsMovementFormState } from "../../app/(platform)/app/integrations/form-state";

export type IntegrationRailTmsServiceAccountOption = {
  id: string;
  name: string;
  active: boolean;
  scopes: readonly string[];
};

export type IntegrationRailTmsMovementFormProps = {
  canProcessRailTms: boolean;
  initialState: IntegrationRailTmsMovementFormState;
  serviceAccounts: readonly IntegrationRailTmsServiceAccountOption[];
  action: (
    previousState: IntegrationRailTmsMovementFormState,
    formData: FormData,
  ) => Promise<IntegrationRailTmsMovementFormState>;
};

export function IntegrationRailTmsMovementForm({
  action,
  canProcessRailTms,
  initialState,
  serviceAccounts,
}: IntegrationRailTmsMovementFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const eligibleServiceAccounts = serviceAccounts.filter(
    (serviceAccount) =>
      serviceAccount.active &&
      serviceAccount.scopes.includes("integration.event.ingest") &&
      serviceAccount.scopes.includes("tracking.event.record"),
  );
  const isDisabled = isPending || !canProcessRailTms || eligibleServiceAccounts.length === 0;

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canProcessRailTms ? "success" : "warning"}>
            {canProcessRailTms ? "Movimento autorizado" : "Indisponível"}
          </Badge>
          <Badge variant="outline">Rail TMS</Badge>
          <Badge variant="outline">Registo de tracking</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Processar movimento Rail TMS</CardTitle>
          <CardDescription className="leading-6">
            Converte movimentos ferroviarios locais em eventos de tracking. A operacao valida
            processamento de movimento Rail TMS com registo de evento.
          </CardDescription>
        </div>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <FieldGroup>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="railTmsServiceAccountId">Conta de integração</FieldLabel>
              <SelectNative
                disabled={isDisabled}
                id="railTmsServiceAccountId"
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
              <FieldLabel htmlFor="railTmsSourceSystem">Origem</FieldLabel>
              <Input
                defaultValue="rail-tms"
                disabled={isDisabled}
                id="railTmsSourceSystem"
                name="sourceSystem"
                required
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="railTmsExternalId">External ID</FieldLabel>
              <Input
                disabled={isDisabled}
                id="railTmsExternalId"
                name="externalId"
                placeholder="RAIL-MOVE-2026-001"
                required
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="railTmsShipmentReference">Shipment reference</FieldLabel>
              <Input
                disabled={isDisabled}
                id="railTmsShipmentReference"
                name="shipmentReference"
                placeholder="TRK-LOCAL-RAIL-001"
                required
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="railTmsMovementType">Movement type</FieldLabel>
              <SelectNative
                disabled={isDisabled}
                id="railTmsMovementType"
                name="movementType"
                required
              >
                <option value="train_departed">Train departed</option>
                <option value="train_arrived">Train arrived</option>
                <option value="yard_departure">Yard departure</option>
                <option value="yard_arrival">Yard arrival / location update</option>
                <option value="delay_reported">Delay reported</option>
                <option value="infrastructure_hold">Infrastructure hold</option>
                <option value="handover_completed">Handover completed</option>
              </SelectNative>
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="railTmsOccurredAt">Occurred at</FieldLabel>
              <Input
                disabled={isDisabled}
                id="railTmsOccurredAt"
                name="occurredAt"
                required
                type="datetime-local"
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="railTmsLocationName">Location</FieldLabel>
              <Input
                disabled={isDisabled}
                id="railTmsLocationName"
                name="locationName"
                placeholder="Luanda Yard"
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="railTmsTrainNumber">Train number</FieldLabel>
              <Input
                disabled={isDisabled}
                id="railTmsTrainNumber"
                name="trainNumber"
                placeholder="TRN-409"
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="railTmsRailCorridor">Rail corridor</FieldLabel>
              <Input
                disabled={isDisabled}
                id="railTmsRailCorridor"
                name="railCorridor"
                placeholder="Luanda-Malanje"
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="railTmsWagonCount">Wagon count</FieldLabel>
              <Input
                disabled={isDisabled}
                id="railTmsWagonCount"
                min={1}
                name="wagonCount"
                placeholder="18"
                type="number"
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="railTmsNotes">Notes</FieldLabel>
              <Input
                disabled={isDisabled}
                id="railTmsNotes"
                name="notes"
                placeholder="Rail TMS local validation"
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="railTmsPayload">Payload JSON</FieldLabel>
              <Textarea
                defaultValue={'{"locomotive":"LOCO-77","operatorConfirmed":true}'}
                disabled={isDisabled}
                id="railTmsPayload"
                name="payload"
              />
              <FieldDescription>
                Opcional. Objeto JSON simples anexado ao evento de integracao e ao evento de
                tracking.
              </FieldDescription>
            </Field>
            <Field>
              <FieldDescription>
                {state.message}
              </FieldDescription>
              {state.status === "error" ? <FieldError>{state.message}</FieldError> : null}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter>
          <Button disabled={isDisabled} type="submit">
            {isPending ? "A processar..." : "Processar Rail TMS"}
          </Button>
          <span className="text-muted-foreground text-xs">
            {eligibleServiceAccounts.length === 0
              ? "Crie uma conta de servico com permissoes de tracking."
              : "Adapter ferroviario local sem chamada externa."}
          </span>
        </CardFooter>
      </form>
    </Card>
  );
}
