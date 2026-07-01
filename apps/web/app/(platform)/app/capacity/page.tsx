import type { PlatformPermission } from "@saptm/auth";
import { AccessState } from "@saptm/ui";
import type { Metadata } from "next";
import { CapacityAdvisoryAnalytics } from "../../../../components/capacity/capacity-advisory-analytics";
import { CapacityAdvisoryDecisionForm } from "../../../../components/capacity/capacity-advisory-decision-form";
import { CapacityAdvisoryPanel } from "../../../../components/capacity/capacity-advisory-panel";
import { CapacityDecisionsTables } from "../../../../components/capacity/capacity-decisions-tables";
import { CapacityOverviewHeader } from "../../../../components/capacity/capacity-overview-header";
import { CapacityPreCheck } from "../../../../components/capacity/capacity-pre-check";
import { CapacityResourceRegisterForm } from "../../../../components/capacity/capacity-resource-register-form";
import { CapacityRulesCard } from "../../../../components/capacity/capacity-rules-card";
import { CapacitySlotCancelForm } from "../../../../components/capacity/capacity-slot-cancel-form";
import { CapacitySlotOpenForm } from "../../../../components/capacity/capacity-slot-open-form";
import { CapacitySlotReserveForm } from "../../../../components/capacity/capacity-slot-reserve-form";
import { CapacitySlotsReservations } from "../../../../components/capacity/capacity-slots-reservations";
import { requirePlatformSession } from "../../../../lib/auth-session";
import { getCapacityAdvisory } from "../../../../lib/capacity-advisory";
import { getCapacityAdvisoryDecisionAnalytics } from "../../../../lib/capacity-advisory-decision-analytics";
import { getCapacityOverview } from "../../../../lib/capacity-overview";
import {
  cancelCapacitySlotReservationAction,
  openCapacitySlotAction,
  recordCapacityAdvisoryDecisionAction,
  registerCapacityResourceAction,
  reserveCapacitySlotAction,
} from "./actions";
import {
  initialCapacityAdvisoryDecisionFormState,
  initialCapacityResourceRegisterFormState,
  initialCapacitySlotCancelFormState,
  initialCapacitySlotOpenFormState,
  initialCapacitySlotReserveFormState,
} from "./form-state";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Capacidade Operacional",
  description:
    "Recursos, slots, reservas e advisory de capacidade para ferrovia, porto e logistica.",
};

const readCapacityPermission: PlatformPermission = "capacity.read";

export default async function CapacityOverviewPage() {
  const platformSession = await requirePlatformSession("/app/capacity");
  const viewerPermissions = platformSession.viewer.permissions;
  const canManageCapacity = viewerPermissions.includes("capacity.manage" as PlatformPermission);
  const canReserveCapacity = viewerPermissions.includes(
    "capacity.slot.reserve" as PlatformPermission,
  );
  const canCancelCapacity = viewerPermissions.includes(
    "capacity.slot.cancel" as PlatformPermission,
  );
  const canDecideCapacityAdvisory = viewerPermissions.includes(
    "capacity.advisory.decide" as PlatformPermission,
  );

  if (!viewerPermissions.includes(readCapacityPermission)) {
    return (
      <AccessState
        badgeLabel="Capacidade"
        description="O utilizador autenticado nao tem acesso ao modulo de capacidade."
        role="alert"
        title="Capacidade operacional bloqueada"
        variant="blocked"
      />
    );
  }

  let result: Awaited<ReturnType<typeof getCapacityOverview>>;
  let advisoryResult: Awaited<ReturnType<typeof getCapacityAdvisory>>;
  let advisoryDecisionAnalyticsResult: Awaited<
    ReturnType<typeof getCapacityAdvisoryDecisionAnalytics>
  >;
  try {
    [result, advisoryResult, advisoryDecisionAnalyticsResult] = await Promise.all([
      getCapacityOverview(),
      getCapacityAdvisory(5),
      getCapacityAdvisoryDecisionAnalytics(10, 30),
    ]);
  } catch {
    return (
      <AccessState
        badgeLabel="Capacidade"
        description="Não foi possível carregar os dados de capacidade. Tente novamente."
        role="alert"
        title="Erro ao carregar capacidade"
        variant="error"
      />
    );
  }

  if (result.status !== "ok") {
    return (
      <AccessState
        badgeLabel="Capacidade"
        description={result.message}
        role="alert"
        title="Capacidade operacional indisponivel"
        variant="error"
      />
    );
  }

  if (advisoryResult.status !== "ok") {
    return (
      <AccessState
        badgeLabel="Advisory de capacidade"
        description={advisoryResult.message}
        role="alert"
        title="Advisory de capacidade indisponivel"
        variant="error"
      />
    );
  }

  if (advisoryDecisionAnalyticsResult.status !== "ok") {
    return (
      <AccessState
        badgeLabel="Analytics de decisoes"
        description={advisoryDecisionAnalyticsResult.message}
        role="alert"
        title="Analytics de decisoes de advisory indisponivel"
        variant="error"
      />
    );
  }

  const { overview } = result;
  const { advisory } = advisoryResult;
  const { analytics: advisoryDecisionAnalytics } = advisoryDecisionAnalyticsResult;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <CapacityOverviewHeader totals={overview.totals} />

      <CapacitySlotsReservations
        upcomingSlots={overview.upcomingSlots}
        recentReservations={overview.recentReservations}
      />

      <CapacityAdvisoryPanel recommendations={advisory.recommendations} policy={advisory.policy} />

      <CapacityAdvisoryAnalytics analytics={advisoryDecisionAnalytics} />

      <CapacityDecisionsTables
        byRecommendationType={advisoryDecisionAnalytics.byRecommendationType}
        recentDecisions={advisoryDecisionAnalytics.recentDecisions}
      />

      <section className="grid gap-4 xl:grid-cols-2">
        <CapacityResourceRegisterForm
          action={registerCapacityResourceAction}
          canManageCapacity={canManageCapacity}
          initialState={initialCapacityResourceRegisterFormState}
        />

        <CapacitySlotOpenForm
          action={openCapacitySlotAction}
          canManageCapacity={canManageCapacity}
          initialState={initialCapacitySlotOpenFormState}
        />
      </section>

      <section>
        <CapacityAdvisoryDecisionForm
          action={recordCapacityAdvisoryDecisionAction}
          canDecideCapacityAdvisory={canDecideCapacityAdvisory}
          initialState={initialCapacityAdvisoryDecisionFormState}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="flex flex-col gap-4">
          <CapacityPreCheck
            slots={overview.upcomingSlots.map((slot) => ({
              id: slot.id,
              slotReference: slot.slotReference,
              resourceCode: slot.resourceCode,
              resourceType: slot.resourceType,
              locationName: slot.locationName,
              windowStartAt: slot.windowStartAt,
              windowEndAt: slot.windowEndAt,
              capacityUnits: slot.capacityUnits,
              availableUnits: slot.availableUnits,
              status: slot.status,
            }))}
            cargoEligibility={null}
          />
          <CapacitySlotReserveForm
            action={reserveCapacitySlotAction}
            canReserveCapacity={canReserveCapacity}
            initialState={initialCapacitySlotReserveFormState}
          />
        </div>

        <CapacitySlotCancelForm
          action={cancelCapacitySlotReservationAction}
          canCancelCapacity={canCancelCapacity}
          initialState={initialCapacitySlotCancelFormState}
        />
      </section>

      <CapacityRulesCard />
    </div>
  );
}
