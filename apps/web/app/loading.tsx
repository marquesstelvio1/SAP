import { Skeleton } from "@saptm/ui";

export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <Skeleton className="h-8 w-48" />
    </main>
  );
}
