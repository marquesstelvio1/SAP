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

import type { IntegrationCustomsErpStatusFormState } from "../../app/(platform)/app/integrations/form-state";

export type IntegrationCustomsErpServiceAccountOption = {
  id: string;
  name: string;
  active: boolean;
  scopes: readonly string[];
};

export type IntegrationCustomsErpStatusFormProps = {
  canProcessCustomsErp: boolean;
  initialState: IntegrationCustomsErpStatusFormState;
  serviceAccounts: readonly IntegrationCustomsErpServiceAccountOption[];
  action: (
    previousState: IntegrationCustomsErpStatusFormState,
    formData: FormData,
  ) => Promise<IntegrationCustomsErpStatusFormState>;
};

export function IntegrationCustomsErpStatusForm({
  action,
  canProcessCustomsErp,
  initialState,
  serviceAccounts,
}: IntegrationCustomsErpStatusFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const eligibleServiceAccounts = serviceAccounts.filter(
    (serviceAccount) =>
      serviceAccount.active &&
      serviceAccount.scopes.includes("integration.event.ingest") &&
      serviceAccount.scopes.includes("tracking.event.record"),
  );
  const isDisabled = isPending || !canProcessCustomsErp || eligibleServiceAccounts.length === 0;

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={canProcessCustomsErp ? "success" : "warning"}>
            {canProcessCustomsErp ? "Status autorizado" : "Indisponível"}
          </Badge>
          <Badge variant="outline">Customs/ERP</Badge>
          <Badge variant="outline">Registo de tracking</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>Processar status Customs/ERP</CardTitle>
          <CardDescription className="leading-6">
            Converte estados aduaneiros e ERP em eventos de tracking. A operação válida service
            estado Customs/ERP com registo de evento.
          </CardDescription>
        </div>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <FieldGroup>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="customsErpServiceAccountId">Conta de integração</FieldLabel>
              <SelectNative
                disabled={isDisabled}
                id="customsErpServiceAccountId"
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
              <FieldLabel htmlFor="customsErpSourceSystem">Origem</FieldLabel>
              <Input
                defaultValue="customs-erp"
                disabled={isDisabled}
                id="customsErpSourceSystem"
                name="sourceSystem"
                required
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="customsErpExternalId">External ID</FieldLabel>
              <Input
                disabled={isDisabled}
                id="customsErpExternalId"
                name="externalId"
                placeholder="CUSTOMS-STATUS-2026-001"
                required
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="customsErpShipmentReference">Shipment reference</FieldLabel>
              <Input
                disabled={isDisabled}
                id="customsErpShipmentReference"
                name="shipmentReference"
                placeholder="TRK-LOCAL-PORT-002"
                required
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="customsErpStatusType">Status type</FieldLabel>
              <SelectNative
                disabled={isDisabled}
                id="customsErpStatusType"
                name="statusType"
                required
              >
                <option value="documents_received">Documents received</option>
                <option value="customs_hold">Customs hold</option>
                <option value="inspection_required">Inspection required</option>
                <option value="duty_paid">Duty paid</option>
                <option value="customs_cleared">Customs cleared</option>
                <option value="release_authorized">Release authorized</option>
                <option value="clearance_rejected">Clearance rejected</option>
              </SelectNative>
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="customsErpOccurredAt">Occurred at</FieldLabel>
              <Input
                disabled={isDisabled}
                id="customsErpOccurredAt"
                name="occurredAt"
                required
                type="datetime-local"
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="customsErpCustomsReference">Customs reference</FieldLabel>
              <Input
                disabled={isDisabled}
                id="customsErpCustomsReference"
                name="customsReference"
                placeholder="CUS-AO-409"
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="customsErpDocumentReference">Document reference</FieldLabel>
              <Input
                disabled={isDisabled}
                id="customsErpDocumentReference"
                name="documentReference"
                placeholder="DOC-409"
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="customsErpDeclarationNumber">Declaration number</FieldLabel>
              <Input
                disabled={isDisabled}
                id="customsErpDeclarationNumber"
                name="declarationNumber"
                placeholder="DECL-2026-409"
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="customsErpBrokerReference">Broker reference</FieldLabel>
              <Input
                disabled={isDisabled}
                id="customsErpBrokerReference"
                name="brokerReference"
                placeholder="BRK-77"
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="customsErpAuthorityCode">Authority code</FieldLabel>
              <Input
                disabled={isDisabled}
                id="customsErpAuthorityCode"
                name="authorityCode"
                placeholder="AGT-AO"
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="customsErpNotes">Notes</FieldLabel>
              <Input
                disabled={isDisabled}
                id="customsErpNotes"
                name="notes"
                placeholder="Customs/ERP local validation"
              />
            </Field>
            <Field data-disabled={isDisabled}>
              <FieldLabel htmlFor="customsErpPayload">Payload JSON</FieldLabel>
              <Textarea
                defaultValue={'{"channel":"green","operatorConfirmed":true}'}
                disabled={isDisabled}
                id="customsErpPayload"
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
            {isPending ? "A processar..." : "Processar Customs/ERP"}
          </Button>
          <span className="text-muted-foreground text-xs">
            {eligibleServiceAccounts.length === 0
              ? "Crie uma conta de servico com permissões de tracking."
              : "Adapter aduaneiro local sem chamada externa."}
          </span>
        </CardFooter>
      </form>
    </Card>
  );
}
