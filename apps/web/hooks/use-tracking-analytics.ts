"use client";

import { useQuery } from "@tanstack/react-query";
import { getTrackingAnalytics } from "../lib/tracking-analytics";

export function useTrackingAnalytics(lookbackDays = 30) {
  return useQuery({
    queryKey: ["tracking-analytics", lookbackDays],
    queryFn: async () => {
      const result = await getTrackingAnalytics(lookbackDays);
      if (result.status !== "ok") {
        throw new Error(result.message);
      }
      return result.analytics;
    },
    staleTime: 30_000,
  });
}
