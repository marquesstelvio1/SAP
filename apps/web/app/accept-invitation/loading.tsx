import { Card, CardHeader, Skeleton } from "@saptm/ui";

export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-lg">
        <CardHeader className="flex flex-col items-center gap-3">
          <Skeleton className="h-5 w-36 rounded-full" />
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-full max-w-sm" />
        </CardHeader>
      </Card>
    </main>
  );
}
