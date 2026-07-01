import { Skeleton } from "@saptm/ui";

export default function Loading() {
  return (
    <div className="flex min-h-full">
      <aside className="hidden w-64 shrink-0 self-stretch border-r md:block">
        <div className="flex flex-col gap-1 p-4">
          <div className="mb-3 flex flex-col gap-0.5 px-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-1 h-3 w-36" />
          </div>
          <div className="mb-3 h-px bg-border" />
          <nav className="flex flex-col gap-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </nav>
        </div>
      </aside>
      <div className="min-w-0 flex-1 overflow-x-auto p-4 md:p-6 lg:p-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
