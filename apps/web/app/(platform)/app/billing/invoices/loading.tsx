import { Skeleton, SkeletonTable } from "@saptm/ui";

export default function InvoicesLoading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-5 w-24" />
      <SkeletonTable rows={5} columns={4} />
    </div>
  );
}
