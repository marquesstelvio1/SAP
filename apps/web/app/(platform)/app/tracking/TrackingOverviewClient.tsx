"use client";

import {
  AccessState,
  BadgeGroup,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
} from "@saptm/ui";

import { TrackingAnalyticsSection } from "../../../../components/tracking/tracking-analytics-section";
import { TrackingEventRecordForm } from "../../../../components/tracking/tracking-event-record-form";
import { TrackingEventsSection } from "../../../../components/tracking/tracking-events-section";
import { TrackingOverviewHeader } from "../../../../components/tracking/tracking-overview-header";
import { TrackingStatusTables } from "../../../../components/tracking/tracking-status-tables";
import { useTrackingAdvisory } from "../../../../hooks/use-tracking-advisory";
import { useTrackingAnalytics } from "../../../../hooks/use-tracking-analytics";
import { useTrackingOverview } from "../../../../hooks/use-tracking-overview";
import { recordTrackingEventAction } from "./actions";
import { initialTrackingEventRecordFormState } from "./form-state";

export function TrackingOverviewClient({
  offset,
  limit,
  sessionId,
  canRecordEvents,
}: {
  offset: number;
  limit: number;
  sessionId: string;
  canRecordEvents: boolean;
}) {
  const overviewQuery = useTrackingOverview({ offset, limit });
  const analyticsQuery = useTrackingAnalytics();
  const advisoryQuery = useTrackingAdvisory();

  if (overviewQuery.isLoading || analyticsQuery.isLoading || advisoryQuery.isLoading) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tracking operacional</CardTitle>
            <CardDescription>Carregando dados de tracking...</CardDescription>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            Aguarde enquanto os dados operacionais sao carregados.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (overviewQuery.isError) {
    return (
      <AccessState
        description={
          overviewQuery.error instanceof Error
            ? overviewQuery.error.message
            : "Erro ao carregar dados de tracking."
        }
        role="alert"
        title="Tracking operacional indisponivel"
        variant="error"
      />
    );
  }

  if (analyticsQuery.isError) {
    return (
      <AccessState
        description={
          analyticsQuery.error instanceof Error
            ? analyticsQuery.error.message
            : "Erro ao carregar analytics."
        }
        role="alert"
        title="Analytics operacional indisponivel"
        variant="error"
      />
    );
  }

  if (advisoryQuery.isError) {
    return (
      <AccessState
        description={
          advisoryQuery.error instanceof Error
            ? advisoryQuery.error.message
            : "Erro ao carregar advisory."
        }
        role="alert"
        title="Advisory operacional indisponivel"
        variant="error"
      />
    );
  }

  const overview = overviewQuery.data;
  const analytics = analyticsQuery.data;
  const advisory = advisoryQuery.data;

  if (!overview || !analytics || !advisory) {
    return (
      <EmptyState
        title="Nenhum dado encontrado"
        description="Nao ha dados de tracking disponiveis no momento. Verifique se ha remessas registradas."
      />
    );
  }

  const totalPages = Math.ceil(overview.pagination.totalCount / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <TrackingOverviewHeader
        totals={overview.totals}
        organizationId={overview.organizationId}
        sessionId={sessionId}
        generatedAt={overview.generatedAt}
      />

      <TrackingAnalyticsSection analytics={analytics} advisory={advisory} />

      <TrackingEventsSection analytics={analytics} />

      <TrackingStatusTables
        overview={overview}
        pagination={{
          totalCount: overview.pagination.totalCount,
          limit,
          offset,
          totalPages,
          currentPage,
        }}
      />

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <TrackingEventRecordForm
          action={recordTrackingEventAction}
          canRecordEvents={canRecordEvents}
          initialState={initialTrackingEventRecordFormState}
          shipments={overview.recentShipments.map((s) => ({
            id: s.id,
            referenceCode: s.referenceCode,
            cargoDescription: s.cargoDescription ?? "",
            originName: s.originName,
            destinationName: s.destinationName,
          }))}
        />

        <Card>
          <CardHeader>
            <BadgeGroup
              items={[
                { label: "Governanca", variant: "outline" },
                {
                  label: canRecordEvents ? "Pode gravar" : "Somente leitura",
                  variant: canRecordEvents ? "success" : "warning",
                },
              ]}
            />
            <CardTitle>Controle da escrita operacional</CardTitle>
            <CardDescription>
              A UI nao grava diretamente no banco. Ela chama o contrato RPC seguro e o backend
              aplica sessao, organizacao, RBAC, idempotencia, audit trail e outbox.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Permissao leitura</span>
              <span>tracking.shipment.read</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Permissao escrita</span>
              <span>tracking.event.record</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Operacao</span>
              <span>tracking.event.record</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transporte</span>
              <span>POST /rpc/tracking/events</span>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
