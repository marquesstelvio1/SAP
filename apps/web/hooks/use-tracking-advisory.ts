"use client";

import { useQuery } from "@tanstack/react-query";
import { getTrackingAdvisory } from "../lib/tracking-advisory";

export function useTrackingAdvisory(limit = 5) {
  return useQuery({
    queryKey: ["tracking-advisory", limit],
    queryFn: async () => {
      const result = await getTrackingAdvisory(limit);
      if (result.status !== "ok") {
        throw new Error(result.message);
      }
      return result.advisory;
    },
    staleTime: 30_000,
  });
}
