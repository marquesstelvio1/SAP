import { AccessState } from "@saptm/ui";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requirePlatformSession } from "../../../../../lib/auth-session";
import { getBillingOverview, getPlans } from "../../../../../lib/billing";
import { SubscriptionManagementClient } from "./subscription-management-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Subscrição",
  description: "Gerir plano, upgrade e métodos de pagamento.",
};

/**
 * Página de gestão de subscrição ( /app/billing/subscription ).
 *
 * Estados:
 * - Sem permissão → AccessState blocked
 * - Plano Free → upgrade CTA
 * - Plano Pro → detalhes da subscrição + alterar/cancelar
 * - Plano Enterprise → contacto comercial
 * - Cancelado → reativar CTA
 */
export default async function SubscriptionManagementPage() {
  const platformSession = await requirePlatformSession("/app/billing/subscription");

  if (!platformSession.viewer.permissions.includes("billing.read")) {
    return (
      <AccessState
        badgeLabel="Subscrição"
        description="O utilizador autenticado não tem acesso à gestão de subscrição."
        role="alert"
        title="Subscrição bloqueada"
        variant="blocked"
      />
    );
  }

  // Fetch billing overview and plans in parallel
  let overviewResult: Awaited<ReturnType<typeof getBillingOverview>>;
  let plansResult: Awaited<ReturnType<typeof getPlans>>;

  try {
    [overviewResult, plansResult] = await Promise.all([getBillingOverview(), getPlans()]);
  } catch {
    return (
      <AccessState
        badgeLabel="Subscrição"
        description="API não respondeu dentro do tempo limite."
        role="alert"
        title="Dados indisponíveis"
        variant="error"
      />
    );
  }

  if (overviewResult.status === "unauthorized" || plansResult.status === "unauthorized") {
    redirect("/sign-in?reason=session_expired");
  }

  if (overviewResult.status !== "ok") {
    return (
      <AccessState
        badgeLabel="Subscrição"
        description={overviewResult.message}
        role="alert"
        title="Subscrição indisponível"
        variant="error"
      />
    );
  }

  if (plansResult.status !== "ok") {
    return (
      <AccessState
        badgeLabel="Planos"
        description={plansResult.message}
        role="alert"
        title="Planos indisponíveis"
        variant="error"
      />
    );
  }

  return (
    <SubscriptionManagementClient
      subscription={overviewResult.subscription}
      usage={overviewResult.usage}
      plans={plansResult.plans}
    />
  );
}
