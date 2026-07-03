"use client";

import { RpcError } from "../lib/rpc-client";
import { getTrackingAnalytics } from "../lib/tracking-analytics";
import { useRpcQuery } from "./use-rpc";

export function useTrackingAnalytics(options?: { lookbackDays?: number; enabled?: boolean }) {
  const lookbackDays = options?.lookbackDays ?? 30;
  const enabled = options?.enabled ?? true;

  return useRpcQuery({
    queryKey: ["tracking-analytics", lookbackDays],
    queryFn: async () => {
      const result = await getTrackingAnalytics(lookbackDays);
      if (result.status !== "ok") {
        throw new RpcError(result.status, result.message);
      }
      return result.analytics;
    },
    enabled,
    staleTime: 2 * 60_000,
  });
}
