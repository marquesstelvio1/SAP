"use client";

import type { BillingSubscription } from "@saptm/rpc/billing";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@saptm/ui";
import dynamic from "next/dynamic";
import { CreditCardIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { PlanBadge } from "../../../../../components/billing/plan-badge";
import { createPortalSessionAction } from "../../../../../lib/billing-actions";

const PlanComparisonModal = dynamic(
  () => import("../../settings/billing/plan-comparison-modal").then((m) => ({ default: m.PlanComparisonModal })),
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

const planNames: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  enterprise: "Enterprise",
};

export type BillingSubscriptionCardProps = {
  subscription: BillingSubscription | null;
};

/**
 * Cartão de subscrição para a página de facturação.
 *
 * Estados:
 * - subscription null → estado Free sem subscrição ativa
 * - subscription active → detalhes do plano atual
 * - subscription canceled → aviso de cancelamento
 * - subscription past_due → aviso de pagamento vencido
 */
export function BillingSubscriptionCard({ subscription }: BillingSubscriptionCardProps) {
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

  const isPastDue = subscription?.status === "past_due" || subscription?.status === "unpaid";
  const isCanceled = subscription?.status === "canceled";

  return (
    <>
      {/* Past due warning */}
      {isPastDue ? (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <span className="text-destructive text-2xl" aria-hidden="true">
                ⚠️
              </span>
              <div>
                <p className="font-medium text-destructive text-sm">
                  Pagamento vencido — atualize o método de pagamento
                </p>
                <p className="text-destructive/80 text-xs">para evitar interrupção do serviço.</p>
              </div>
            </div>
            <form action={portalAction}>
              <input type="hidden" name="returnUrl" value="/app/billing" />
              <Button type="submit" variant="destructive" disabled={portalPending}>
                Atualizar pagamento
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {/* Canceled warning */}
      {isCanceled ? (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-warning text-2xl" aria-hidden="true">
                  ℹ️
                </span>
                <div>
                  <p className="font-medium text-warning text-sm">A subscrição foi cancelada.</p>
                  <p className="text-warning/80 text-xs">
                    Os dados serão mantidos até ao final do período atual.
                  </p>
                </div>
              </div>
              <form action={portalAction}>
                <input type="hidden" name="returnUrl" value="/app/billing" />
                <Button type="submit" variant="outline" disabled={portalPending}>
                  Reativar subscrição
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Subscription card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCardIcon className="size-5 text-muted-foreground" />
              <CardTitle>Subscrição</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {subscription ? (
                <Badge variant={subscriptionBadge[subscription.status]?.variant ?? "outline"}>
                  {subscriptionBadge[subscription.status]?.label ?? subscription.status}
                </Badge>
              ) : null}
              {subscription?.plan ? <PlanBadge plan={subscription.plan} /> : null}
            </div>
          </div>
          <CardDescription>
            {subscription
              ? `Plano ${planNames[subscription.plan] ?? subscription.plan}`
              : "Nenhuma subscrição ativa"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subscription ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-muted-foreground text-sm">
                  Período atual:{" "}
                  {subscription.currentPeriodStart
                    ? new Date(subscription.currentPeriodStart).toLocaleDateString("pt-PT")
                    : "N/A"}{" "}
                  -{" "}
                  {subscription.currentPeriodEnd
                    ? new Date(subscription.currentPeriodEnd).toLocaleDateString("pt-PT")
                    : "N/A"}
                </p>
                {subscription.cancelAtPeriodEnd ? (
                  <p className="text-destructive text-xs">
                    A subscrição será cancelada no final do período.
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Configure a sua subscrição para aceder a todos os recursos.
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            <form action={portalAction}>
              <input type="hidden" name="returnUrl" value="/app/billing" />
              <Button type="submit" variant="default" disabled={portalPending}>
                {subscription ? "Gerir subscrição" : "Configurar subscrição"}
              </Button>
            </form>
            <PlanComparisonModal currentPlan={subscription?.plan ?? null} />
          </div>
        </CardContent>
      </Card>
    </>
  );
}
