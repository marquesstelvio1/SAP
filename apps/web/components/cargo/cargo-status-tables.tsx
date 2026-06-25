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
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import {
  cargoStatusLabels,
  cargoTypeLabels,
  computeNextCargoAction,
  customsStatusLabels,
  NextActionCell,
  resolveCargoStatusVariant,
} from "../../app/(platform)/app/cargo/logic";

export function CargoStatusTable({
  statusCounts,
}: {
  statusCounts: Array<{ status: string; count: number }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuicao por estado</CardTitle>
        <CardDescription>Base para bloqueio, prontidao, transporte e entrega.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table aria-label="Distribuicao por estado">
          <TableHeader>
            <TableRow>
              <TableHead>Estado</TableHead>
              <TableHead>Volume</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {statusCounts.map((item) => (
              <TableRow key={item.status}>
                <TableCell className="font-medium">
                  {cargoStatusLabels[item.status as keyof typeof cargoStatusLabels]}
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
  );
}

export type PaginationState = {
  totalCount: number;
  limit: number;
  offset: number;
  totalPages: number;
  currentPage: number;
};

export function CargoRecentTable({
  items,
  pagination,
}: {
  items: Array<{
    id: string;
    cargoReference: string;
    cargoDescription: string;
    cargoType: string;
    status: string;
    customsStatus: string;
    conditionStatus: string;
    hazardous: boolean;
    requiresInspection: boolean;
    originName: string;
    destinationName: string;
  }>;
  pagination: PaginationState;
}) {
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

  const columns: ColumnDef<(typeof items)[number]>[] = [
    {
      header: "Referencia",
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <span>{row.original.cargoReference}</span>
          <span className="text-muted-foreground text-xs">{row.original.cargoDescription}</span>
        </div>
      ),
    },
    {
      header: "Tipo",
      cell: ({ row }) => cargoTypeLabels[row.original.cargoType as keyof typeof cargoTypeLabels],
    },
    {
      header: "Rota",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.originName} &rarr; {row.original.destinationName}
        </span>
      ),
    },
    {
      header: "Compliance",
      cell: ({ row }) => (
        <Badge variant={row.original.customsStatus === "held" ? "warning" : "outline"}>
          {customsStatusLabels[row.original.customsStatus as keyof typeof customsStatusLabels]}
        </Badge>
      ),
    },
    {
      header: "Bloqueios",
      cell: ({ row }) => {
        const cargo = row.original;
        return (
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={resolveCargoStatusVariant(cargo.status as keyof typeof cargoStatusLabels)}
            >
              {cargoStatusLabels[cargo.status as keyof typeof cargoStatusLabels]}
            </Badge>
            {cargo.requiresInspection ? <Badge variant="warning">Inspecao</Badge> : null}
            {cargo.hazardous ? <Badge variant="destructive">Perigosa</Badge> : null}
          </div>
        );
      },
    },
    {
      header: "Prox. acao",
      cell: ({ row }) => {
        const nextAction = computeNextCargoAction(
          row.original as Parameters<typeof computeNextCargoAction>[0],
        );
        return <NextActionCell action={nextAction} />;
      },
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cargas recentes</CardTitle>
        <CardDescription>
          Registos tenant-scoped com compliance, condicao, custodia e bloqueios.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={items}
          manualPagination
          pageCount={pagination.totalPages}
          pageIndex={pagination.currentPage - 1}
          pageSize={pagination.limit}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          emptyMessage="Sem cargas registadas neste tenant."
        />
      </CardContent>
    </Card>
  );
}
