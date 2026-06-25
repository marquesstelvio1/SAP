import { Card, CardContent, CardHeader, Skeleton } from "@saptm/ui";

export default function Loading() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-9 w-40 rounded-md" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-28 rounded-full" />
          ))}
        </div>
      </div>

      <section className="grid gap-4 xl:grid-cols-[0.7fr_1.3fr]">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-10 rounded-lg" />
            <Skeleton className="h-10 rounded-lg" />
          </CardContent>
        </Card>
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="gap-4">
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-32 rounded-full" />
              </div>
              <Skeleton className="h-9 w-96" />
              <Skeleton className="h-8 w-full max-w-3xl" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 rounded-lg" />
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 rounded-lg" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 rounded-lg" />
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-52" />
            <Skeleton className="h-4 w-full max-w-lg" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 rounded-lg" />
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-4 w-full max-w-xl" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {Array.from({ length: 14 }).map((_, i) => (
                <Skeleton key={i} className="h-10 rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full rounded-lg" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-lg" />
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
