import { Card, CardContent, CardHeader, Skeleton } from "@saptm/ui";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-32 rounded-full" />
        </div>
        <div className="max-w-3xl">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="mt-2 h-4 w-full" />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-24" />
              <Skeleton className="mt-1 h-4 w-full max-w-sm" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-3 w-64" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-28" />
              <Skeleton className="mt-1 h-4 w-full max-w-sm" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Skeleton className="h-3 w-32" />
                <div className="flex gap-3">
                  <Skeleton className="h-10 flex-1 rounded-md" />
                  <Skeleton className="size-10 shrink-0 rounded-md" />
                </div>
                <Skeleton className="h-3 w-64" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-20" />
              <Skeleton className="mt-1 h-4 w-full max-w-sm" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-3 w-64" />
              </div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-1 h-4 w-full" />
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-xl" />
                <div className="flex flex-col gap-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-2 w-24" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-6 w-28 rounded-md" />
                <Skeleton className="h-6 w-20 rounded-md" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-28 rounded-md" />
                <Skeleton className="h-9 w-28 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-3 w-64" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
