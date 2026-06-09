import type { PlatformPermission } from "@saptm/auth";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@saptm/ui";
import { IntegrationCarrierTmsMovementForm } from "../../../../components/integration-carrier-tms-movement-form";
import { IntegrationCustomsErpStatusForm } from "../../../../components/integration-customs-erp-status-form";
import { IntegrationEventRecordForm } from "../../../../components/integration-event-record-form";
import { IntegrationPortTosMovementForm } from "../../../../components/integration-port-tos-movement-form";
import { IntegrationRailTmsMovementForm } from "../../../../components/integration-rail-tms-movement-form";
import { IntegrationServiceAccountCreateForm } from "../../../../components/integration-service-account-create-form";
import { IntegrationTelematicsGpsPositionForm } from "../../../../components/integration-telematics-gps-position-form";
import { IntegrationWarehouseWmsActivityForm } from "../../../../components/integration-warehouse-wms-activity-form";
import { requirePlatformSession } from "../../../../lib/auth-session";
import { getIntegrationOverview } from "../../../../lib/integrations";
import {
  createIntegrationServiceAccountAction,
  processCarrierTmsMovementAction,
  processCustomsErpStatusAction,
  processPortTosMovementAction,
  processRailTmsMovementAction,
  processTelematicsGpsPositionAction,
  processWarehouseWmsActivityAction,
  recordIntegrationEventAction,
} from "./actions";
import {
  initialIntegrationCarrierTmsMovementFormState,
  initialIntegrationCustomsErpStatusFormState,
  initialIntegrationEventRecordFormState,
  initialIntegrationPortTosMovementFormState,
  initialIntegrationRailTmsMovementFormState,
  initialIntegrationServiceAccountCreateFormState,
  initialIntegrationTelematicsGpsPositionFormState,
  initialIntegrationWarehouseWmsActivityFormState,
} from "./form-state";

export const dynamic = "force-dynamic";

const openIntegrationPermissions: readonly PlatformPermission[] = [
  "integration.api_key.manage",
  "integration.event.ingest",
];
const manageApiKeyPermission: PlatformPermission = "integration.api_key.manage";
const ingestEventPermission: PlatformPermission = "integration.event.ingest";

export default async function IntegrationsPage() {
  const platformSession = await requirePlatformSession("/app/integrations");
  const viewerPermissions = platformSession.viewer.permissions;
  const canOpenIntegrations = openIntegrationPermissions.some((permission) =>
    viewerPermissions.includes(permission),
  );
  const canManageApiKeys = viewerPermissions.includes(manageApiKeyPermission);
  const canIngestEvents = viewerPermissions.includes(ingestEventPermission);
  const canProcessPortTos = canIngestEvents && viewerPermissions.includes("tracking.event.record");
  const canProcessRailTms = canIngestEvents && viewerPermissions.includes("tracking.event.record");
  const canProcessCarrierTms =
    canIngestEvents && viewerPermissions.includes("tracking.event.record");
  const canProcessTelematicsGps =
    canIngestEvents && viewerPermissions.includes("tracking.event.record");
  const canProcessCustomsErp =
    canIngestEvents && viewerPermissions.includes("tracking.event.record");
  const canProcessWarehouseWms =
    canIngestEvents && viewerPermissions.includes("tracking.event.record");

  if (!canOpenIntegrations) {
    return (
      <IntegrationsAccessState
        message="A sessao esta autenticada, mas falta integration.api_key.manage ou integration.event.ingest."
        status="Sem grant"
        title="Integracoes bloqueadas"
      />
    );
  }

  const result = await getIntegrationOverview();

  if (result.status !== "ok") {
    return (
      <IntegrationsAccessState
        message={result.message}
        status={result.status}
        title="Integracoes indisponiveis"
      />
    );
  }

  const { overview } = result;
  const serviceAccountOptions = overview.serviceAccounts.map((serviceAccount) => ({
    id: serviceAccount.id,
    name: serviceAccount.name,
    active: serviceAccount.active,
    scopes: serviceAccount.scopes,
  }));

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">Integration Gateway P13</Badge>
              <Badge variant="outline">Service Accounts</Badge>
              <Badge variant="outline">{overview.securityModel.secretStorage}</Badge>
            </div>
            <div className="flex flex-col gap-2">
              <CardTitle className="text-3xl">Integration Gateway</CardTitle>
              <CardDescription className="max-w-3xl text-base leading-7">
                Governanca local para EDI, ERP, TOS e adapters externos: credenciais tecnicas,
                escopos minimos, ingestao idempotente, audit trail e outbox. A fatia nao chama
                provedores externos; prepara a plataforma para adapters reais.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-5">
            <MetricTile
              label="Service accounts"
              value={overview.totals.serviceAccounts.toString()}
            />
            <MetricTile label="Ativas" value={overview.totals.activeServiceAccounts.toString()} />
            <MetricTile label="API keys" value={overview.totals.activeApiKeys.toString()} />
            <MetricTile label="Eventos" value={overview.totals.integrationEvents.toString()} />
            <MetricTile label="Processados" value={overview.totals.processedEvents.toString()} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Modelo de seguranca</CardTitle>
            <CardDescription>
              Controles obrigatorios antes de qualquer adapter externo.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <ContextRow label="Autorizacao" value={overview.securityModel.authorizationModel} />
            <ContextRow label="Idempotencia" value={overview.securityModel.idempotencyModel} />
            <ContextRow label="Secrets" value={overview.securityModel.secretStorage} />
            <ContextRow
              label="Permissoes"
              value={overview.securityModel.requiredPermissions.join(", ")}
            />
            <ContextRow label="Gerado" value={formatDateTime(overview.generatedAt)} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-7">
        <IntegrationServiceAccountCreateForm
          action={createIntegrationServiceAccountAction}
          canManageApiKeys={canManageApiKeys}
          initialState={initialIntegrationServiceAccountCreateFormState}
        />
        <IntegrationEventRecordForm
          action={recordIntegrationEventAction}
          canIngestEvents={canIngestEvents}
          initialState={initialIntegrationEventRecordFormState}
          serviceAccounts={serviceAccountOptions}
        />
        <IntegrationPortTosMovementForm
          action={processPortTosMovementAction}
          canProcessPortTos={canProcessPortTos}
          initialState={initialIntegrationPortTosMovementFormState}
          serviceAccounts={serviceAccountOptions}
        />
        <IntegrationRailTmsMovementForm
          action={processRailTmsMovementAction}
          canProcessRailTms={canProcessRailTms}
          initialState={initialIntegrationRailTmsMovementFormState}
          serviceAccounts={serviceAccountOptions}
        />
        <IntegrationCarrierTmsMovementForm
          action={processCarrierTmsMovementAction}
          canProcessCarrierTms={canProcessCarrierTms}
          initialState={initialIntegrationCarrierTmsMovementFormState}
          serviceAccounts={serviceAccountOptions}
        />
        <IntegrationTelematicsGpsPositionForm
          action={processTelematicsGpsPositionAction}
          canProcessTelematicsGps={canProcessTelematicsGps}
          initialState={initialIntegrationTelematicsGpsPositionFormState}
          serviceAccounts={serviceAccountOptions}
        />
        <IntegrationCustomsErpStatusForm
          action={processCustomsErpStatusAction}
          canProcessCustomsErp={canProcessCustomsErp}
          initialState={initialIntegrationCustomsErpStatusFormState}
          serviceAccounts={serviceAccountOptions}
        />
        <IntegrationWarehouseWmsActivityForm
          action={processWarehouseWmsActivityAction}
          canProcessWarehouseWms={canProcessWarehouseWms}
          initialState={initialIntegrationWarehouseWmsActivityFormState}
          serviceAccounts={serviceAccountOptions}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Service accounts</CardTitle>
            <CardDescription>
              Identidades tecnicas tenant-scoped com escopos e prefixes de API key.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Conta</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Escopos</TableHead>
                  <TableHead>API keys</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.serviceAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell className="text-muted-foreground" colSpan={4}>
                      Nenhuma service account criada para este tenant.
                    </TableCell>
                  </TableRow>
                ) : (
                  overview.serviceAccounts.map((serviceAccount) => (
                    <TableRow key={serviceAccount.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{serviceAccount.name}</span>
                          <span className="text-muted-foreground text-xs">{serviceAccount.id}</span>
                          <span className="text-muted-foreground text-xs">
                            Criada {formatDateTime(serviceAccount.createdAt)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={serviceAccount.active ? "success" : "warning"}>
                          {serviceAccount.active ? "Ativa" : "Inativa"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {serviceAccount.scopes.map((scope) => (
                            <Badge key={scope} variant="outline">
                              {scope}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {serviceAccount.apiKeys.length === 0 ? (
                            <Badge variant="warning">Sem key ativa</Badge>
                          ) : (
                            serviceAccount.apiKeys.map((apiKey) => (
                              <span className="font-mono text-xs" key={apiKey.id}>
                                {apiKey.prefix}
                              </span>
                            ))
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card data-testid="integration-recent-events">
          <CardHeader>
            <CardTitle>Eventos externos recentes</CardTitle>
            <CardDescription>
              Entradas EDI/TOS/ERP guardadas com identidade externa unica por tenant.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evento</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Payload</TableHead>
                  <TableHead>Recebido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.recentEvents.length === 0 ? (
                  <TableRow>
                    <TableCell className="text-muted-foreground" colSpan={4}>
                      Nenhum evento externo registado.
                    </TableCell>
                  </TableRow>
                ) : (
                  overview.recentEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{event.eventType}</span>
                          <span className="text-muted-foreground text-xs">{event.id}</span>
                          <Badge variant={event.processedAt === null ? "warning" : "success"}>
                            {event.processedAt === null ? "Recebido" : "Processado"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span>{event.sourceSystem}</span>
                          <span className="text-muted-foreground text-xs">{event.externalId}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="line-clamp-2 font-mono text-xs">
                          {JSON.stringify(event.payload)}
                        </span>
                      </TableCell>
                      <TableCell>{formatDateTime(event.receivedAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function IntegrationsAccessState({
  message,
  status,
  title,
}: {
  message: string;
  status: string;
  title: string;
}) {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <Card>
        <CardHeader className="gap-3">
          <Badge variant="warning">{status}</Badge>
          <CardTitle>{title}</CardTitle>
          <CardDescription className="leading-6">{message}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/35 p-4">
      <span className="text-muted-foreground text-xs uppercase tracking-[0.14em]">{label}</span>
      <p className="mt-2 font-semibold text-2xl">{value}</p>
    </div>
  );
}

function ContextRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border bg-muted/35 px-3 py-2">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="max-w-[70%] text-right font-medium text-sm">{value}</span>
    </div>
  );
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
