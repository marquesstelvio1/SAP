import { Skeleton } from "@saptm/ui";

export default function PlatformLoading() {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex lg:flex-col">
        <div className="flex h-20 items-center gap-3 border-b border-sidebar-border px-5">
          <Skeleton className="size-10 rounded-xl" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-5">
          {Array.from({ length: 3 }).map((_, group) => (
            <div className="flex flex-col gap-2" key={group}>
              <Skeleton className="mx-2 h-3 w-16 rounded" />
              {Array.from({ length: 4 }).map((_, item) => (
                <Skeleton key={item} className="h-9 w-full rounded-lg" />
              ))}
            </div>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-4">
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6">
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-6">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
            <div className="grid gap-4 xl:grid-cols-2">
              <Skeleton className="h-72 rounded-xl" />
              <Skeleton className="h-72 rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
