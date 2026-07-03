"use client";

import type { BillingPlan, BillingSubscription, BillingUsage } from "@saptm/rpc/billing";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@saptm/ui";
import { CreditCardIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { PlanBadge } from "../../../../../components/billing/plan-badge";
import { PlanCard, type Plan as PlanCardType } from "../../../../../components/billing/plan-card";
import { createPortalSessionAction } from "../../../../../lib/billing-actions";

const PlanComparisonModal = dynamic(
  () =>
    import("../../settings/billing/plan-comparison-modal").then((m) => ({
      default: m.PlanComparisonModal,
    })),
  { ssr: false },
);

const subscriptionBadge: Record<
  string,
  { label: string; variant: "success" | "warning" | "destructive" | "info" | "outline" }
> = {
  active: { label: "Ativo", variant: "success" },
  past_due: { label: "Vencido", variant: "warning" },
  canceled: { label: "Cancelado", variant: "destructive" },
  incomplete: { label: "Incompleto", variant: "warning" },
  incomplete_expired: { label: "Expirado", variant: "destructive" },
  trialing: { label: "Teste", variant: "info" },
  paused: { label: "Pausado", variant: "outline" },
  unpaid: { label: "Não pago", variant: "destructive" },
};

export type SubscriptionManagementClientProps = {
  subscription: BillingSubscription | null;
  usage: BillingUsage[];
  plans: BillingPlan[];
};

/**
 * Client component para gestão de subscrição.
 *
 * Mostra:
 * - Planos disponíveis em grelha de cards
 * - Detalhes da subscrição atual (se ativa)
 * - Feature comparison
 * - Upgrade/downgrade flow
 */
export function SubscriptionManagementClient({
  subscription,
  usage,
  plans,
}: SubscriptionManagementClientProps) {
  const router = useRouter();
  const [portalState, portalAction, portalPending] = useActionState(
    createPortalSessionAction,
    null,
  );

  useEffect(() => {
    if (portalState?.status === "ok" && portalState.url) {
      router.push(portalState.url as Parameters<typeof router.push>[0]);
    }
  }, [portalState, router]);

  const currentPlanSlug = subscription?.plan ?? null;
  const isCanceled = subscription?.status === "canceled";
  const isPastDue = subscription?.status === "past_due" || subscription?.status === "unpaid";

  // Map API plans to PlanCard format
  const planCards: PlanCardType[] = plans.map((p) => ({
    id: p.id,
    slug: p.id,
    name: p.name,
    label: p.name,
    description: p.description ?? "",
    price: p.price,
    currency: "EUR",
    interval: "month",
    features: (p.features ?? []).map((f) => ({
      key: f,
      label: f,
      included: true,
    })),
    isPopular: p.id === "pro",
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* Past due banner */}
      {isPastDue ? (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <span className="text-destructive text-2xl" aria-hidden="true">
                ⚠️
              </span>
              <div>
                <p className="font-medium text-destructive text-sm">
                  Falha no pagamento. Atualize o método de pagamento para evitar interrupção.
                </p>
              </div>
            </div>
            <form action={portalAction}>
              <input type="hidden" name="returnUrl" value="/app/billing/subscription" />
              <Button type="submit" variant="destructive" disabled={portalPending}>
                Atualizar pagamento
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {/* Current subscription detail */}
      {subscription ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCardIcon className="size-5 text-muted-foreground" />
                <CardTitle>Subscrição Ativa</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={subscriptionBadge[subscription.status]?.variant ?? "outline"}>
                  {subscriptionBadge[subscription.status]?.label ?? subscription.status}
                </Badge>
                <PlanBadge plan={subscription.plan} />
              </div>
            </div>
            <CardDescription>
              {isCanceled
                ? "A subscrição foi cancelada. Acesso mantido até ao final do período."
                : "Detalhes da sua subscrição atual"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <ContextRowDetail
                  label="Período atual"
                  value={
                    subscription.currentPeriodStart && subscription.currentPeriodEnd
                      ? `${new Date(subscription.currentPeriodStart).toLocaleDateString("pt-PT")} → ${new Date(subscription.currentPeriodEnd).toLocaleDateString("pt-PT")}`
                      : "N/A"
                  }
                />
                <ContextRowDetail
                  label="Próxima cobrança"
                  value={
                    subscription.currentPeriodEnd
                      ? `${new Date(subscription.currentPeriodEnd).toLocaleDateString("pt-PT")}`
                      : "N/A"
                  }
                />
              </div>
              <div className="space-y-2">
                <ContextRowDetail
                  label="Estado"
                  value={subscriptionBadge[subscription.status]?.label ?? subscription.status}
                />
                {subscription.cancelAtPeriodEnd ? (
                  <p className="text-destructive text-xs">
                    A subscrição será cancelada no final do período atual.
                  </p>
                ) : null}
              </div>
            </div>
            {isCanceled ? (
              <div className="mt-4">
                <form action={portalAction}>
                  <input type="hidden" name="returnUrl" value="/app/billing/subscription" />
                  <Button type="submit" variant="default" disabled={portalPending}>
                    Reativar subscrição
                  </Button>
                </form>
              </div>
            ) : (
              <div className="mt-4 flex flex-wrap gap-3">
                <form action={portalAction}>
                  <input type="hidden" name="returnUrl" value="/app/billing/subscription" />
                  <Button type="submit" variant="default" disabled={portalPending}>
                    Gerir subscrição
                  </Button>
                </form>
                <PlanComparisonModal currentPlan={currentPlanSlug} />
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCardIcon className="size-5 text-muted-foreground" />
              <CardTitle>Sem subscrição ativa</CardTitle>
            </div>
            <CardDescription>
              Escolha um plano para começar a utilizar todas as funcionalidades da plataforma.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Plan cards grid */}
      <div>
        <h3 className="mb-3 font-semibold text-base tracking-heading">Planos disponíveis</h3>
        <div className="grid gap-6 md:grid-cols-3">
          {planCards.map((plan) => (
            <PlanCard key={plan.id} plan={plan} isCurrentPlan={plan.slug === currentPlanSlug} />
          ))}
        </div>
      </div>

      {/* Feature comparison */}
      {usage.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Funcionalidades incluídas</CardTitle>
            <CardDescription>Limites e funcionalidades do seu plano atual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {usage.flatMap((u) =>
                u.metrics.map((m) => (
                  <div key={m.metric} className="flex flex-col gap-1 rounded-lg border p-3">
                    <span className="text-muted-foreground text-xs">
                      {m.displayLabel ?? m.metric}
                    </span>
                    <span className="font-semibold text-lg">
                      {m.limit > 0
                        ? `${m.current.toLocaleString("pt-PT")} / ${m.limit.toLocaleString("pt-PT")}`
                        : "Ilimitado"}
                    </span>
                    {m.unit ? (
                      <span className="text-muted-foreground text-xs">{m.unit}</span>
                    ) : null}
                  </div>
                )),
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

/** Simple inline key-value row for context details */
function ContextRowDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-2">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
