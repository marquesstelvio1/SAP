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

import type { IntegrationCarrierTmsMovementFormState } from "../../app/(platform)/app/integrations/form-state";

export type IntegrationCarrierTmsServiceAccountOption = {
  id: string;
  name: string;
  active: boolean;
  scopes: readonly string[];
};

export type IntegrationCarrierTmsMovementFormProps = {
  canProcessCarrierTms: boolean;
  initialState: IntegrationCarrierTmsMovementFormState;
  serviceAccounts: readonly IntegrationCarrierTmsServiceAccountOption[];
  action: (
    previousState: IntegrationCarrierTmsMovementFormState,
    formData: FormData,
  ) => Promise<IntegrationCarrierTmsMovementFormState>;
};

export function IntegrationCarrierTmsMovementForm({
  action,
  canProcessCarrierTms,
  initialState,
  serviceAccounts,
}: IntegrationCarrierTmsMovementFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const eligibleServiceAccounts = serviceAccounts.filter(
    (serviceAccount) =>
      serviceAccount.active &&
      serviceAccount.scopes.includes("integration.event.ingest") &&
      serviceAccount.scopes.includes("tracking.event.record"),
  );
  const isDisabled = isPending || !canProcessCarrierTms || eligibleServiceAccounts.length === 0;

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canProcessCarrierTms ? "success" : "warning"}>
            {canProcessCarrierTms ? "Movimento autorizado" : "Indisponivel"}
          </Badge>
          <Badge variant="outline">Carrier TMS</Badge>
          <Badge variant="outline">tracking.event.record</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Processar movimento Carrier TMS</CardTitle>
          <CardDescription className="leading-6">
            Converte movimentos rodoviarios locais em eventos de tracking. A operacao valida service
            movimento Carrier TMS com registo de evento.
          </CardDescription>
        </div>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <FieldGroup>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="carrierTmsServiceAccountId">Service account</FieldLabel>
              <SelectNative
                disabled={isDisabled}
                id="carrierTmsServiceAccountId"
                name="serviceAccountId"
                required
              >
                {eligibleServiceAccounts.map((serviceAccount) => (
                  <option key={serviceAccount.id} value={serviceAccount.id}>
                    {serviceAccount.name} ({serviceAccount.id})
                  </option>
                ))}
              </SelectNative>
              <FieldDescription>
                Requer `integration.event.ingest` e `tracking.event.record`.
              </FieldDescription>
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="carrierTmsSourceSystem">Source system</FieldLabel>
              <Input
                defaultValue="carrier-tms"
                disabled={isDisabled}
                id="carrierTmsSourceSystem"
                name="sourceSystem"
                required
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="carrierTmsExternalId">External ID</FieldLabel>
              <Input
                disabled={isDisabled}
                id="carrierTmsExternalId"
                name="externalId"
                placeholder="CARRIER-MOVE-2026-001"
                required
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="carrierTmsShipmentReference">Shipment reference</FieldLabel>
              <Input
                disabled={isDisabled}
                id="carrierTmsShipmentReference"
                name="shipmentReference"
                placeholder="TRK-LOCAL-ROAD-001"
                required
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="carrierTmsMovementType">Movement type</FieldLabel>
              <SelectNative
                disabled={isDisabled}
                id="carrierTmsMovementType"
                name="movementType"
                required
              >
                <option value="pickup_completed">Pickup completed</option>
                <option value="linehaul_departed">Linehaul departed</option>
                <option value="in_transit_update">In-transit update</option>
                <option value="delivery_arrived">Delivery arrived</option>
                <option value="delivery_completed">Delivery completed</option>
                <option value="delay_reported">Delay reported</option>
                <option value="exception_reported">Exception reported</option>
                <option value="handover_completed">Handover completed</option>
              </SelectNative>
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="carrierTmsOccurredAt">Occurred at</FieldLabel>
              <Input
                disabled={isDisabled}
                id="carrierTmsOccurredAt"
                name="occurredAt"
                required
                type="datetime-local"
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="carrierTmsLocationName">Location</FieldLabel>
              <Input
                disabled={isDisabled}
                id="carrierTmsLocationName"
                name="locationName"
                placeholder="Luanda Hub"
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="carrierTmsCarrierCode">Carrier code</FieldLabel>
              <Input
                disabled={isDisabled}
                id="carrierTmsCarrierCode"
                name="carrierCode"
                placeholder="CARR-AO"
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="carrierTmsVehiclePlate">Vehicle plate</FieldLabel>
              <Input
                disabled={isDisabled}
                id="carrierTmsVehiclePlate"
                name="vehiclePlate"
                placeholder="LD-409-AA"
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="carrierTmsDriverReference">Driver reference</FieldLabel>
              <Input
                disabled={isDisabled}
                id="carrierTmsDriverReference"
                name="driverReference"
                placeholder="DRV-77"
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="carrierTmsRouteCode">Route code</FieldLabel>
              <Input
                disabled={isDisabled}
                id="carrierTmsRouteCode"
                name="routeCode"
                placeholder="LAD-MSJ-01"
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="carrierTmsNotes">Notes</FieldLabel>
              <Input
                disabled={isDisabled}
                id="carrierTmsNotes"
                name="notes"
                placeholder="Carrier TMS local validation"
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="carrierTmsPayload">Payload JSON</FieldLabel>
              <Textarea
                defaultValue={'{"trailer":"TRL-204","operatorConfirmed":true}'}
                disabled={isDisabled}
                id="carrierTmsPayload"
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
                  ? `${state.message} Tracking event: ${state.trackingEventId} / Integracao: ${
                      state.integrationEventId ?? "sem-evento"
                    } / Replay: ${state.replayed ? "sim" : "nao"}`
                  : state.message}
              </FieldDescription>
              {state.status === "error" ? <FieldError>{state.message}</FieldError> : null}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter>
          <Button disabled={isDisabled} type="submit">
            {isPending ? "A processar..." : "Processar Carrier TMS"}
          </Button>
          <span className="text-muted-foreground text-xs">
            {eligibleServiceAccounts.length === 0
              ? "Crie uma conta de servico com permissoes de tracking."
              : "Adapter rodoviario local sem chamada externa."}
          </span>
        </CardFooter>
      </form>
    </Card>
  );
}
