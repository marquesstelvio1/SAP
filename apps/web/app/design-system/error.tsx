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
    <div className="mx-auto flex max-w-6xl items-start justify-center px-6 py-20">
      <Card className="w-full max-w-sm">
        <CardHeader className="gap-2 text-center">
          <CardTitle className="text-2xl">Erro inesperado</CardTitle>
          <CardDescription>{error.message}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button className="w-full" onClick={reset}>
            Tentar novamente
          </Button>
          <Button asChild className="w-full" variant="outline">
            <Link href={"/design-system" as Route}>Voltar</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
