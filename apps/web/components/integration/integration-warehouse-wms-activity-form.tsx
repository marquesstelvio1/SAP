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

import type { IntegrationWarehouseWmsActivityFormState } from "../../app/(platform)/app/integrations/form-state";

export type IntegrationWarehouseWmsServiceAccountOption = {
  id: string;
  name: string;
  active: boolean;
  scopes: readonly string[];
};

export type IntegrationWarehouseWmsActivityFormProps = {
  canProcessWarehouseWms: boolean;
  initialState: IntegrationWarehouseWmsActivityFormState;
  serviceAccounts: readonly IntegrationWarehouseWmsServiceAccountOption[];
  action: (
    previousState: IntegrationWarehouseWmsActivityFormState,
    formData: FormData,
  ) => Promise<IntegrationWarehouseWmsActivityFormState>;
};

export function IntegrationWarehouseWmsActivityForm({
  action,
  canProcessWarehouseWms,
  initialState,
  serviceAccounts,
}: IntegrationWarehouseWmsActivityFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const eligibleServiceAccounts = serviceAccounts.filter(
    (serviceAccount) =>
      serviceAccount.active &&
      serviceAccount.scopes.includes("integration.event.ingest") &&
      serviceAccount.scopes.includes("tracking.event.record"),
  );
  const isDisabled = isPending || !canProcessWarehouseWms || eligibleServiceAccounts.length === 0;

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canProcessWarehouseWms ? "success" : "warning"}>
            {canProcessWarehouseWms ? "Atividade autorizada" : "Indisponível"}
          </Badge>
          <Badge variant="outline">Warehouse/WMS</Badge>
          <Badge variant="outline">Registo de tracking</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Processar atividade Warehouse/WMS</CardTitle>
          <CardDescription className="leading-6">
            Converte atividades de armazem, doca e yard em eventos de tracking. A operacao valida
            processamento de atividade WMS com registo de evento.
          </CardDescription>
        </div>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <FieldGroup>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="warehouseWmsServiceAccountId">Conta de integração</FieldLabel>
              <SelectNative
                disabled={isDisabled}
                id="warehouseWmsServiceAccountId"
                name="serviceAccountId"
                required
              >
                {eligibleServiceAccounts.map((serviceAccount) => (
                  <option key={serviceAccount.id} value={serviceAccount.id}>
                    {serviceAccount.name}
                  </option>
                ))}
              </SelectNative>
              <FieldDescription>
                Requer recepção de eventos e registo de tracking.
              </FieldDescription>
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="warehouseWmsSourceSystem">Origem</FieldLabel>
              <Input
                defaultValue="warehouse-wms"
                disabled={isDisabled}
                id="warehouseWmsSourceSystem"
                name="sourceSystem"
                required
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="warehouseWmsExternalId">External ID</FieldLabel>
              <Input
                disabled={isDisabled}
                id="warehouseWmsExternalId"
                name="externalId"
                placeholder="WMS-ACT-2026-001"
                required
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="warehouseWmsShipmentReference">Shipment reference</FieldLabel>
              <Input
                disabled={isDisabled}
                id="warehouseWmsShipmentReference"
                name="shipmentReference"
                placeholder="TRK-LOCAL-MULTI-003"
                required
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="warehouseWmsActivityType">Activity type</FieldLabel>
              <SelectNative
                disabled={isDisabled}
                id="warehouseWmsActivityType"
                name="activityType"
                required
              >
                <option value="received_at_warehouse">Received at warehouse</option>
                <option value="putaway_completed">Putaway completed</option>
                <option value="picked_for_dispatch">Picked for dispatch</option>
                <option value="loaded_for_dispatch">Loaded for dispatch</option>
                <option value="yard_check_in">Yard check-in</option>
                <option value="yard_check_out">Yard check-out</option>
                <option value="inventory_exception">Inventory exception</option>
                <option value="damage_reported">Damage reported</option>
                <option value="handover_completed">Handover completed</option>
              </SelectNative>
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="warehouseWmsOccurredAt">Occurred at</FieldLabel>
              <Input
                disabled={isDisabled}
                id="warehouseWmsOccurredAt"
                name="occurredAt"
                required
                type="datetime-local"
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="warehouseWmsLocationName">Location</FieldLabel>
              <Input
                disabled={isDisabled}
                id="warehouseWmsLocationName"
                name="locationName"
                placeholder="Viana Warehouse"
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="warehouseWmsWarehouseCode">Warehouse code</FieldLabel>
              <Input
                disabled={isDisabled}
                id="warehouseWmsWarehouseCode"
                name="warehouseCode"
                placeholder="WH-VIA"
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="warehouseWmsZoneCode">Zone code</FieldLabel>
              <Input
                disabled={isDisabled}
                id="warehouseWmsZoneCode"
                name="zoneCode"
                placeholder="Z-7"
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="warehouseWmsDockDoor">Dock door</FieldLabel>
              <Input
                disabled={isDisabled}
                id="warehouseWmsDockDoor"
                name="dockDoor"
                placeholder="D-12"
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="warehouseWmsContainerReference">Container reference</FieldLabel>
              <Input
                disabled={isDisabled}
                id="warehouseWmsContainerReference"
                name="containerReference"
                placeholder="CONT-409"
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="warehouseWmsHandlingUnitReference">
                Handling unit reference
              </FieldLabel>
              <Input
                disabled={isDisabled}
                id="warehouseWmsHandlingUnitReference"
                name="handlingUnitReference"
                placeholder="HU-409"
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="warehouseWmsOperatorReference">Operator reference</FieldLabel>
              <Input
                disabled={isDisabled}
                id="warehouseWmsOperatorReference"
                name="operatorReference"
                placeholder="OP-77"
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="warehouseWmsPalletCount">Pallet count</FieldLabel>
              <Input
                disabled={isDisabled}
                id="warehouseWmsPalletCount"
                min={1}
                name="palletCount"
                placeholder="24"
                type="number"
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="warehouseWmsNotes">Notes</FieldLabel>
              <Input
                disabled={isDisabled}
                id="warehouseWmsNotes"
                name="notes"
                placeholder="Warehouse/WMS local validation"
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="warehouseWmsPayload">Payload JSON</FieldLabel>
              <Textarea
                defaultValue={'{"scannerConfirmed":true,"temperatureControlled":false}'}
                disabled={isDisabled}
                id="warehouseWmsPayload"
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
            {isPending ? "A processar..." : "Processar Warehouse/WMS"}
          </Button>
          <span className="text-muted-foreground text-xs">
            {eligibleServiceAccounts.length === 0
              ? "Crie uma conta de servico com permissoes de tracking."
              : "Adapter WMS local sem chamada externa."}
          </span>
        </CardFooter>
      </form>
    </Card>
  );
}
