"use client";

import { Button, Card } from "@saptm/ui";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Platform error caught:", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 p-4" role="alert">
      <Card className="flex flex-col items-center justify-center gap-4 p-8">
        <h2 className="text-lg font-semibold">Erro inesperado</h2>
        <p className="text-muted-foreground text-sm max-w-md text-center">
          Ocorreu um erro ao processar o seu pedido. Tente novamente ou contacte o suporte se o
          problema persistir.
        </p>
        {process.env.NODE_ENV === "development" && error.message && (
          <p className="text-destructive text-xs max-w-lg break-all font-mono">{error.message}</p>
        )}
        <div className="flex gap-2">
          <Button onClick={reset}>Tentar novamente</Button>
          <Button
            variant="outline"
            onClick={() => {
              window.location.href = "/app";
            }}
          >
            Ir para o painel
          </Button>
        </div>
      </Card>
    </div>
  );
}
