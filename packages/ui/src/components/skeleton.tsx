import type * as React from "react";

import { cn } from "../lib/utils.js";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

function SkeletonCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="skeleton-card" className={cn("rounded-xl border p-6", className)} {...props}>
      <Skeleton className="mb-4 h-4 w-1/3" />
      <Skeleton className="mb-2 h-8 w-1/2" />
      <Skeleton className="h-3 w-1/4" />
    </div>
  );
}

function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div data-slot="skeleton-table" className={cn("space-y-2", className)}>
      <div className="flex gap-4 border-b pb-2">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={String(i)} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={String(r)} className="flex gap-4 py-2">
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={String(r * columns + c)} className="h-3 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

function SkeletonMetricTile({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton-metric-tile"
      className={cn("rounded-xl border p-4", className)}
      {...props}
    >
      <Skeleton className="mb-3 h-3 w-1/2" />
      <Skeleton className="mb-2 h-8 w-2/3" />
      <Skeleton className="h-3 w-1/3" />
    </div>
  );
}

export { Skeleton, SkeletonCard, SkeletonMetricTile, SkeletonTable };
