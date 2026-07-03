"use client";

import {
  type QueryKey,
  type UseMutationOptions,
  type UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { RpcError } from "../lib/rpc-client";

/**
 * Hook para queries RPC com defaults de resiliência.
 * Defaults são aplicados APÓS o spread de options para evitar que callers
 * os sobrescrevam e causem request storms (429).
 *
 * - staleTime: 60s para evitar refetches frequentes
 * - gcTime: 10min para cache persistente entre navegações
 * - retry: máximo 1 tentativa com backoff exponencial (1s, 2s, 4s)
 * - refetchOnWindowFocus/refetchOnReconnect: false para evitar storms
 */
export function useRpcQuery<TData>(options: UseQueryOptions<TData, Error, TData, QueryKey>) {
  const queryOptions = options;

  const defaultRetry = (failureCount: number, error: Error): boolean => {
    if (error instanceof RpcError && (error.status === "unauthorized" || error.status === "forbidden")) {
      return false;
    }
    return failureCount < 1;
  };

  return useQuery<TData, Error, TData, QueryKey>({
    ...queryOptions,
    staleTime: queryOptions.staleTime ?? 60_000,
    gcTime: queryOptions.gcTime ?? 10 * 60_000,
    retry: queryOptions.retry ?? defaultRetry,
    retryDelay: queryOptions.retryDelay ?? (() => 1_000),
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
