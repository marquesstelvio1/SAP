import type { ReactNode } from "react";

import { cn } from "../../../lib/utils.js";
import { MetricTile } from "../../metric-tile.js";
import { SkeletonMetricTile } from "../../skeleton.js";

interface KpiItem {
  value: string | number;
  label: string;
  badge?: string;
  trend?: { direction: "up" | "down"; value: string };
  variant?: "default" | "info" | "success" | "warning" | "destructive" | "outline" | "secondary";
}

interface DashboardKpiGridProps {
  items: KpiItem[];
  loading?: boolean;
  columns?: 2 | 3 | 4 | 5 | 6;
  className?: string;
  renderItem?: (item: KpiItem, index: number) => ReactNode;
}

const columnMap = {
  2: "grid-cols-2",
  3: "grid-cols-2 md:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
  6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
} as const;

function DashboardKpiGrid({
  items,
  loading = false,
  columns = 4,
  className,
  renderItem,
}: DashboardKpiGridProps) {
  if (loading) {
    return (
      <div
        data-slot="dashboard-kpi-grid"
        className={cn("grid gap-4", columnMap[columns], className)}
      >
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonMetricTile key={String(i)} />
        ))}
      </div>
    );
  }

  return (
    <div data-slot="dashboard-kpi-grid" className={cn("grid gap-4", columnMap[columns], className)}>
      {items.map((item, index) =>
        renderItem ? (
          renderItem(item, index)
        ) : (
          <MetricTile
            key={item.label}
            {...(item.badge !== undefined ? { badge: item.badge } : {})}
            {...(item.trend !== undefined ? { trend: item.trend } : {})}
            {...(item.variant !== undefined ? { variant: item.variant } : {})}
            label={item.label}
            value={item.value}
          />
        ),
      )}
    </div>
  );
}

DashboardKpiGrid.displayName = "DashboardKpiGrid";

export { DashboardKpiGrid, type DashboardKpiGridProps, type KpiItem };
