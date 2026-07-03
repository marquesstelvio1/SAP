"use client";

import { ErrorCard } from "@saptm/ui";

export default function SsoError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorCard
      title="Erro na configuração SSO"
      message={
        error.message ?? "Ocorreu um erro inesperado ao carregar a página de configuração SSO."
      }
      onRetry={reset}
    />
  );
}
