import { Skeleton, SkeletonCard } from "@saptm/ui";

export default function SubscriptionLoading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-5 w-48" />
      <SkeletonCard />
      <Skeleton className="h-5 w-32" />
      <div className="grid gap-6 md:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
