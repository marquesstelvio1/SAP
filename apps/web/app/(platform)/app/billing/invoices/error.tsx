"use client";

import { ErrorCard } from "@saptm/ui";

export default function InvoicesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorCard
      title="Erro nas faturas"
      message={error.message ?? "Ocorreu um erro inesperado ao carregar as faturas."}
      onRetry={reset}
    />
  );
}
