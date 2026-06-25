"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

interface UseDataTableProps<TData, TParams> {
  queryKey: string[];
  queryFn: (
    params: TParams & { offset: number; limit: number },
  ) => Promise<{ items: TData[]; totalCount: number }>;
  defaultPageSize?: number;
  params?: TParams;
}

export function useDataTable<TData, TParams = Record<string, unknown>>({
  queryKey,
  queryFn,
  defaultPageSize = 10,
  params,
}: UseDataTableProps<TData, TParams>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const offset = Number(searchParams.get("offset")) || 0;
  const limit = Number(searchParams.get("limit")) || defaultPageSize;
  const { data, isLoading } = useQuery({
    queryKey: [...queryKey, { offset, limit, ...params }],
    queryFn: () => queryFn({ ...(params ?? ({} as TParams)), offset, limit }),
    staleTime: 30_000,
  });
  const pageCount = useMemo(() => (data ? Math.ceil(data.totalCount / limit) : 0), [data, limit]);
  const handlePageChange = useCallback(
    (page: number) => {
      const p = new URLSearchParams(searchParams.toString());
      p.set("offset", String(page * limit));
      router.push(`?${p.toString()}`);
    },
    [searchParams, limit, router],
  );
  const handlePageSizeChange = useCallback(
    (pageSize: number) => {
      const p = new URLSearchParams(searchParams.toString());
      p.set("offset", "0");
      p.set("limit", String(pageSize));
      router.push(`?${p.toString()}`);
    },
    [searchParams, router],
  );
  return {
    data: data?.items ?? [],
    totalCount: data?.totalCount ?? 0,
    pageCount,
    pageIndex: Math.floor(offset / limit),
    pageSize: limit,
    isLoading,
    handlePageChange,
    handlePageSizeChange,
  };
}
