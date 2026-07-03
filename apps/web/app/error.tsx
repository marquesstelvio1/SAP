"use client";

import { useEffect } from "react";
import { Button, Card } from "@saptm/ui";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root error caught:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4" role="alert">
      <Card className="flex flex-col items-center justify-center gap-4 p-8 max-w-md">
        <h2 className="text-lg font-semibold">Erro inesperado</h2>
        <p className="text-muted-foreground text-sm text-center">
          Ocorreu um erro ao processar o seu pedido. Tente novamente.
        </p>
        {process.env.NODE_ENV === "development" && error.message && (
          <p className="text-destructive text-xs max-w-lg break-all font-mono">{error.message}</p>
        )}
        <Button onClick={reset}>Tentar novamente</Button>
      </Card>
    </main>
  );
}
