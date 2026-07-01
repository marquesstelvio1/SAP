import { Card, CardContent, CardHeader, Skeleton } from "@saptm/ui";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Skeleton className="mb-2 h-10 w-64" />
      <Skeleton className="mb-8 h-5 w-96" />

      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="mb-10">
          <Skeleton className="mb-4 h-8 w-48" />
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-10 w-28 rounded-lg" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
