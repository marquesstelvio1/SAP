import { Skeleton } from "@saptm/ui";

export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4 md:p-8">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <Skeleton className="size-16 rounded-full" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    </main>
  );
}
