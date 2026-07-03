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
 * Hook para queries RPC com staleTime padrão de 30s.
 * O queryFn deve retornar os dados já extraídos da resposta RPC.
 * O tratamento de erro (status !== "ok") deve ser feito dentro do queryFn.
 * Retry é desativado para erros "unauthorized" para evitar loop de 429.
 */
export function useRpcQuery<TData>(options: UseQueryOptions<TData, Error, TData, QueryKey>) {
  return useQuery<TData, Error, TData, QueryKey>({
    staleTime: 30_000,
    retry: (failureCount, error) => {
      if (error instanceof RpcError && error.status === "unauthorized") {
        return false;
      }
      return failureCount < 3;
    },
    ...options,
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
