"use client";

import { RpcError } from "../lib/rpc-client";
import { getTrackingAnalytics } from "../lib/tracking-analytics";
import { useRpcQuery } from "./use-rpc";

export function useTrackingAnalytics(lookbackDays = 30) {
  return useRpcQuery({
    queryKey: ["tracking-analytics", lookbackDays],
    queryFn: async () => {
      const result = await getTrackingAnalytics(lookbackDays);
      if (result.status !== "ok") {
        throw new RpcError(result.status, result.message);
      }
      return result.analytics;
    },
  });
}
