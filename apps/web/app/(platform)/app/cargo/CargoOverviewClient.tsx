"use client";

import { AccessState, EmptyState } from "@saptm/ui";
import dynamic from "next/dynamic";
import { Suspense } from "react";

import { LifecycleProgressIndicator } from "../../../../components/cargo/cargo-lifecycle-group";
import { CargoOverviewHeader } from "../../../../components/cargo/cargo-overview-header";
import {
  CargoRecentTable,
  CargoStatusTable,
} from "../../../../components/cargo/cargo-status-tables";
import { useCargoOverview } from "../../../../hooks/use-cargo-overview";

const CargoLifecycleSections = dynamic(
  () =>
    import("../../../../components/cargo/cargo-lifecycle-sections").then(
      (mod) => mod.CargoLifecycleSections,
    ),
  { ssr: false },
);

export function CargoOverviewClient({
  offset,
  limit,
  canRegisterCargo,
  canPlanTransport,
  canDepartTransport,
  canArriveTransport,
  canRecordOperationalHandoff,
  canRecordClaimSettlement,
  canCompleteDelivery,
  canRecordDeliveryException,
  canResolveDeliveryException,
  canRecordComplianceEvidence,
  canVerifyComplianceEvidence,
}: {
  offset: number;
  limit: number;
  canRegisterCargo: boolean;
  canPlanTransport: boolean;
  canDepartTransport: boolean;
  canArriveTransport: boolean;
  canRecordOperationalHandoff: boolean;
  canRecordClaimSettlement: boolean;
  canCompleteDelivery: boolean;
  canRecordDeliveryException: boolean;
  canResolveDeliveryException: boolean;
  canRecordComplianceEvidence: boolean;
  canVerifyComplianceEvidence: boolean;
}) {
  const cargoQuery = useCargoOverview({ offset, limit });

  if (cargoQuery.isLoading) {
    return (
      <AccessState
        badgeLabel="Gestao de Cargas"
        description="Aguarde enquanto os dados de cargas sao carregados."
        role="alert"
        title="A carregar gestao de cargas"
      />
    );
  }

  if (cargoQuery.isError) {
    return (
      <AccessState
        badgeLabel="Gestao de Cargas"
        description="Dados indisponiveis. Tente novamente mais tarde."
        role="alert"
        title="Gestao de cargas indisponivel"
        variant="error"
      />
    );
  }

  const overview = cargoQuery.data;

  if (!overview) {
    return (
      <EmptyState
        title="Nenhum dado encontrado"
        description="Não há dados de cargas disponíveis no momento. Verifique se há cargas registadas."
      />
    );
  }

  const totalPages = Math.ceil(overview.pagination.totalCount / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <CargoOverviewHeader totals={overview.totals} />

      <LifecycleProgressIndicator cargoStatuses={overview.statusCounts} />

      <section className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <CargoStatusTable statusCounts={overview.statusCounts} />
        <CargoRecentTable
          items={overview.recentCargo}
          pagination={{
            totalCount: overview.pagination.totalCount,
            limit,
            offset,
            totalPages,
            currentPage,
          }}
        />
      </section>

      <Suspense
        fallback={
          <AccessState
            badgeLabel="Ciclo de Vida de Cargas"
            description="A carregar formularios de ciclo de vida..."
            title="A carregar ciclo de vida"
          />
        }
      >
        <CargoLifecycleSections
          canRegisterCargo={canRegisterCargo}
          canPlanTransport={canPlanTransport}
          canDepartTransport={canDepartTransport}
          canArriveTransport={canArriveTransport}
          canRecordOperationalHandoff={canRecordOperationalHandoff}
          canRecordClaimSettlement={canRecordClaimSettlement}
          canCompleteDelivery={canCompleteDelivery}
          canRecordDeliveryException={canRecordDeliveryException}
          canResolveDeliveryException={canResolveDeliveryException}
          canRecordComplianceEvidence={canRecordComplianceEvidence}
          canVerifyComplianceEvidence={canVerifyComplianceEvidence}
        />
      </Suspense>
    </div>
  );
}
