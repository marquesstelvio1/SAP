"use client";

import { RpcError } from "../lib/rpc-client";
import { getTrackingAdvisory } from "../lib/tracking-advisory";
import { useRpcQuery } from "./use-rpc";

export function useTrackingAdvisory(options?: { limit?: number; enabled?: boolean }) {
  const limit = options?.limit ?? 5;
  const enabled = options?.enabled ?? true;

  return useRpcQuery({
    queryKey: ["tracking-advisory", limit],
    queryFn: async () => {
      const result = await getTrackingAdvisory(limit);
      if (result.status !== "ok") {
        throw new RpcError(result.status, result.message);
      }
      return result.advisory;
    },
    enabled,
    staleTime: 2 * 60_000,
  });
}
