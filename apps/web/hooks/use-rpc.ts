import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RpcResult, RpcStatus } from "../lib/rpc-client";

type QueryKey = readonly [string, ...unknown[]];

type UseRpcQueryOptions<T> = {
  queryKey: QueryKey;
  queryFn: () => Promise<RpcResult<T>>;
  enabled?: boolean;
};

type UseRpcMutationOptions<TInput, TOutput> = {
  mutationFn: (input: TInput) => Promise<RpcResult<TOutput>>;
  onSuccess?: (data: TOutput) => void;
  invalidateQueries?: QueryKey[];
};

export function useRpcQuery<T>({ queryKey, queryFn, enabled = true }: UseRpcQueryOptions<T>) {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const result = await queryFn();
      if (result.status !== "ok") {
        throw new RpcQueryError(result.status, result.message);
      }
      return result.data;
    },
    enabled,
  });
}

export function useRpcMutation<TInput, TOutput>({
  mutationFn,
  onSuccess,
  invalidateQueries,
}: UseRpcMutationOptions<TInput, TOutput>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TInput) => {
      const result = await mutationFn(input);
      if (result.status !== "ok") {
        throw new RpcQueryError(result.status, result.message);
      }
      return result.data;
    },
    onSuccess: (data) => {
      if (invalidateQueries) {
        for (const key of invalidateQueries) {
          queryClient.invalidateQueries({ queryKey: key });
        }
      }
      onSuccess?.(data);
    },
  });
}

export class RpcQueryError extends Error {
  readonly rpcStatus: RpcStatus;

  constructor(rpcStatus: RpcStatus, message: string) {
    super(message);
    this.name = "RpcQueryError";
    this.rpcStatus = rpcStatus;
  }
}
