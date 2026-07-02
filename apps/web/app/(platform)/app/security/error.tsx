"use client";

import { ErrorCard } from "@saptm/ui";

export default function ErrorPage({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorCard onRetry={reset} />;
}
