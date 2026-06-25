"use client";

import { useQuery } from "@tanstack/react-query";
import { getCargoOverview } from "../lib/cargo-overview";

export function useCargoOverview(options?: { offset?: number; limit?: number }) {
  const offset = options?.offset ?? 0;
  const limit = options?.limit ?? 10;

  return useQuery({
    queryKey: ["cargo-overview", offset, limit],
    queryFn: async () => {
      const result = await getCargoOverview({ offset, limit });
      if (result.status !== "ok") {
        throw new Error(result.message);
      }
      return result.overview;
    },
    staleTime: 30_000,
  });
}
