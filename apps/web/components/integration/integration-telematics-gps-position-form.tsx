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

import type { IntegrationTelematicsGpsPositionFormState } from "../../app/(platform)/app/integrations/form-state";

export type IntegrationTelematicsGpsServiceAccountOption = {
  id: string;
  name: string;
  active: boolean;
  scopes: readonly string[];
};

export type IntegrationTelematicsGpsPositionFormProps = {
  canProcessTelematicsGps: boolean;
  initialState: IntegrationTelematicsGpsPositionFormState;
  serviceAccounts: readonly IntegrationTelematicsGpsServiceAccountOption[];
  action: (
    previousState: IntegrationTelematicsGpsPositionFormState,
    formData: FormData,
  ) => Promise<IntegrationTelematicsGpsPositionFormState>;
};

export function IntegrationTelematicsGpsPositionForm({
  action,
  canProcessTelematicsGps,
  initialState,
  serviceAccounts,
}: IntegrationTelematicsGpsPositionFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const eligibleServiceAccounts = serviceAccounts.filter(
    (serviceAccount) =>
      serviceAccount.active &&
      serviceAccount.scopes.includes("integration.event.ingest") &&
      serviceAccount.scopes.includes("tracking.event.record"),
  );
  const isDisabled = isPending || !canProcessTelematicsGps || eligibleServiceAccounts.length === 0;

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canProcessTelematicsGps ? "success" : "warning"}>
            {canProcessTelematicsGps ? "GPS autorizado" : "Indisponível"}
          </Badge>
          <Badge variant="outline">Telematics/GPS</Badge>
          <Badge variant="outline">Registo de tracking</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Processar posicao Telematics/GPS</CardTitle>
          <CardDescription className="leading-6">
            Converte posicoes, geofences e alertas de telemetria em eventos de tracking. A operacao
            processamento de posicao GPS com registo de evento.
          </CardDescription>
        </div>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <FieldGroup>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="telematicsGpsServiceAccountId">Conta de integração</FieldLabel>
              <SelectNative
                disabled={isDisabled}
                id="telematicsGpsServiceAccountId"
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
              <FieldLabel htmlFor="telematicsGpsSourceSystem">Origem</FieldLabel>
              <Input
                defaultValue="telematics-gps"
                disabled={isDisabled}
                id="telematicsGpsSourceSystem"
                name="sourceSystem"
                required
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="telematicsGpsExternalId">External ID</FieldLabel>
              <Input
                disabled={isDisabled}
                id="telematicsGpsExternalId"
                name="externalId"
                placeholder="GPS-POS-2026-001"
                required
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="telematicsGpsShipmentReference">Shipment reference</FieldLabel>
              <Input
                disabled={isDisabled}
                id="telematicsGpsShipmentReference"
                name="shipmentReference"
                placeholder="TRK-LOCAL-RAIL-001"
                required
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="telematicsGpsPositionType">Position type</FieldLabel>
              <SelectNative
                disabled={isDisabled}
                id="telematicsGpsPositionType"
                name="positionType"
                required
              >
                <option value="position_reported">Position reported</option>
                <option value="geofence_departure">Geofence departure</option>
                <option value="geofence_arrival">Geofence arrival</option>
                <option value="eta_delay">ETA delay</option>
                <option value="route_deviation">Route deviation</option>
                <option value="sensor_alert">Sensor alert</option>
                <option value="telemetry_lost">Telemetry lost</option>
              </SelectNative>
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="telematicsGpsOccurredAt">Occurred at</FieldLabel>
              <Input
                disabled={isDisabled}
                id="telematicsGpsOccurredAt"
                name="occurredAt"
                required
                type="datetime-local"
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="telematicsGpsLatitude">Latitude</FieldLabel>
              <Input
                disabled={isDisabled}
                id="telematicsGpsLatitude"
                name="latitude"
                placeholder="-8.838333"
                required
                step="any"
                type="number"
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="telematicsGpsLongitude">Longitude</FieldLabel>
              <Input
                disabled={isDisabled}
                id="telematicsGpsLongitude"
                name="longitude"
                placeholder="13.234444"
                required
                step="any"
                type="number"
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="telematicsGpsDeviceId">Device ID</FieldLabel>
              <Input
                disabled={isDisabled}
                id="telematicsGpsDeviceId"
                name="deviceId"
                placeholder="GPS-409"
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="telematicsGpsAssetReference">Asset reference</FieldLabel>
              <Input
                disabled={isDisabled}
                id="telematicsGpsAssetReference"
                name="assetReference"
                placeholder="LOCO-77"
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="telematicsGpsGeofenceName">Geofence name</FieldLabel>
              <Input
                disabled={isDisabled}
                id="telematicsGpsGeofenceName"
                name="geofenceName"
                placeholder="Luanda Corridor"
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="telematicsGpsSpeedKph">Speed KPH</FieldLabel>
              <Input
                disabled={isDisabled}
                id="telematicsGpsSpeedKph"
                name="speedKph"
                placeholder="42.5"
                step="any"
                type="number"
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="telematicsGpsHeadingDegrees">Heading degrees</FieldLabel>
              <Input
                disabled={isDisabled}
                id="telematicsGpsHeadingDegrees"
                max={359}
                min={0}
                name="headingDegrees"
                placeholder="93"
                step="any"
                type="number"
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="telematicsGpsRouteCode">Route code</FieldLabel>
              <Input
                disabled={isDisabled}
                id="telematicsGpsRouteCode"
                name="routeCode"
                placeholder="LAD-MSJ-01"
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="telematicsGpsNotes">Notes</FieldLabel>
              <Input
                disabled={isDisabled}
                id="telematicsGpsNotes"
                name="notes"
                placeholder="Telematics/GPS local validation"
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="telematicsGpsPayload">Payload JSON</FieldLabel>
              <Textarea
                defaultValue={'{"ignitionOn":true,"signalQuality":"good"}'}
                disabled={isDisabled}
                id="telematicsGpsPayload"
                name="payload"
              />
              <FieldDescription>
                Opcional. Objeto JSON simples anexado ao evento de integracao e ao evento de
                tracking.
              </FieldDescription>
            </Field>
            <Field>
              <FieldDescription>{state.message}</FieldDescription>
              {state.status === "error" ? <FieldError>{state.message}</FieldError> : null}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter>
          <Button disabled={isDisabled} type="submit">
            {isPending ? "A processar..." : "Processar Telematics/GPS"}
          </Button>
          <span className="text-muted-foreground text-xs">
            {eligibleServiceAccounts.length === 0
              ? "Crie uma conta de servico com permissoes de tracking."
              : "Adapter telemetrico local sem chamada externa."}
          </span>
        </CardFooter>
      </form>
    </Card>
  );
}
