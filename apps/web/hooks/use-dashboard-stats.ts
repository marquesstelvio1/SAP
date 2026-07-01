"use client";

import { getTrackingOverview } from "../lib/tracking-overview";
import { useRpcQuery } from "./use-rpc";

export type DashboardStats = {
  shipments: number;
  activeShipments: number;
  delayedShipments: number;
  exceptionShipments: number;
  organizationId: string;
  generatedAt: string;
};

export function useDashboardStats() {
  return useRpcQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const result = await getTrackingOverview();
      if (result.status !== "ok") {
        throw new Error(result.message);
      }
      const overview = result.overview;
      return {
        shipments: overview.totals.shipments,
        activeShipments: overview.totals.activeShipments,
        delayedShipments: overview.totals.delayedShipments,
        exceptionShipments: overview.totals.exceptionShipments,
        organizationId: overview.organizationId,
        generatedAt: overview.generatedAt,
      } satisfies DashboardStats;
    },
  });
}
