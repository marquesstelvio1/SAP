"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    try {
      Sentry.captureException(error);
    } catch {
      // Cannot report error during prerendering
    }
  }, [error]);

  return (
    <html lang="pt">
      <body className="flex h-screen items-center justify-center flex-col gap-4">
        <h1 className="text-2xl font-semibold">Erro inesperado</h1>
        <p className="text-muted-foreground">Ocorreu um erro inesperado. Tente novamente.</p>
      </body>
    </html>
  );
}
