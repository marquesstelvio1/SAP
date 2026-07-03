"use client";

import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@saptm/ui";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import {
  createTrackingShipmentRoute,
  modeLabels,
  resolveStatusVariant,
  statusLabels,
} from "../../app/(platform)/app/tracking/logic";

export type PaginationState = {
  totalCount: number;
  limit: number;
  offset: number;
  totalPages: number;
  currentPage: number;
};

export type TrackingStatusTablesProps = {
  overview: {
    statusCounts: Array<{ status: string; count: number }>;
    recentShipments: Array<{
      id: string;
      referenceCode: string;
      transportMode: string;
      status: string;
      cargoDescription: string | null;
      originName: string;
      destinationName: string;
      lastEventType: string | null;
      lastKnownLocation: string | null;
    }>;
  };
  pagination: PaginationState;
};

export function TrackingStatusTables({ overview, pagination }: TrackingStatusTablesProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = useCallback(
    (newPageIndex: number) => {
      const params = new URLSearchParams(searchParams);
      params.set("offset", String(newPageIndex * pagination.limit));
      params.set("limit", String(pagination.limit));
      router.push(`?${params.toString()}`);
    },
    [router, searchParams, pagination.limit],
  );

  const handlePageSizeChange = useCallback(
    (newPageSize: number) => {
      const params = new URLSearchParams(searchParams);
      params.set("offset", "0");
      params.set("limit", String(newPageSize));
      router.push(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  const columns: ColumnDef<(typeof overview.recentShipments)[number]>[] = [
    {
      header: "Referencia",
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <Link
            className="rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
            href={createTrackingShipmentRoute(row.original.id)}
          >
            {row.original.referenceCode}
          </Link>
          <span className="text-muted-foreground text-xs">
            {modeLabels[row.original.transportMode as keyof typeof modeLabels]}
          </span>
        </div>
      ),
    },
    {
      header: "Carga",
      cell: ({ row }) => row.original.cargoDescription,
    },
    {
      header: "Rota",
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          {row.original.originName} <ArrowRight className="size-3" /> {row.original.destinationName}
        </span>
      ),
    },
    {
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={resolveStatusVariant(row.original.status as keyof typeof statusLabels)}>
          {statusLabels[row.original.status as keyof typeof statusLabels]}
        </Badge>
      ),
    },
    {
      header: "Ultimo evento",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.lastEventType ?? "Sem evento"} —{" "}
          {row.original.lastKnownLocation ?? "Local não informado"}
        </span>
      ),
    },
  ];

  return (
    <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por status</CardTitle>
          <CardDescription>Base para SLA, exceções e alertas operacionais.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table aria-label="Distribuição por status">
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Volume</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overview.statusCounts.map((item) => (
                <TableRow key={item.status}>
                  <TableCell className="font-medium">
                    {statusLabels[item.status as keyof typeof statusLabels]}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.count > 0 ? "secondary" : "outline"}>{item.count}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Movimentos recentes</CardTitle>
          <CardDescription>
            Últimas cargas atualizadas no tenant. Eventos são registados pelo comando auditável.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={overview.recentShipments}
            manualPagination
            pageCount={pagination.totalPages}
            pageIndex={pagination.currentPage - 1}
            pageSize={pagination.limit}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            emptyMessage="Sem cargas rastreadas neste tenant."
          />
        </CardContent>
      </Card>
    </section>
  );
}
