import type { PlatformPermission } from "@saptm/auth";
import { AccessState } from "@saptm/ui";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { IntegrationCarrierTmsMovementForm } from "../../../../components/integration/integration-carrier-tms-movement-form";
import { IntegrationCustomsErpStatusForm } from "../../../../components/integration/integration-customs-erp-status-form";
import { IntegrationEventRecordForm } from "../../../../components/integration/integration-event-record-form";
import { IntegrationOverviewHeader } from "../../../../components/integration/integration-overview-header";
import { IntegrationPortTosMovementForm } from "../../../../components/integration/integration-port-tos-movement-form";
import { IntegrationRailTmsMovementForm } from "../../../../components/integration/integration-rail-tms-movement-form";
import { IntegrationServiceAccountCreateForm } from "../../../../components/integration/integration-service-account-create-form";
import { IntegrationTablesSection } from "../../../../components/integration/integration-tables-section";
import { IntegrationTelematicsGpsPositionForm } from "../../../../components/integration/integration-telematics-gps-position-form";
import { IntegrationWarehouseWmsActivityForm } from "../../../../components/integration/integration-warehouse-wms-activity-form";
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

export const metadata: Metadata = {
  title: "Integrações",
  description:
    "Service accounts e integrações EDI, ERP, TOS para operações ferroviárias, portuárias e logísticas.",
};

const openIntegrationPermissions: readonly PlatformPermission[] = [
  "integration.api_key.manage",
  "integration.event.ingest",
];

export default async function IntegrationsPage() {
  const platformSession = await requirePlatformSession("/app/integrations");
  const viewerPermissions = platformSession.viewer.permissions;
  const canOpenIntegrations = openIntegrationPermissions.some((permission) =>
    viewerPermissions.includes(permission),
  );
  const canManageApiKeys = viewerPermissions.includes(
    "integration.api_key.manage" as PlatformPermission,
  );
  const canIngestEvents = viewerPermissions.includes(
    "integration.event.ingest" as PlatformPermission,
  );
  const canProcessPortTos =
    canIngestEvents && viewerPermissions.includes("tracking.event.record" as PlatformPermission);
  const canProcessRailTms =
    canIngestEvents && viewerPermissions.includes("tracking.event.record" as PlatformPermission);
  const canProcessCarrierTms =
    canIngestEvents && viewerPermissions.includes("tracking.event.record" as PlatformPermission);
  const canProcessTelematicsGps =
    canIngestEvents && viewerPermissions.includes("tracking.event.record" as PlatformPermission);
  const canProcessCustomsErp =
    canIngestEvents && viewerPermissions.includes("tracking.event.record" as PlatformPermission);
  const canProcessWarehouseWms =
    canIngestEvents && viewerPermissions.includes("tracking.event.record" as PlatformPermission);

  if (!canOpenIntegrations) {
    return (
      <AccessState
        badgeLabel="Integrações"
        description="O utilizador autenticado não tem acesso ao modulo de integrações."
        role="alert"
        title="Integrações bloqueadas"
        variant="blocked"
      />
    );
  }

  let result: Awaited<ReturnType<typeof getIntegrationOverview>>;
  try {
    result = await getIntegrationOverview();
  } catch {
    return (
      <AccessState
        badgeLabel="Integrações"
        description="Não foi possível carregar os dados de integrações. Tente novamente."
        role="alert"
        title="Erro ao carregar integrações"
        variant="error"
      />
    );
  }

  if (result.status === "unauthorized") {
    redirect("/sign-in?reason=session_expired");
  }

  if (result.status !== "ok") {
    return (
      <AccessState
        badgeLabel="Integrações"
        description={result.message}
        role="alert"
        title="Integrações indisponiveis"
        variant="error"
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
      <IntegrationOverviewHeader
        totals={overview.totals}
        securityModel={overview.securityModel}
        generatedAt={overview.generatedAt}
      />

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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

      <IntegrationTablesSection
        serviceAccounts={overview.serviceAccounts}
        recentEvents={overview.recentEvents}
      />
    </div>
  );
}
