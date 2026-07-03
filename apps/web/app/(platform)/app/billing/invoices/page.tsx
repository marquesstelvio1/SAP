import type { BillingInvoice, BillingInvoicesListOutput } from "@saptm/rpc/billing";
import {
  billingInvoicesListInputSchema,
  billingInvoicesListOutputSchema,
} from "@saptm/rpc/billing";
import {
  AccessState,
  Badge,
  DataTable,
  EmptyState,
  ErrorCard,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@saptm/ui";
import type { ColumnDef } from "@tanstack/react-table";
import { ExternalLinkIcon } from "lucide-react";
import type { Metadata } from "next";
import { requirePlatformSession } from "../../../../../lib/auth-session";
import { rpcGet } from "../../../../../lib/rpc-server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Faturas",
  description: "Histórico de faturas da organização.",
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

export default async function BillingInvoicesPage(props: {
  searchParams?: Promise<{ offset?: string; limit?: string }>;
}) {
  const searchParams = await props.searchParams;
  const platformSession = await requirePlatformSession("/app/billing/invoices");

  if (!platformSession.viewer.permissions.includes("billing.read")) {
    return (
      <AccessState
        badgeLabel="Faturas"
        description="O utilizador autenticado não tem acesso às faturas."
        role="alert"
        title="Faturas bloqueadas"
        variant="blocked"
      />
    );
  }

  const offset = Number(searchParams?.offset) || 0;
  const limit = Number(searchParams?.limit) || 10;

  const parsed = billingInvoicesListInputSchema.safeParse({ offset, limit });
  if (!parsed.success) {
    return (
      <ErrorCard title="Parâmetros inválidos" message="Os parâmetros de paginação são inválidos." />
    );
  }

  let result: Awaited<ReturnType<typeof rpcGet<BillingInvoicesListOutput>>>;

  try {
    result = await rpcGet(
      `/rpc/billing/invoices?offset=${offset}&limit=${limit}`,
      billingInvoicesListOutputSchema,
    );
  } catch {
    return (
      <ErrorCard
        title="Faturas indisponíveis"
        message="API não respondeu dentro do tempo limite."
      />
    );
  }

  if (result.status !== "ok") {
    return <ErrorCard title="Faturas indisponíveis" message={result.message} />;
  }

  const { invoices, pagination } = result.data;

  const totalPages = Math.ceil(pagination.totalCount / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-semibold text-lg tracking-heading">Faturas</h2>
        <p className="text-muted-foreground text-sm">Histórico de faturas da organização</p>
      </div>

      {invoices.length > 0 ? (
        <>
          <DataTable
            columns={invoiceColumns}
            data={invoices}
            manualPagination
            pageCount={totalPages}
            pageIndex={currentPage - 1}
            onPageChange={(_page) => {
              // Server-side pagination via URL params
            }}
          />
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">Total: {pagination.totalCount} faturas</p>
            <Pagination>
              <PaginationContent>
                {currentPage > 1 ? (
                  <PaginationItem>
                    <PaginationPrevious
                      href={`/app/billing/invoices?offset=${(currentPage - 2) * limit}&limit=${limit}`}
                    />
                  </PaginationItem>
                ) : null}
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href={`/app/billing/invoices?offset=${(page - 1) * limit}&limit=${limit}`}
                        isActive={page === currentPage}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                {currentPage < totalPages ? (
                  <PaginationItem>
                    <PaginationNext
                      href={`/app/billing/invoices?offset=${currentPage * limit}&limit=${limit}`}
                    />
                  </PaginationItem>
                ) : null}
              </PaginationContent>
            </Pagination>
          </div>
        </>
      ) : (
        <EmptyState
          title="Sem faturas"
          description="Ainda não existem faturas para esta organização."
        />
      )}
    </div>
  );
}
