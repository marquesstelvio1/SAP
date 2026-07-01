"use client";

import { getTrackingAdvisory } from "../lib/tracking-advisory";
import { useRpcQuery } from "./use-rpc";

export function useTrackingAdvisory(limit = 5) {
  return useRpcQuery({
    queryKey: ["tracking-advisory", limit],
    queryFn: async () => {
      const result = await getTrackingAdvisory(limit);
      if (result.status !== "ok") {
        throw new Error(result.message);
      }
      return result.advisory;
    },
  });
}
