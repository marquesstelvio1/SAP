"use client";

import { ErrorCard } from "@saptm/ui";

export default function SubscriptionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorCard
      title="Erro na subscrição"
      message={error.message ?? "Ocorreu um erro inesperado ao carregar a página de subscrição."}
      onRetry={reset}
    />
  );
}
