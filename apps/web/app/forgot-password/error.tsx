"use client";

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@saptm/ui";
import type { Route } from "next";
import Link from "next/link";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="gap-2 text-center">
          <CardTitle className="text-2xl">Erro inesperado</CardTitle>
          <CardDescription>
            Ocorreu um erro inesperado. Tente novamente ou contacte o administrador.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button className="w-full" onClick={reset}>
            Tentar novamente
          </Button>
          <Button asChild className="w-full" variant="outline">
            <Link href={"/forgot-password" as Route}>Voltar</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
