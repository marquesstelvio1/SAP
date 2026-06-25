import type { ReactNode } from "react";

import { cn } from "../../lib/utils.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../card.js";
import { Skeleton } from "../skeleton.js";

interface ChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: string;
  error?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  action?: ReactNode;
  className?: string;
  contentClassName?: string;
  height?: number;
}

function ChartCard({
  title,
  description,
  children,
  loading = false,
  empty = false,
  emptyMessage = "No data available.",
  error = false,
  errorMessage = "Failed to load chart data.",
  onRetry,
  action,
  className,
  contentClassName,
  height = 300,
}: ChartCardProps) {
  return (
    <Card data-slot="chart-card" className={cn("flex flex-col", className)}>
      <CardHeader className="flex-row items-center justify-between">
        <div className="flex flex-col gap-1">
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </CardHeader>
      <CardContent
        className={cn("flex items-center justify-center", contentClassName)}
        style={{ minHeight: height }}
      >
        {loading ? (
          <div className="flex w-full flex-col gap-3">
            <Skeleton className="h-4 w-1/4" />
            <div
              className="flex w-full items-end justify-around gap-2"
              style={{ height: height - 80 }}
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton
                  key={String(i)}
                  className="flex-1 rounded-t-md"
                  style={{ height: `${Math.max(20, Math.random() * 80)}%` }}
                />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
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
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-sm text-foreground">Error</p>
              <p className="mt-0.5 text-muted-foreground text-xs">{errorMessage}</p>
            </div>
            {onRetry ? (
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md border bg-background px-3 py-1.5 text-xs font-medium shadow-panel hover:bg-accent"
                onClick={onRetry}
              >
                Retry
              </button>
            ) : null}
          </div>
        ) : empty ? (
          <div className="flex flex-col items-center gap-3 text-center">
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

ChartCard.displayName = "ChartCard";

export { ChartCard, type ChartCardProps };
