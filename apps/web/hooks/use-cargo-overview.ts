"use client";

import { getCargoOverview } from "../lib/cargo-overview";
import { useRpcQuery } from "./use-rpc";

export function useCargoOverview(options?: { offset?: number; limit?: number }) {
  const offset = options?.offset ?? 0;
  const limit = options?.limit ?? 10;

  return useRpcQuery({
    queryKey: ["cargo-overview", offset, limit],
    queryFn: async () => {
      const result = await getCargoOverview({ offset, limit });
      if (result.status !== "ok") {
        throw new Error(result.message);
      }
      return result.overview;
    },
  });
}
