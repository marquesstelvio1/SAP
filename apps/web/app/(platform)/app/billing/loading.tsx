import { Skeleton, SkeletonCard, SkeletonMetricTile, SkeletonTable } from "@saptm/ui";

/**
 * Loading state for /app/billing
 */
export default function BillingOverviewLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Subscription card skeleton */}
      <SkeletonCard />

      {/* Usage meters skeleton */}
      <div>
        <Skeleton className="mb-3 h-5 w-24" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonMetricTile />
          <SkeletonMetricTile />
          <SkeletonMetricTile />
        </div>
      </div>

      {/* Invoices skeleton */}
      <div>
        <Skeleton className="mb-3 h-5 w-32" />
        <SkeletonTable rows={3} columns={4} />
      </div>
    </div>
  );
}
