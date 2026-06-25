"use client";

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@saptm/ui";
import type { Route } from "next";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="gap-4 text-center">
          <div className="flex flex-col gap-2">
            <CardTitle className="text-2xl">Erro inesperado</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button className="w-full" onClick={reset}>
            Tentar novamente
          </Button>
          <Button asChild className="w-full" variant="outline">
            <Link href={"/app" as Route}>Voltar ao inicio</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
