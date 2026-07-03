"use client";

import type { BillingInvoice, BillingSubscription, BillingUsage } from "@saptm/rpc/billing";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  MetricTile,
} from "@saptm/ui";
import type { ColumnDef } from "@tanstack/react-table";
import { CreditCardIcon, ExternalLinkIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { createPortalSessionAction } from "./actions";
import { PlanComparisonModal } from "./plan-comparison-modal";

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

const invoiceStatusMap: Record<
  string,
  { label: string; variant: "success" | "warning" | "outline" | "destructive" | "info" }
> = {
  paid: { label: "Paga", variant: "success" },
  open: { label: "Pendente", variant: "warning" },
  draft: { label: "Rascunho", variant: "outline" },
  uncollectible: { label: "Incobrável", variant: "destructive" },
  void: { label: "Anulada", variant: "info" },
};

const invoiceColumns: ColumnDef<BillingInvoice>[] = [
  {
    accessorKey: "periodStart",
    header: "Data",
    cell: ({ row }) => {
      if (!row.original.periodStart || !row.original.periodEnd) return "-";
      const start = new Date(row.original.periodStart).toLocaleDateString("pt-PT");
      const end = new Date(row.original.periodEnd).toLocaleDateString("pt-PT");
      return `${start} - ${end}`;
    },
  },
  {
    accessorKey: "amount",
    header: "Valor",
    cell: ({ row }) => {
      const amount = (row.original.amount / 100).toFixed(2);
      return `${amount} ${row.original.currency.toUpperCase()}`;
    },
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      const s = invoiceStatusMap[row.original.status] ?? {
        label: row.original.status,
        variant: "outline" as const,
      };
      return <Badge variant={s.variant}>{s.label}</Badge>;
    },
  },
  {
    accessorKey: "paidAt",
    header: "Paga em",
    cell: ({ row }) => {
      if (!row.original.paidAt) return "-";
      return new Date(row.original.paidAt).toLocaleDateString("pt-PT");
    },
  },
  {
    id: "download",
    header: "",
    cell: ({ row }) => {
      if (!row.original.downloadUrl) return null;
      return (
        <a
          href={row.original.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-sm text-sm text-primary outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <ExternalLinkIcon className="size-3.5" />
          Descarregar
        </a>
      );
    },
  },
];

export type BillingPageContentProps = {
  subscription: BillingSubscription | null;
  usage: BillingUsage[];
  recentInvoices: BillingInvoice[];
};

export function BillingPageContent({
  subscription,
  usage,
  recentInvoices,
}: BillingPageContentProps) {
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

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-semibold text-lg tracking-heading">Faturação</h2>
        <p className="text-muted-foreground text-sm">Subscrição, planos e faturas da organização</p>
      </div>

      {/* Current plan card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCardIcon className="size-5 text-muted-foreground" />
              <CardTitle>Subscrição</CardTitle>
            </div>
            {subscription ? (
              <Badge variant={subscriptionBadge[subscription.status]?.variant ?? "outline"}>
                {subscriptionBadge[subscription.status]?.label ?? subscription.status}
              </Badge>
            ) : null}
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
              <input type="hidden" name="returnUrl" value="/app/settings/billing" />
              <Button type="submit" variant="default" disabled={portalPending}>
                Gerir subscrição
              </Button>
            </form>
            <PlanComparisonModal currentPlan={subscription?.plan ?? null} />
          </div>
        </CardContent>
      </Card>

      {/* Usage metering */}
      <div>
        <h3 className="mb-3 font-semibold text-base tracking-heading">Uso</h3>
        {usage.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {usage
              .flatMap((u) => u.metrics)
              .map((m) => {
                const pct = m.limit > 0 ? (m.current / m.limit) * 100 : 0;
                return (
                  <MetricTile
                    key={m.metric}
                    label={m.metric}
                    value={`${m.current} / ${m.limit}`}
                    badge={`${Math.round(pct)}%`}
                    variant={pct >= 100 ? "destructive" : pct >= 90 ? "warning" : "default"}
                  />
                );
              })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <CreditCardIcon className="size-6" />
            </div>
            <p className="font-semibold text-base tracking-heading">Sem dados de uso</p>
            <p className="max-w-sm text-muted-foreground text-sm">
              As metricas de uso aparecerão aqui quando disponiveis.
            </p>
          </div>
        )}
      </div>

      {/* Recent invoices */}
      <div>
        <h3 className="mb-3 font-semibold text-base tracking-heading">Faturas</h3>
        {recentInvoices.length > 0 ? (
          <DataTable columns={invoiceColumns} data={recentInvoices} pageSize={5} />
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <CreditCardIcon className="size-6" />
            </div>
            <p className="font-semibold text-base tracking-heading">Sem faturas</p>
            <p className="max-w-sm text-muted-foreground text-sm">
              As faturas aparecerão aqui apos a primeira cobranca.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
