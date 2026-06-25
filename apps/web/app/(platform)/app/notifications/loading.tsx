import { Card, CardHeader, Skeleton } from "@saptm/ui";

export default function Loading() {
  return (
    <main className="flex flex-col gap-6">
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-5 w-28 rounded-full" />
          <Skeleton className="h-5 w-28 rounded-full" />
          <Skeleton className="h-5 w-28 rounded-full" />
        </div>
        <div className="max-w-3xl">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="mt-2 h-5 w-full" />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-8 w-12" />
            </CardHeader>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
      </Card>
    </main>
  );
}
