import { Skeleton, SkeletonCard } from "@saptm/ui";

export default function SsoLoading() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Skeleton className="h-8 w-48" />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}
