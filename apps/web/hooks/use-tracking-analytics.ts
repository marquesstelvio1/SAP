"use client";

import { getTrackingAnalytics } from "../lib/tracking-analytics";
import { useRpcQuery } from "./use-rpc";

export function useTrackingAnalytics(lookbackDays = 30) {
  return useRpcQuery({
    queryKey: ["tracking-analytics", lookbackDays],
    queryFn: async () => {
      const result = await getTrackingAnalytics(lookbackDays);
      if (result.status !== "ok") {
        throw new Error(result.message);
      }
      return result.analytics;
    },
  });
}
