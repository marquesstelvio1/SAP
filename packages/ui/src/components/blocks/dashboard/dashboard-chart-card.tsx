import type { ReactNode } from "react";

import { cn } from "../../../lib/utils.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../card.js";
import { Skeleton } from "../../skeleton.js";

type ChartCardSize = "sm" | "md" | "lg";

interface DashboardChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  size?: ChartCardSize;
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: string;
  error?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  action?: ReactNode;
  className?: string;
}

const heightMap: Record<ChartCardSize, string> = {
  sm: "min-h-[200px]",
  md: "min-h-[300px]",
  lg: "min-h-[400px]",
};

function DashboardChartCard({
  title,
  description,
  children,
  size = "md",
  loading = false,
  empty = false,
  emptyMessage = "No data available.",
  error = false,
  errorMessage = "Failed to load chart data.",
  onRetry,
  action,
  className,
}: DashboardChartCardProps) {
  return (
    <Card data-slot="dashboard-chart-card" className={cn("flex flex-col", className)}>
      <CardHeader className="flex-row items-center justify-between">
        <div className="flex flex-col gap-1">
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </CardHeader>
      <CardContent className={cn("flex flex-1 items-center justify-center", heightMap[size])}>
        {loading ? (
          <div className="flex w-full flex-col gap-3">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-[calc(100%-2rem)] w-full flex-1" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="text-destructive text-sm">{errorMessage}</p>
            {onRetry ? (
              <button
                type="button"
                className="text-primary text-xs underline underline-offset-2 hover:text-primary/80"
                onClick={onRetry}
              >
                Try again
              </button>
            ) : null}
          </div>
        ) : empty ? (
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <svg
                className="size-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <p className="text-muted-foreground text-sm">{emptyMessage}</p>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

DashboardChartCard.displayName = "DashboardChartCard";

export { type ChartCardSize, DashboardChartCard, type DashboardChartCardProps };
