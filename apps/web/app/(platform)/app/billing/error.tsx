"use client";

import { ErrorCard } from "@saptm/ui";

/**
 * Error boundary for /app/billing
 */
export default function BillingOverviewError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorCard
      title="Erro na facturação"
      message={error.message ?? "Ocorreu um erro inesperado ao carregar a página de facturação."}
      onRetry={reset}
    />
  );
}
