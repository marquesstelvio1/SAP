import type { PlatformPermission } from "@saptm/auth";
import { AccessState, ErrorCard } from "@saptm/ui";
import type { Metadata } from "next";
import { PlanningOrdersSection } from "../../../../components/planning/planning-orders-section";
import { PlanningOverviewHeader } from "../../../../components/planning/planning-overview-header";
import { TransportOrderCancelForm } from "../../../../components/planning/transport-order-cancel-form";
import { TransportOrderConfirmForm } from "../../../../components/planning/transport-order-confirm-form";
import { TransportOrderDispatchForm } from "../../../../components/planning/transport-order-dispatch-form";
import { TransportOrderRescheduleForm } from "../../../../components/planning/transport-order-reschedule-form";
import { requirePlatformSession } from "../../../../lib/auth-session";
import { getPlanningOverview } from "../../../../lib/planning-overview";
import {
  cancelTransportOrderAction,
  confirmTransportOrderAction,
  dispatchTransportOrderAction,
  rescheduleTransportOrderAction,
} from "./actions";
import {
  initialTransportOrderCancelFormState,
  initialTransportOrderConfirmFormState,
  initialTransportOrderDispatchFormState,
  initialTransportOrderRescheduleFormState,
} from "./form-state";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Planeamento",
  description:
    "Confirmacao, dispatch e replaneamento de ordens de transporte ferroviario e logistico.",
};

const readPlanningPermission: PlatformPermission = "planning.order.read";

export default async function PlanningOverviewPage() {
  const platformSession = await requirePlatformSession("/app/planning");
  const viewerPermissions = platformSession.viewer.permissions;
  const canConfirmTransportOrder = viewerPermissions.includes(
    "planning.order.confirm" as PlatformPermission,
  );
  const canCancelTransportOrder = viewerPermissions.includes(
    "planning.order.cancel" as PlatformPermission,
  );
  const canRescheduleTransportOrder = viewerPermissions.includes(
    "planning.order.reschedule" as PlatformPermission,
  );
  const canDispatchTransportOrder = viewerPermissions.includes(
    "planning.order.dispatch" as PlatformPermission,
  );

  if (!viewerPermissions.includes(readPlanningPermission)) {
    return (
      <AccessState
        badgeLabel="Planeamento"
        description="O utilizador autenticado nao tem acesso ao modulo de planeamento."
        role="alert"
        title="Planeamento bloqueado"
        variant="blocked"
      />
    );
  }

  let result: Awaited<ReturnType<typeof getPlanningOverview>>;
  try {
    result = await getPlanningOverview(10);
  } catch {
    return (
      <ErrorCard
        message="Nao foi possivel carregar os dados de planeamento. Tente novamente."
        title="Erro ao carregar planeamento"
      />
    );
  }

  if (result.status !== "ok") {
    return <ErrorCard message={result.message} title="Planeamento indisponivel" />;
  }

  const { overview } = result;

  const dispatchRate =
    overview.totals.transportOrders > 0
      ? `${Math.round((overview.totals.dispatched / overview.totals.transportOrders) * 100)}%`
      : "—";
  const confirmRate =
    overview.totals.transportOrders > 0
      ? `${Math.round((overview.totals.confirmed / overview.totals.transportOrders) * 100)}%`
      : "—";

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <PlanningOverviewHeader
        totals={overview.totals}
        confirmRate={confirmRate}
        dispatchRate={dispatchRate}
      />

      <PlanningOrdersSection recentOrders={overview.recentOrders} />

      <section className="grid gap-4">
        <TransportOrderConfirmForm
          action={confirmTransportOrderAction}
          canConfirmTransportOrder={canConfirmTransportOrder}
          initialState={initialTransportOrderConfirmFormState}
        />
        <div className="grid gap-4 xl:grid-cols-2">
          <TransportOrderRescheduleForm
            action={rescheduleTransportOrderAction}
            canRescheduleTransportOrder={canRescheduleTransportOrder}
            initialState={initialTransportOrderRescheduleFormState}
          />
          <TransportOrderDispatchForm
            action={dispatchTransportOrderAction}
            canDispatchTransportOrder={canDispatchTransportOrder}
            initialState={initialTransportOrderDispatchFormState}
          />
          <TransportOrderCancelForm
            action={cancelTransportOrderAction}
            canCancelTransportOrder={canCancelTransportOrder}
            initialState={initialTransportOrderCancelFormState}
          />
        </div>
      </section>
    </div>
  );
}
