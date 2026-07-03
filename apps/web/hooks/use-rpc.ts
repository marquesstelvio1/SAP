"use client";

import {
  type QueryKey,
  type UseMutationOptions,
  type UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { RpcError, type RpcFailure } from "../lib/rpc-client";

export function useRpcQuery<TData>(options: UseQueryOptions<TData, Error, TData, QueryKey>) {
  const queryOptions = options;

  const defaultRetry = (failureCount: number, error: Error): boolean => {
    if (error instanceof RpcError && (error.status === "unauthorized" || error.status === "forbidden")) {
      return false;
    }
    if (error instanceof RpcError && error.status === "rate_limited") {
      return failureCount < 1;
    }
    return failureCount < 1;
  };

  const defaultRetryDelay = (failureCount: number, error: Error): number => {
    if (error instanceof RpcError && error.status === "rate_limited") {
      const errorWithRetryAfter = error as unknown as RpcFailure;
      const baseDelay = errorWithRetryAfter.retryAfterMs ?? 10_000;
      const jitter = Math.random() * 1000;
      return baseDelay * (2 ** failureCount) + jitter;
    }
    return Math.min(2000 * 2 ** failureCount, 30000);
  };

  return useQuery<TData, Error, TData, QueryKey>({
    ...queryOptions,
    staleTime: queryOptions.staleTime ?? 60_000,
    gcTime: queryOptions.gcTime ?? 10 * 60_000,
    retry: queryOptions.retry ?? defaultRetry,
    retryDelay: queryOptions.retryDelay ?? defaultRetryDelay,
    refetchOnWindowFocus: queryOptions.refetchOnWindowFocus ?? false,
    refetchOnReconnect: queryOptions.refetchOnReconnect ?? false,
    refetchInterval: queryOptions.refetchInterval ?? false,
  });
}

type RpcMutationResult<TInput, TOutput> = {
  mutationFn: (input: TInput) => Promise<TOutput>;
  onSuccess?: (data: TOutput, variables: TInput, context: unknown) => void;
  invalidateQueries?: QueryKey[];
};

/**
 * Hook para mutações RPC com invalidação automática de queries.
 */
export function useRpcMutation<TInput, TOutput>(
  options: RpcMutationResult<TInput, TOutput> &
    Omit<UseMutationOptions<TOutput, Error, TInput>, "mutationFn" | "onSuccess">,
) {
  const { mutationFn, onSuccess, invalidateQueries, ...rest } = options;
  const queryClient = useQueryClient();

  return useMutation<TOutput, Error, TInput>({
    mutationFn,
    onSuccess: (data, variables, context) => {
      if (invalidateQueries) {
        for (const key of invalidateQueries) {
          queryClient.invalidateQueries({ queryKey: key });
        }
      }
      onSuccess?.(data, variables, context);
    },
    ...rest,
  });
}
