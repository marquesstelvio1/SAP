"use client";

import type { BillingInvoice } from "@saptm/rpc/billing";
import { Badge, DataTable, EmptyState } from "@saptm/ui";
import type { ColumnDef } from "@tanstack/react-table";
import { ExternalLinkIcon } from "lucide-react";

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
    header: "Período",
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

export type BillingInvoicesSectionProps = {
  invoices: BillingInvoice[];
};

/**
 * Secção de faturas para a página de visão geral da facturação.
 * Mostra as faturas recentes numa DataTable.
 */
export function BillingInvoicesSection({ invoices }: BillingInvoicesSectionProps) {
  return (
    <div>
      <h3 className="mb-3 font-semibold text-base tracking-heading">Faturas recentes</h3>
      {invoices.length > 0 ? (
        <DataTable columns={invoiceColumns} data={invoices} pageSize={5} />
      ) : (
        <EmptyState
          title="Sem faturas"
          description="As faturas aparecerão aqui após a primeira cobrança."
        />
      )}
    </div>
  );
}
