"use client";

import {
  AccessState,
  BadgeGroup,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ContextRow,
  EmptyState,
} from "@saptm/ui";
import dynamic from "next/dynamic";
import { Suspense } from "react";

import { TrackingEventRecordForm } from "../../../../components/tracking/tracking-event-record-form";
import { TrackingOverviewHeader } from "../../../../components/tracking/tracking-overview-header";
import { TrackingStatusTables } from "../../../../components/tracking/tracking-status-tables";

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
  const analyticsQuery = useTrackingAnalytics();
  const advisoryQuery = useTrackingAdvisory();

  if (overviewQuery.isLoading || analyticsQuery.isLoading || advisoryQuery.isLoading) {
    return (
      <AccessState
        badgeLabel="Tracking Operacional"
        description="Aguarde enquanto os dados de tracking sao carregados."
        title="A carregar tracking operacional"
      />
    );
  }

  if (overviewQuery.isError) {
    return (
      <AccessState
        badgeLabel="Tracking Operacional"
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
        badgeLabel="Tracking Operacional"
        description={
          analyticsQuery.error instanceof Error
            ? analyticsQuery.error.message
            : "Erro ao carregar analytics."
        }
        role="alert"
        title="Analytics indisponivel"
        variant="error"
      />
    );
  }

  if (advisoryQuery.isError) {
    return (
      <AccessState
        badgeLabel="Tracking Operacional"
        description={
          advisoryQuery.error instanceof Error
            ? advisoryQuery.error.message
            : "Erro ao carregar advisory."
        }
        role="alert"
        title="Advisory indisponivel"
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
        description="Não há dados de tracking disponíveis no momento. Verifique se há remessas registadas."
      />
    );
  }

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
        <TrackingAnalyticsSection analytics={analytics} advisory={advisory} />
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
        <TrackingEventsSection analytics={analytics} />
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
                { label: "Eventos", variant: "secondary" },
                {
                  label: canRecordEvents ? "Registo autorizado" : "Apenas leitura",
                  variant: canRecordEvents ? "success" : "warning",
                },
              ]}
            />
            <CardTitle>Registo de eventos</CardTitle>
            <CardDescription>
              Registos manuais de eventos operacionais (partidas, chegadas, atrasos, excepcoes).
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
