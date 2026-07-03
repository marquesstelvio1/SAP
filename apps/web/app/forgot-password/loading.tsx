import { Skeleton } from "@saptm/ui";

export default function Loading() {
  return (
    <main className="min-h-screen bg-sidebar text-sidebar-foreground">
      <div className="grid min-h-screen lg:grid-layout-auth">
        <section className="relative hidden overflow-hidden border-sidebar-border border-r p-10 lg:flex lg:flex-col lg:justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="size-11 rounded-xl" />
            <div className="flex flex-col gap-0.5">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <div className="flex max-w-xl flex-col gap-6">
            <Skeleton className="h-6 w-44 rounded-full" />
            <Skeleton className="h-10 w-96" />
            <Skeleton className="h-16 w-full" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        </section>
        <section className="flex items-center justify-center bg-background p-4 md:p-8">
          <div className="flex w-full max-w-sm flex-col gap-4">
            <Skeleton className="mx-auto h-8 w-48" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </section>
      </div>
    </main>
  );
}
