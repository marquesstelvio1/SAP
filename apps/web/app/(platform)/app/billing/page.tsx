import { AccessState, Card, CardContent, ErrorCard, MetricTile } from "@saptm/ui";
import type { Metadata } from "next";
import { UsageMeter } from "../../../../components/billing/usage-meter";
import { requirePlatformSession } from "../../../../lib/auth-session";
import { getBillingOverview } from "../../../../lib/billing";
import { BillingInvoicesSection } from "./components/billing-invoices-section";
import { BillingSubscriptionCard } from "./components/billing-subscription-card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Faturação",
  description: "Subscrição, planos e faturas da organização.",
};

/**
 * Página de visão geral da facturação ( /app/billing ).
 *
 * Estados:
 * - Sem permissão → AccessState blocked
 * - Erro de API → ErrorCard
 * - Dados ok → subscription card + usage meters + invoices
 */
export default async function BillingOverviewPage() {
  const platformSession = await requirePlatformSession("/app/billing");

  if (!platformSession.viewer.permissions.includes("billing.read")) {
    return (
      <AccessState
        badgeLabel="Faturação"
        description="O utilizador autenticado não tem acesso ao módulo de faturação."
        role="alert"
        title="Faturação bloqueada"
        variant="blocked"
      />
    );
  }

  let result: Awaited<ReturnType<typeof getBillingOverview>>;

  try {
    result = await getBillingOverview();
  } catch {
    return (
      <ErrorCard title="Dados indisponíveis" message="API não respondeu dentro do tempo limite." />
    );
  }

  if (result.status !== "ok") {
    return <ErrorCard title="Dados indisponíveis" message={result.message} />;
  }

  const { subscription, usage, recentInvoices } = result;

  return (
    <div className="flex flex-col gap-6">
      {/* Subscription Card */}
      <BillingSubscriptionCard subscription={subscription} />

      {/* Usage Meters */}
      <div>
        <h3 className="mb-3 font-semibold text-base tracking-heading">Utilização</h3>
        {usage.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {usage.flatMap((u) =>
              u.metrics.map((m) => {
                const pct = m.limit > 0 ? (m.current / m.limit) * 100 : 0;
                return (
                  <Card key={m.metric}>
                    <CardContent className="pt-6">
                      <UsageMeter
                        label={m.displayLabel ?? m.metric}
                        current={m.current}
                        limit={m.limit}
                        format="number"
                      />
                      <MetricTile
                        label={m.displayLabel ?? m.metric}
                        value={`${m.current.toLocaleString("pt-PT")} / ${m.limit.toLocaleString("pt-PT")}`}
                        badge={`${Math.round(pct)}%`}
                        variant={pct >= 100 ? "destructive" : pct >= 80 ? "warning" : "default"}
                      />
                    </CardContent>
                  </Card>
                );
              }),
            )}
          </div>
        ) : (
          <AccessState
            badgeLabel="Utilização"
            title="Sem dados de uso"
            description="As métricas de uso aparecerão aqui quando disponíveis."
            variant="empty"
          />
        )}
      </div>

      {/* Recent Invoices */}
      <BillingInvoicesSection invoices={recentInvoices} />
    </div>
  );
}
