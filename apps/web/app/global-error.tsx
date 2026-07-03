"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="pt">
      <body className="flex h-screen items-center justify-center flex-col gap-4">
        <h1 className="text-2xl font-semibold">Erro inesperado</h1>
        <p className="text-muted-foreground">Ocorreu um erro inesperado. Tente novamente.</p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
          type="button"
        >
          Tentar novamente
        </button>
      </body>
    </html>
  );
}
