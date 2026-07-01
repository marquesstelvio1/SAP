"use client";

import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
  type Table as TableType,
  type Updater,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  Columns3Icon,
  EyeOffIcon,
} from "lucide-react";
import { useCallback, useState } from "react";

import { cn } from "../lib/utils.js";
import { Button } from "./button.js";
import { Checkbox } from "./checkbox.js";
import { Input } from "./input.js";
import { Popover, PopoverContent, PopoverTrigger } from "./popover.js";
import { SelectNative } from "./select-native.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table.js";

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  pageSize?: number;
  filterColumn?: string;
  filterPlaceholder?: string;
  loading?: boolean;
  emptyMessage?: string;
  wrapperClassName?: string;
  manualPagination?: boolean;
  pageCount?: number;
  pageIndex?: number;
  onPageChange?: (pageIndex: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

function DataTable<TData>({
  columns,
  data,
  pageSize = 10,
  filterColumn,
  filterPlaceholder = "Filtrar...",
  loading = false,
  emptyMessage = "Sem resultados.",
  wrapperClassName,
  manualPagination = false,
  pageCount,
  pageIndex = 0,
  onPageChange,
  onPageSizeChange,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");

  const handlePaginationChange: OnChangeFn<PaginationState> = useCallback(
    (updater: Updater<PaginationState>) => {
      const current = { pageIndex, pageSize };
      const next = typeof updater === "function" ? updater(current) : updater;
      if (next.pageIndex !== pageIndex) {
        onPageChange?.(next.pageIndex);
      }
      if (next.pageSize !== pageSize) {
        onPageSizeChange?.(next.pageSize);
      }
    },
    [pageIndex, pageSize, onPageChange, onPageSizeChange],
  );

  const table: TableType<TData> = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
      pagination: { pageIndex, pageSize },
    },
    ...(manualPagination
      ? {
          manualPagination: true,
          pageCount: pageCount ?? 1,
          onPaginationChange: handlePaginationChange,
        }
      : {
          getPaginationRowModel: getPaginationRowModel(),
          initialState: { pagination: { pageSize } },
        }),
  });

  return (
    <div data-slot="data-table" className={cn("space-y-3", wrapperClassName)}>
      {filterColumn || columnVisibility ? (
        <DataTableToolbar
          table={table}
          filterColumn={filterColumn}
          filterPlaceholder={filterPlaceholder}
        />
      ) : null}
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      header.column.getCanSort() &&
                        "cursor-pointer select-none outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    )}
                    onClick={
                      header.column.getCanSort()
                        ? header.column.getToggleSortingHandler()
                        : undefined
                    }
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{
                        asc: <ArrowUpIcon className="ml-1 size-3" />,
                        desc: <ArrowDownIcon className="ml-1 size-3" />,
                      }[header.column.getIsSorted() as string] ?? null}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <DataTableLoading columns={columns.length} />
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}

interface DataTableToolbarProps<TData> {
  table: TableType<TData>;
  filterColumn: string | undefined;
  filterPlaceholder: string | undefined;
}

function DataTableToolbar<TData>({
  table,
  filterColumn,
  filterPlaceholder,
}: DataTableToolbarProps<TData>) {
  const allColumns = table.getAllColumns().filter((col) => col.getCanHide());

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      {filterColumn ? (
        <Input
          placeholder={filterPlaceholder}
          value={(table.getColumn(filterColumn)?.getFilterValue() as string) ?? ""}
          onChange={(e) => table.getColumn(filterColumn)?.setFilterValue(e.target.value)}
          className="max-w-xs"
        />
      ) : null}
      {allColumns.length > 0 ? <DataTableViewOptions table={table} /> : null}
    </div>
  );
}

interface DataTableViewOptionsProps<TData> {
  table: TableType<TData>;
}

function DataTableViewOptions<TData>({ table }: DataTableViewOptionsProps<TData>) {
  const columns = table.getAllColumns().filter((col) => col.getCanHide());

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <Columns3Icon className="size-3.5" />
          Colunas
          <ChevronDownIcon className="size-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-2">
        <div className="flex flex-col gap-1">
          {columns.map((column) => {
            const label =
              typeof column.columnDef.header === "string" ? column.columnDef.header : column.id;
            const isVisible = column.getIsVisible();

            const colId = `col-${column.id}`;
            return (
              <div
                key={column.id}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <Checkbox
                  checked={isVisible}
                  id={colId}
                  onCheckedChange={(checked) => column.toggleVisibility(!!checked)}
                />
                <label htmlFor={colId} className="flex-1 truncate">
                  {label}
                </label>
                {!isVisible ? <EyeOffIcon className="size-3.5 text-muted-foreground" /> : null}
              </div>
            );
          })}
        </div>
        {columns.length === 0 ? (
          <p className="px-2 py-4 text-center text-muted-foreground text-xs">
            Nenhuma coluna para alternar
          </p>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

interface DataTablePaginationProps<TData> {
  table: TableType<TData>;
}

function DataTablePagination<TData>({ table }: DataTablePaginationProps<TData>) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-muted-foreground text-xs">
      <div className="flex-1">
        {table.getFilteredSelectedRowModel().rows.length > 0
          ? `${table.getFilteredSelectedRowModel().rows.length} de ${table.getFilteredRowModel().rows.length} linha(s) seleccionada(s).`
          : `${table.getFilteredRowModel().rows.length} linha(s).`}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          Linhas por página
          <SelectNative
            value={String(table.getState().pagination.pageSize)}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="h-7 w-16 text-xs [&_svg]:size-3"
          >
            {[10, 25, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </SelectNative>
        </div>
        <div>
          Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            variant="outline"
            size="icon"
            className="hidden size-7 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeftIcon className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-7"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeftIcon className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-7"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRightIcon className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="hidden size-7 lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRightIcon className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function DataTableLoading({ columns }: { columns: number }) {
  return (
    <TableRow>
      {Array.from({ length: columns }).map((_, i) => (
        <TableCell /* biome-ignore lint/suspicious/noArrayIndexKey: static loading skeleton */
          key={i}
        >
          <div className="h-4 animate-pulse rounded bg-muted" />
        </TableCell>
      ))}
    </TableRow>
  );
}

export { DataTable, DataTablePagination, type DataTableProps, DataTableToolbar };
