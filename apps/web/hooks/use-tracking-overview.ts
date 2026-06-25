"use client";

import { useQuery } from "@tanstack/react-query";
import { getTrackingOverview } from "../lib/tracking-overview";

export function useTrackingOverview(options?: { offset?: number; limit?: number }) {
  const offset = options?.offset ?? 0;
  const limit = options?.limit ?? 10;

  return useQuery({
    queryKey: ["tracking-overview", offset, limit],
    queryFn: async () => {
      const result = await getTrackingOverview({ offset, limit });
      if (result.status !== "ok") {
        throw new Error(result.message);
      }
      return result.overview;
    },
    staleTime: 30_000,
  });
}
