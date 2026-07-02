"use client";

import { ErrorCard } from "@saptm/ui";

export default function ErrorPage({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <ErrorCard onRetry={reset} />
    </main>
  );
}
