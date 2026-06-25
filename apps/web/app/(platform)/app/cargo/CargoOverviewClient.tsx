"use client";

import { AccessState, EmptyState } from "@saptm/ui";

import { LifecycleProgressIndicator } from "../../../../components/cargo/cargo-lifecycle-group";
import { CargoLifecycleSections } from "../../../../components/cargo/cargo-lifecycle-sections";
import { CargoOverviewHeader } from "../../../../components/cargo/cargo-overview-header";
import {
  CargoRecentTable,
  CargoStatusTable,
} from "../../../../components/cargo/cargo-status-tables";
import { useCargoOverview } from "../../../../hooks/use-cargo-overview";

export function CargoOverviewClient({
  offset,
  limit,
  sessionId,
  canRegisterCargo,
  canReleaseCargo,
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
  sessionId: string;
  canRegisterCargo: boolean;
  canReleaseCargo: boolean;
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
        message="Aguarde enquanto os dados de cargas sao carregados."
        role="alert"
        status="Carregando"
        title="Carregando gestao de cargas"
      />
    );
  }

  if (cargoQuery.isError) {
    return (
      <AccessState
        badgeLabel="Gestao de Cargas"
        message={
          cargoQuery.error instanceof Error
            ? cargoQuery.error.message
            : "Erro ao carregar dados de cargas."
        }
        role="alert"
        status="Erro"
        title="Gestao de cargas indisponivel"
      />
    );
  }

  const overview = cargoQuery.data;

  if (!overview) {
    return (
      <EmptyState
        title="Nenhum dado encontrado"
        description="Nao ha dados de cargas disponiveis no momento. Verifique se ha cargas registradas."
      />
    );
  }

  const totalPages = Math.ceil(overview.pagination.totalCount / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <CargoOverviewHeader
        totals={overview.totals}
        organizationId={overview.organizationId}
        sessionId={sessionId}
        permissions={{
          readCargoPermission: "cargo.read",
          registerCargoPermission: "cargo.register",
          departCargoTransportPermission: "cargo.transport.depart",
          arriveCargoTransportPermission: "cargo.transport.arrive",
          recordCargoOperationalHandoffPermission: "cargo.handoff.record",
          recordCargoClaimSettlementPermission: "cargo.claim.settle",
          completeCargoDeliveryPermission: "cargo.delivery.complete",
          recordCargoDeliveryExceptionPermission: "cargo.delivery.exception.record",
          recordComplianceEvidencePermission: "cargo.compliance.record",
        }}
      />

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

      <CargoLifecycleSections
        canRegisterCargo={canRegisterCargo}
        canReleaseCargo={canReleaseCargo}
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
    </div>
  );
}
