"use client";

import {
  AccessState,
  BadgeGroup,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ContextRow,
  EmptyState,
} from "@saptm/ui";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense } from "react";
import { TrackingEventRecordForm } from "../../../../components/tracking/tracking-event-record-form";
import { TrackingOverviewHeader } from "../../../../components/tracking/tracking-overview-header";
import { TrackingStatusTables } from "../../../../components/tracking/tracking-status-tables";
import { RpcError } from "../../../../lib/rpc-client";

const TrackingAnalyticsSection = dynamic(
  () =>
    import("../../../../components/tracking/tracking-analytics-section").then(
      (mod) => mod.TrackingAnalyticsSection,
    ),
  { ssr: false },
);

const TrackingEventsSection = dynamic(
  () =>
    import("../../../../components/tracking/tracking-events-section").then(
      (mod) => mod.TrackingEventsSection,
    ),
  { ssr: false },
);

import { useTrackingAdvisory } from "../../../../hooks/use-tracking-advisory";
import { useTrackingAnalytics } from "../../../../hooks/use-tracking-analytics";
import { useTrackingOverview } from "../../../../hooks/use-tracking-overview";
import { recordTrackingEventAction } from "./actions";
import { initialTrackingEventRecordFormState } from "./form-state";

export function TrackingOverviewClient({
  offset,
  limit,
  canRecordEvents,
}: {
  offset: number;
  limit: number;
  canRecordEvents: boolean;
}) {
  const overviewQuery = useTrackingOverview({ offset, limit });

  // Stagger loading to prevent 429 errors from multiple parallel requests
  const overviewSuccess = overviewQuery.isSuccess;

  const analyticsQuery = useTrackingAnalytics({
    enabled: overviewSuccess,
  });

  const advisoryQuery = useTrackingAdvisory({
    enabled: overviewSuccess,
  });

  if (overviewQuery.isLoading) {
    return (
      <AccessState
        badgeLabel="Tracking Operacional"
        description="Aguarde enquanto os dados de tracking sao carregados."
        title="A carregar tracking operacional"
      />
    );
  }

  if (overviewQuery.isError) {
    const error = overviewQuery.error;

    if (error instanceof RpcError && error.status === "unauthorized") {
      return (
        <AccessState
          badgeLabel="Sessão expirada"
          description="A sua sessão expirou ou é inválida. Re-autentique para continuar."
          role="alert"
          title="Sessão expirada"
          variant="error"
        >
          <Button asChild size="sm" variant="outline">
            <Link href="/sign-in?reason=session_expired">Re-autenticar</Link>
          </Button>
        </AccessState>
      );
    }

    if (error instanceof RpcError && error.status === "rate_limited") {
      return (
        <AccessState
          badgeLabel="Tráfego Elevado"
          description="Muitas requisições simultâneas. O sistema tentará reconectar automaticamente."
          role="alert"
          title="Limite de Requisições Excedido"
          variant="error"
        >
          <Button size="sm" variant="outline" onClick={() => overviewQuery.refetch()}>
            Tentar Novamente
          </Button>
        </AccessState>
      );
    }

    if (error instanceof RpcError && error.status === "forbidden") {
      return (
        <AccessState
          badgeLabel="Tracking Operacional"
          description="Sessão sem permissão para ler tracking operacional."
          title="Tracking operacional bloqueado"
          variant="blocked"
        />
      );
    }

    return (
      <AccessState
        badgeLabel="Tracking Operacional"
        description="Dados indisponiveis. Tente novamente mais tarde."
        role="alert"
        title="Tracking operacional indisponível"
        variant="error"
      >
        <Button size="sm" variant="outline" onClick={() => overviewQuery.refetch()}>
          Tentar Novamente
        </Button>
      </AccessState>
    );
  }

  const overview = overviewQuery.data;

  if (!overview) {
    return (
      <EmptyState
        title="Nenhum dado encontrado"
        description="Não há dados de tracking disponíveis no momento. Verifique se há remessas registadas."
      />
    );
  }

  const analytics = analyticsQuery.data;
  const advisory = advisoryQuery.data;

  const totalPages = Math.ceil(overview.pagination.totalCount / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <TrackingOverviewHeader totals={overview.totals} generatedAt={overview.generatedAt} />

      <Suspense
        fallback={
          <AccessState
            badgeLabel="Analytics Operacional"
            description="A carregar analytics e advisory operacional..."
            title="A carregar analytics"
          />
        }
      >
        {analyticsQuery.isLoading || advisoryQuery.isLoading ? (
          <AccessState
            badgeLabel="Analytics Operacional"
            description="A carregar analytics e advisory operacional..."
            title="A carregar analytics"
          />
        ) : analyticsQuery.isError || advisoryQuery.isError ? (
          <AccessState
            badgeLabel="Analytics Operacional"
            description="Não foi possível carregar o analytics operacional."
            title="Analytics indisponível"
            variant="error"
          />
        ) : analytics && advisory ? (
          <TrackingAnalyticsSection analytics={analytics} advisory={advisory} />
        ) : null}
      </Suspense>

      <Suspense
        fallback={
          <AccessState
            badgeLabel="Eventos"
            description="A carregar eventos operacionais..."
            title="A carregar eventos"
          />
        }
      >
        {analyticsQuery.isLoading ? (
          <AccessState
            badgeLabel="Eventos"
            description="A carregar eventos operacionais..."
            title="A carregar eventos"
          />
        ) : analyticsQuery.isError ? (
          <AccessState
            badgeLabel="Eventos"
            description="Não foi possível carregar os eventos operacionais."
            title="Eventos indisponíveis"
            variant="error"
          />
        ) : analytics ? (
          <TrackingEventsSection analytics={analytics} />
        ) : null}
      </Suspense>

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

      <section className="grid gap-4 xl:grid-layout-main">
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
                { label: "Eventos", variant: "secondary" },
                {
                  label: canRecordEvents ? "Registo autorizado" : "Apenas leitura",
                  variant: canRecordEvents ? "success" : "warning",
                },
              ]}
            />
            <CardTitle>Registo de eventos</CardTitle>
            <CardDescription>
              Registos manuais de eventos operacionais (partidas, chegadas, atrasos, exceções).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            <ContextRow label="Total de remessas" value={overview.totals.shipments} />
            <ContextRow label="Activas" value={overview.totals.activeShipments} />
            <ContextRow label="Remessas recentes" value={overview.recentShipments.length} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
