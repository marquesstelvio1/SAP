"use client";

import { RpcError } from "../lib/rpc-client";
import { getTrackingOverview } from "../lib/tracking-overview";
import { useRpcQuery } from "./use-rpc";

export function useTrackingOverview(options?: { offset?: number; limit?: number }) {
  const offset = options?.offset ?? 0;
  const limit = options?.limit ?? 10;

  return useRpcQuery({
    queryKey: ["tracking-overview", offset, limit],
    queryFn: async () => {
      const result = await getTrackingOverview({ offset, limit });
      if (result.status !== "ok") {
        throw new RpcError(result.status, result.message);
      }
      return result.overview;
    },
    staleTime: 2 * 60_000,
  });
}
